import { Router } from "express";
import { repos } from "../repositories";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

export const spacesRouter = Router();
spacesRouter.use(requireAuth);

spacesRouter.get("/areas/:areaId/spaces", requireRole("area", "areaId", "viewer"), (req, res) => {
  const spaces = repos.spaces.listByArea(req.params.areaId);
  const withPhotos = spaces.map((space) => ({
    ...space,
    currentPhoto: space.currentPhotoId ? repos.photos.findById(space.currentPhotoId) : null,
  }));
  res.json(withPhotos);
});

spacesRouter.post("/areas/:areaId/spaces", requireRole("area", "areaId", "editor"), (req, res) => {
  const { name, sortOrder, frequencyDays } = req.body ?? {};
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const existing = repos.spaces.listByArea(req.params.areaId);
  const space = repos.spaces.create({
    areaId: req.params.areaId,
    name,
    sortOrder: sortOrder ?? existing.length,
    frequencyDays: frequencyDays !== undefined ? Number(frequencyDays) : undefined,
  });
  res.status(201).json(space);
});

spacesRouter.get("/spaces/:spaceId", requireRole("space", "spaceId", "viewer"), (req, res) => {
  const space = repos.spaces.findById(req.params.spaceId)!;
  const checklistItems = repos.checklistItems.listBySpace(space.id);
  const currentPhoto = space.currentPhotoId ? repos.photos.findById(space.currentPhotoId) : null;
  res.json({ ...space, checklistItems, currentPhoto });
});

spacesRouter.patch("/spaces/:spaceId", requireRole("space", "spaceId", "editor"), (req, res) => {
  const { name, sortOrder, frequencyDays } = req.body ?? {};
  res.json(
    repos.spaces.update(req.params.spaceId, {
      name,
      sortOrder,
      frequencyDays: frequencyDays !== undefined ? Number(frequencyDays) : undefined,
    })
  );
});

spacesRouter.delete("/spaces/:spaceId", requireRole("space", "spaceId", "editor"), (req, res) => {
  repos.spaces.delete(req.params.spaceId);
  res.status(204).send();
});
