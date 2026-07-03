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

function computeAssignment(userId: string) {
  const assignedSpaceIds = resolveAssignedSpaceIds(userId);
  const hasAssignmentPool = assignedSpaceIds.length > 0;
  const today = todayIso();

  let active = repos.dailyAssignments.findActive(userId, today);
  if (!active && hasAssignmentPool) {
    const pick = pickWeightedRandomSpace(assignedSpaceIds);
    if (pick) active = repos.dailyAssignments.create({ userId, spaceId: pick, assignedDate: today });
  }

  let myAssignment = null;
  if (active) {
    const space = repos.spaces.findById(active.spaceId);
    if (space) {
      const area = repos.areas.findById(space.areaId);
      const building = area ? repos.buildings.findById(area.buildingId) : null;
      const checklistItems = repos.checklistItems.listBySpace(space.id);
      const currentPhoto = space.currentPhotoId ? repos.photos.findById(space.currentPhotoId) : null;
      const lastVerifiedAt = latestVerifiedMap([space.id]).get(space.id) ?? null;
      myAssignment = {
        space,
        area,
        building,
        checklistItems,
        currentPhoto,
        lastVerifiedAt,
        assignedDate: active.assignedDate,
      };
    }
  }

  return { myAssignment, hasAssignmentPool };
}

dashboardRouter.get("/dashboard", (req, res) => {
  const userId = req.user!.id;

  const rollups = safe("buildFullRollup", () => buildFullRollup(repos.buildings.listForUser(userId)), []);
  const allSpaceIds = flattenSpaces(rollups).map((s) => s.spaceId);

  const overdueSpaces = safe("overdueList", () => overdueList(rollups, 10), []);
  const trend = safe("verificationTrend", () => verificationTrend(allSpaceIds, 14), []);
  const activity = safe("activityByUser", () => activityByUser(allSpaceIds), []);
  const complianceByBuilding = rollups.map((b) => ({ buildingId: b.id, name: b.name, percent: b.percent }));
  const { myAssignment, hasAssignmentPool } = safe(
    "computeAssignment",
    () => computeAssignment(userId),
    { myAssignment: null, hasAssignmentPool: false }
  );

  res.json({
    myAssignment,
    hasAssignmentPool,
    overdueSpaces,
    complianceByBuilding,
    verificationTrend: trend,
    activityByUser: activity,
  });
});
