import { Router } from "express";
import { repos } from "../repositories";
import { requireAuth } from "../middleware/auth";
import {
  activityByUser,
  buildFullRollup,
  flattenSpaces,
  latestVerifiedMap,
  overdueList,
  pickWeightedRandomSpace,
  resolveAssignedSpaceIds,
  todayIso,
  tomorrowIso,
  verificationTrend,
} from "../services/stats";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

/** Runs a dashboard section in isolation: a bug or edge case in one chart/section should
 * degrade that section, not blank the whole page. Logs the real error so it's visible in
 * `docker logs`/Portainer even though the client only sees the fallback value. */
function safe<T>(label: string, fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (err) {
    console.error(`[dashboard] ${label} failed:`, err);
    return fallback;
  }
}

function buildAssignmentDetail(active: { id: string; spaceId: string; assignedDate: string }) {
  const space = repos.spaces.findById(active.spaceId);
  if (!space) return null;
  const area = repos.areas.findById(space.areaId);
  const building = area ? repos.buildings.findById(area.buildingId) : null;
  const checklistItems = repos.checklistItems.listBySpace(space.id);
  const currentPhoto = space.currentPhotoId ? repos.photos.findById(space.currentPhotoId) : null;
  const lastVerifiedAt = latestVerifiedMap([space.id]).get(space.id) ?? null;
  return {
    id: active.id,
    space,
    area,
    building,
    checklistItems,
    currentPhoto,
    lastVerifiedAt,
    assignedDate: active.assignedDate,
  };
}

/** Pending (not-yet-completed) assignments carry forward day to day if ignored -- ignoring one
 * doesn't lose it, it just keeps showing up as overdue. A brand-new assignment (a space the user
 * has never been issued before) shows up immediately rather than waiting for the daily rotation --
 * that throttle (one new pick per calendar day, skipping just reschedules rather than replacing)
 * only applies once every space in the pool has been introduced at least once. */
function computeAssignment(userId: string) {
  const assignedSpaceIds = resolveAssignedSpaceIds(userId);
  const hasAssignmentPool = assignedSpaceIds.length > 0;
  const today = todayIso();

  if (hasAssignmentPool) {
    const everIssued = new Set(repos.dailyAssignments.listIssuedSpaceIds(userId));
    const brandNew = assignedSpaceIds.filter((id) => !everIssued.has(id));
    for (const spaceId of brandNew) {
      repos.dailyAssignments.create({ userId, spaceId, assignedDate: today });
    }

    if (brandNew.length === 0 && !repos.dailyAssignments.hasAnyForDate(userId, today)) {
      // Exclude spaces with ANY active row, not just ones due today/overdue -- a skipped
      // assignment is active but dated in the future, and must still block a second pick.
      const alreadyPendingSpaceIds = repos.dailyAssignments.listActiveSpaceIds(userId);
      const pick = pickWeightedRandomSpace(assignedSpaceIds, alreadyPendingSpaceIds);
      if (pick) repos.dailyAssignments.create({ userId, spaceId: pick, assignedDate: today });
    }
  }

  const assignments = repos.dailyAssignments
    .listActive(userId, today)
    .map(buildAssignmentDetail)
    .filter((a): a is NonNullable<typeof a> => a !== null);

  const pendingTotalMinutes = assignments.reduce(
    (sum, a) => sum + a.checklistItems.reduce((s, i) => s + i.estimatedMinutes, 0),
    0
  );

  return { assignments, hasAssignmentPool, pendingCount: assignments.length, pendingTotalMinutes };
}

dashboardRouter.get("/dashboard", (req, res) => {
  const userId = req.user!.id;

  const rollups = safe("buildFullRollup", () => buildFullRollup(repos.buildings.listForUser(userId)), []);
  const allSpaceIds = flattenSpaces(rollups).map((s) => s.spaceId);

  const overdueSpaces = safe("overdueList", () => overdueList(rollups, 10), []);
  const trend = safe("verificationTrend", () => verificationTrend(allSpaceIds, 14), []);
  const activity = safe("activityByUser", () => activityByUser(allSpaceIds), []);
  const complianceByBuilding = rollups.map((b) => ({ buildingId: b.id, name: b.name, percent: b.percent }));
  const { assignments, hasAssignmentPool, pendingCount, pendingTotalMinutes } = safe(
    "computeAssignment",
    () => computeAssignment(userId),
    { assignments: [], hasAssignmentPool: false, pendingCount: 0, pendingTotalMinutes: 0 }
  );

  res.json({
    assignments,
    hasAssignmentPool,
    pendingCount,
    pendingTotalMinutes,
    overdueSpaces,
    complianceByBuilding,
    verificationTrend: trend,
    activityByUser: activity,
  });
});

dashboardRouter.post("/assignments/:id/skip", (req, res) => {
  const assignment = repos.dailyAssignments.findById(req.params.id);
  if (!assignment || assignment.userId !== req.user!.id) {
    res.status(404).json({ error: "assignment not found" });
    return;
  }
  if (assignment.completedAt) {
    res.status(400).json({ error: "already completed" });
    return;
  }
  const updated = repos.dailyAssignments.reschedule(assignment.id, tomorrowIso());
  res.json(updated ?? { id: assignment.id, dropped: true });
});
