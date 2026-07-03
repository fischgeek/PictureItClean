import { Router } from "express";
import { repos } from "../repositories";
import { requireAuth } from "../middleware/auth";
import { effectiveRole, roleAtLeast } from "../services/accessControl";
import { ResourceType, Role } from "../domain/types";

export const invitesRouter = Router();
invitesRouter.use(requireAuth);

const VALID_TYPES: ResourceType[] = ["building", "area", "space"];
const VALID_ROLES: Role[] = ["viewer", "editor", "owner"];

function resourceName(resourceType: ResourceType, resourceId: string): string | null {
  if (resourceType === "building") return repos.buildings.findById(resourceId)?.name ?? null;
  if (resourceType === "area") return repos.areas.findById(resourceId)?.name ?? null;
  return repos.spaces.findById(resourceId)?.name ?? null;
}

invitesRouter.post("/:resourceType/:resourceId/share", (req, res) => {
  const resourceType = req.params.resourceType as ResourceType;
  if (!VALID_TYPES.includes(resourceType)) {
    res.status(400).json({ error: "invalid resource type" });
    return;
  }
  const role: Role = VALID_ROLES.includes(req.body?.role) ? req.body.role : "viewer";
  const myRole = effectiveRole(req.user!.id, resourceType, req.params.resourceId);
  if (!myRole || !roleAtLeast(myRole, "editor") || !roleAtLeast(myRole, role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const invite = repos.invites.create({
    resourceType,
    resourceId: req.params.resourceId,
    role,
    createdBy: req.user!.id,
    expiresAt: null,
  });
  res.status(201).json(invite);
});

invitesRouter.get("/invite/:token", (req, res) => {
  const invite = repos.invites.findByToken(req.params.token);
  if (!invite) {
    res.status(404).json({ error: "invite not found" });
    return;
  }
  res.json({ ...invite, resourceName: resourceName(invite.resourceType, invite.resourceId) });
});

invitesRouter.post("/invite/:token/accept", (req, res) => {
  const invite = repos.invites.findByToken(req.params.token);
  if (!invite) {
    res.status(404).json({ error: "invite not found" });
    return;
  }
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    res.status(410).json({ error: "invite expired" });
    return;
  }
  const membership = repos.memberships.create({
    userId: req.user!.id,
    resourceType: invite.resourceType,
    resourceId: invite.resourceId,
    role: invite.role,
  });
  res.status(201).json(membership);
});
