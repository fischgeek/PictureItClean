import { Router } from "express";
import { repos } from "../repositories";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

export const areasRouter = Router();
areasRouter.use(requireAuth);

// Nested under a building
areasRouter.get("/buildings/:buildingId/areas", requireRole("building", "buildingId", "viewer"), (req, res) => {
  res.json(repos.areas.listByBuilding(req.params.buildingId));
});

areasRouter.post("/buildings/:buildingId/areas", requireRole("building", "buildingId", "editor"), (req, res) => {
  const { name, sortOrder } = req.body ?? {};
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const existing = repos.areas.listByBuilding(req.params.buildingId);
  const area = repos.areas.create({ buildingId: req.params.buildingId, name, sortOrder: sortOrder ?? existing.length });
  res.status(201).json(area);
});

// Standalone area resource
areasRouter.get("/areas/:areaId", requireRole("area", "areaId", "viewer"), (req, res) => {
  res.json(repos.areas.findById(req.params.areaId));
});

areasRouter.patch("/areas/:areaId", requireRole("area", "areaId", "editor"), (req, res) => {
  const { name, sortOrder } = req.body ?? {};
  res.json(repos.areas.update(req.params.areaId, { name, sortOrder }));
});

areasRouter.delete("/areas/:areaId", requireRole("area", "areaId", "editor"), (req, res) => {
  repos.areas.delete(req.params.areaId);
  res.status(204).send();
});
