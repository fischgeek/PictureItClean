import { Router } from "express";
import multer from "multer";
import { repos } from "../repositories";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { absolutePhotoPath, deletePhotoFiles, savePhoto } from "../services/storage";

export const areasRouter = Router();
areasRouter.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

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

areasRouter.post("/areas/:areaId/photo", requireRole("area", "areaId", "editor"), upload.single("photo"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "photo file is required (field name 'photo')" });
    return;
  }
  const current = repos.areas.findById(req.params.areaId)!;
  const stored = await savePhoto(req.params.areaId, req.file.buffer);
  deletePhotoFiles(current.photoPath, current.thumbnailPath);
  const area = repos.areas.update(req.params.areaId, { photoPath: stored.filePath, thumbnailPath: stored.thumbnailPath });
  res.status(201).json(area);
});

areasRouter.delete("/areas/:areaId/photo", requireRole("area", "areaId", "editor"), (req, res) => {
  const current = repos.areas.findById(req.params.areaId)!;
  deletePhotoFiles(current.photoPath, current.thumbnailPath);
  const area = repos.areas.update(req.params.areaId, { photoPath: null, thumbnailPath: null });
  res.json(area);
});

function serveAreaPhoto(field: "photoPath" | "thumbnailPath") {
  return (req: any, res: any) => {
    const area = repos.areas.findById(req.params.areaId);
    if (!area || !area[field]) {
      res.status(404).json({ error: "photo not found" });
      return;
    }
    res.sendFile(absolutePhotoPath(area[field]!));
  };
}

areasRouter.get("/areas/:areaId/photo/file", requireRole("area", "areaId", "viewer"), serveAreaPhoto("photoPath"));
areasRouter.get(
  "/areas/:areaId/photo/thumbnail",
  requireRole("area", "areaId", "viewer"),
  serveAreaPhoto("thumbnailPath")
);
