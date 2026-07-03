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

dashboardRouter.get("/dashboard", (req, res) => {
  const userId = req.user!.id;
  const buildings = repos.buildings.listForUser(userId);
  const rollups = buildFullRollup(buildings);
  const allSpaceIds = flattenSpaces(rollups).map((s) => s.spaceId);

  const overdueSpaces = overdueList(rollups, 10);
  const trend = verificationTrend(allSpaceIds, 14);
  const activity = activityByUser(allSpaceIds);
  const complianceByBuilding = rollups.map((b) => ({ buildingId: b.id, name: b.name, percent: b.percent }));

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

  res.json({
    myAssignment,
    hasAssignmentPool,
    overdueSpaces,
    complianceByBuilding,
    verificationTrend: trend,
    activityByUser: activity,
  });
});
