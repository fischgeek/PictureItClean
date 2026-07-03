import { Router } from "express";
import { repos } from "../repositories";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

export const buildingsRouter = Router();
buildingsRouter.use(requireAuth);

buildingsRouter.get("/", (req, res) => {
  res.json(repos.buildings.listForUser(req.user!.id));
});

buildingsRouter.post("/", (req, res) => {
  const { name } = req.body ?? {};
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const building = repos.buildings.create({ name, createdBy: req.user!.id });
  repos.memberships.create({ userId: req.user!.id, resourceType: "building", resourceId: building.id, role: "owner" });
  res.status(201).json(building);
});

buildingsRouter.get("/:buildingId", requireRole("building", "buildingId", "viewer"), (req, res) => {
  res.json(repos.buildings.findById(req.params.buildingId));
});

buildingsRouter.patch("/:buildingId", requireRole("building", "buildingId", "editor"), (req, res) => {
  const { name } = req.body ?? {};
  res.json(repos.buildings.update(req.params.buildingId, { name }));
});

buildingsRouter.delete("/:buildingId", requireRole("building", "buildingId", "owner"), (req, res) => {
  repos.buildings.delete(req.params.buildingId);
  res.status(204).send();
});
