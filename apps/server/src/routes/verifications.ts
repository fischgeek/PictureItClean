import { Router } from "express";
import { repos } from "../repositories";
import { requireAuth } from "../middleware/auth";
import { hasRole } from "../services/accessControl";
import { todayIso } from "../services/stats";

export const verificationsRouter = Router();
verificationsRouter.use(requireAuth);

verificationsRouter.get("/spaces/:spaceId/verifications", (req, res) => {
  if (!hasRole(req.user!.id, "space", req.params.spaceId, "viewer")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const events = repos.verificationEvents.listBySpace(req.params.spaceId);
  const withUsers = events.map((e) => ({ ...e, user: repos.users.findById(e.userId) }));
  res.json(withUsers);
});

verificationsRouter.post("/spaces/:spaceId/verify", (req, res) => {
  if (!hasRole(req.user!.id, "space", req.params.spaceId, "viewer")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { checkedItemIds, note } = req.body ?? {};
  const items = repos.checklistItems.listBySpace(req.params.spaceId);
  const checkedSet = new Set<string>(Array.isArray(checkedItemIds) ? checkedItemIds : []);
  const snapshot = items.map((item) => ({
    id: item.id,
    text: item.text,
    estimatedMinutes: item.estimatedMinutes,
    checked: checkedSet.has(item.id),
  }));
  const event = repos.verificationEvents.create({
    spaceId: req.params.spaceId,
    userId: req.user!.id,
    checklistSnapshot: snapshot,
    note: typeof note === "string" && note.trim() ? note.trim() : null,
  });
  repos.dailyAssignments.markCompleted(req.user!.id, req.params.spaceId, todayIso());
  res.status(201).json(event);
});
