import { Router } from "express";
import { repos } from "../repositories";
import { requireAuth } from "../middleware/auth";
import { hasRole, NotFoundError } from "../services/accessControl";

export const checklistItemsRouter = Router();
checklistItemsRouter.use(requireAuth);

checklistItemsRouter.get("/spaces/:spaceId/checklist-items", (req, res) => {
  if (!hasRole(req.user!.id, "space", req.params.spaceId, "viewer")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(repos.checklistItems.listBySpace(req.params.spaceId));
});

checklistItemsRouter.post("/spaces/:spaceId/checklist-items", (req, res) => {
  if (!hasRole(req.user!.id, "space", req.params.spaceId, "editor")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { text, estimatedMinutes } = req.body ?? {};
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "text is required" });
    return;
  }
  const existing = repos.checklistItems.listBySpace(req.params.spaceId);
  const item = repos.checklistItems.create({
    spaceId: req.params.spaceId,
    text,
    estimatedMinutes: Number(estimatedMinutes) || 5,
    sortOrder: existing.length,
  });
  res.status(201).json(item);
});

function requireItemEditor(req: any, res: any): boolean {
  const item = repos.checklistItems.findById(req.params.itemId);
  if (!item) {
    res.status(404).json({ error: "checklist item not found" });
    return false;
  }
  if (!hasRole(req.user!.id, "space", item.spaceId, "editor")) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

checklistItemsRouter.patch("/checklist-items/:itemId", (req, res) => {
  try {
    if (!requireItemEditor(req, res)) return;
    const { text, estimatedMinutes, sortOrder } = req.body ?? {};
    res.json(
      repos.checklistItems.update(req.params.itemId, {
        text,
        estimatedMinutes: estimatedMinutes !== undefined ? Number(estimatedMinutes) : undefined,
        sortOrder,
      })
    );
  } catch (err) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    throw err;
  }
});

checklistItemsRouter.delete("/checklist-items/:itemId", (req, res) => {
  if (!requireItemEditor(req, res)) return;
  repos.checklistItems.delete(req.params.itemId);
  res.status(204).send();
});
