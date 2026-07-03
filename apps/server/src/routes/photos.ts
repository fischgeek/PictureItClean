import { Router } from "express";
import multer from "multer";
import { repos } from "../repositories";
import { requireAuth } from "../middleware/auth";
import { hasRole } from "../services/accessControl";
import { absolutePhotoPath, savePhoto } from "../services/storage";

export const photosRouter = Router();
photosRouter.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

photosRouter.post("/spaces/:spaceId/photo", upload.single("photo"), async (req, res) => {
  if (!hasRole(req.user!.id, "space", req.params.spaceId, "editor")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "photo file is required (field name 'photo')" });
    return;
  }
  const stored = await savePhoto(req.params.spaceId, req.file.buffer);
  const photo = repos.photos.create({
    spaceId: req.params.spaceId,
    filePath: stored.filePath,
    thumbnailPath: stored.thumbnailPath,
    uploadedBy: req.user!.id,
  });
  repos.spaces.update(req.params.spaceId, { currentPhotoId: photo.id });
  res.status(201).json(photo);
});

photosRouter.get("/spaces/:spaceId/photos", (req, res) => {
  if (!hasRole(req.user!.id, "space", req.params.spaceId, "viewer")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(repos.photos.listBySpace(req.params.spaceId));
});

function servePhotoFile(field: "filePath" | "thumbnailPath") {
  return (req: any, res: any) => {
    const photo = repos.photos.findById(req.params.photoId);
    if (!photo) {
      res.status(404).json({ error: "photo not found" });
      return;
    }
    if (!hasRole(req.user!.id, "space", photo.spaceId, "viewer")) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    res.sendFile(absolutePhotoPath(photo[field]));
  };
}

photosRouter.get("/photos/:photoId/file", servePhotoFile("filePath"));
photosRouter.get("/photos/:photoId/thumbnail", servePhotoFile("thumbnailPath"));
