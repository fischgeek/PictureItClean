import { Router } from "express";
import multer from "multer";
import { repos } from "../repositories";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { absolutePhotoPath, deletePhotoFiles, savePhoto } from "../services/storage";
import { effectiveRole } from "../services/accessControl";

export const buildingsRouter = Router();
buildingsRouter.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

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
  const building = repos.buildings.findById(req.params.buildingId);
  const myRole = effectiveRole(req.user!.id, "building", req.params.buildingId);
  res.json({ ...building, myRole });
});

buildingsRouter.patch("/:buildingId", requireRole("building", "buildingId", "editor"), (req, res) => {
  const { name } = req.body ?? {};
  res.json(repos.buildings.update(req.params.buildingId, { name }));
});

buildingsRouter.delete("/:buildingId", requireRole("building", "buildingId", "owner"), (req, res) => {
  repos.buildings.delete(req.params.buildingId);
  res.status(204).send();
});

buildingsRouter.post(
  "/:buildingId/photo",
  requireRole("building", "buildingId", "editor"),
  upload.single("photo"),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "photo file is required (field name 'photo')" });
      return;
    }
    const current = repos.buildings.findById(req.params.buildingId)!;
    const stored = await savePhoto(req.params.buildingId, req.file.buffer);
    deletePhotoFiles(current.photoPath, current.thumbnailPath);
    const building = repos.buildings.update(req.params.buildingId, {
      photoPath: stored.filePath,
      thumbnailPath: stored.thumbnailPath,
    });
    res.status(201).json(building);
  }
);

buildingsRouter.delete("/:buildingId/photo", requireRole("building", "buildingId", "editor"), (req, res) => {
  const current = repos.buildings.findById(req.params.buildingId)!;
  deletePhotoFiles(current.photoPath, current.thumbnailPath);
  const building = repos.buildings.update(req.params.buildingId, { photoPath: null, thumbnailPath: null });
  res.json(building);
});

function serveBuildingPhoto(field: "photoPath" | "thumbnailPath") {
  return (req: any, res: any) => {
    const building = repos.buildings.findById(req.params.buildingId);
    if (!building || !building[field]) {
      res.status(404).json({ error: "photo not found" });
      return;
    }
    res.sendFile(absolutePhotoPath(building[field]!));
  };
}

buildingsRouter.get(
  "/:buildingId/photo/file",
  requireRole("building", "buildingId", "viewer"),
  serveBuildingPhoto("photoPath")
);
buildingsRouter.get(
  "/:buildingId/photo/thumbnail",
  requireRole("building", "buildingId", "viewer"),
  serveBuildingPhoto("thumbnailPath")
);
