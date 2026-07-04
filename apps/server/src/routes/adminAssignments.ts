import { Router } from "express";
import { ResourceType } from "../domain/types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { repos } from "../repositories";
import { resolveAssignedSpaceIds } from "../services/stats";

// Mounted at /api/admin -- a distinct prefix (not bare /api) so this router's blanket
// requireAdmin can never intercept unrelated non-admin endpoints registered elsewhere.
export const adminAssignmentsRouter = Router();
adminAssignmentsRouter.use(requireAuth, requireAdmin);

const VALID_TYPES: ResourceType[] = ["building", "area", "space"];

function resourceName(resourceType: ResourceType, resourceId: string): string | null {
  if (resourceType === "building") return repos.buildings.findById(resourceId)?.name ?? null;
  if (resourceType === "area") return repos.areas.findById(resourceId)?.name ?? null;
  return repos.spaces.findById(resourceId)?.name ?? null;
}

// Full building > area > space tree, independent of the caller's own memberships -- this is an
// admin-only picker for deciding who gets assigned what across the whole system.
adminAssignmentsRouter.get("/assignment-options", (req, res) => {
  const buildings = repos.buildings.listAll().map((building) => ({
    ...building,
    areas: repos.areas.listByBuilding(building.id).map((area) => ({
      ...area,
      spaces: repos.spaces.listByArea(area.id),
    })),
  }));
  res.json(buildings);
});

adminAssignmentsRouter.get("/assignments/:userId", (req, res) => {
  if (!repos.users.findById(req.params.userId)) {
    res.status(404).json({ error: "user not found" });
    return;
  }
  const items = repos.assignments.listForUser(req.params.userId).map((a) => ({
    ...a,
    resourceName: resourceName(a.resourceType, a.resourceId),
  }));
  res.json(items);
});

adminAssignmentsRouter.put("/assignments/:userId", (req, res) => {
  const targetUser = repos.users.findById(req.params.userId);
  if (!targetUser) {
    res.status(404).json({ error: "user not found" });
    return;
  }
  const items = Array.isArray(req.body?.items) ? req.body.items : null;
  if (!items || !items.every((i: any) => VALID_TYPES.includes(i?.resourceType) && typeof i?.resourceId === "string")) {
    res.status(400).json({ error: "items must be an array of { resourceType, resourceId }" });
    return;
  }

  repos.assignments.replaceForUser(targetUser.id, items, req.user!.id);

  // Spaces dropped from the pool must stop showing up immediately -- otherwise an
  // already-issued daily_assignments row lingers on the dashboard forever, since nothing
  // else ever revisits it once created.
  const keepSpaceIds = resolveAssignedSpaceIds(targetUser.id);
  repos.dailyAssignments.deleteActiveNotIn(targetUser.id, keepSpaceIds);

  // Assigning implies access: grant at-least-viewer membership on each assigned resource,
  // without ever downgrading an existing higher role (editor/owner).
  for (const item of items) {
    if (!repos.memberships.findExact(targetUser.id, item.resourceType, item.resourceId)) {
      repos.memberships.create({
        userId: targetUser.id,
        resourceType: item.resourceType,
        resourceId: item.resourceId,
        role: "viewer",
      });
    }
  }

  const result = repos.assignments
    .listForUser(targetUser.id)
    .map((a) => ({ ...a, resourceName: resourceName(a.resourceType, a.resourceId) }));
  res.json(result);
});
