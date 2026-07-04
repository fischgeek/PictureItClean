import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { v4 as uuid } from "uuid";
import { photosDir } from "../db";

export interface StoredPhoto {
  filePath: string; // relative path, stored in DB
  thumbnailPath: string;
}

/** Local-disk photo storage, namespaced by owning resource id (a space/area/building id -- any
 * UUID works as a folder name). Swap this module for a different backend (e.g. Jira attachments)
 * without touching routes. */
export async function savePhoto(ownerId: string, buffer: Buffer): Promise<StoredPhoto> {
  const ownerDir = path.join(photosDir, ownerId);
  fs.mkdirSync(ownerDir, { recursive: true });

  const id = uuid();
  const fileName = `${id}.jpg`;
  const thumbName = `${id}_thumb.jpg`;

  const fullPath = path.join(ownerDir, fileName);
  const thumbPath = path.join(ownerDir, thumbName);

  await sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(fullPath);
  await sharp(buffer).rotate().resize({ width: 400, withoutEnlargement: true }).jpeg({ quality: 75 }).toFile(thumbPath);

  return {
    filePath: path.join(ownerId, fileName).split(path.sep).join("/"),
    thumbnailPath: path.join(ownerId, thumbName).split(path.sep).join("/"),
  };
}

export function absolutePhotoPath(relPath: string): string {
  return path.join(photosDir, relPath);
}

/** Best-effort disk cleanup -- failures are swallowed since the DB row is the source of truth. */
export function deletePhotoFiles(...relPaths: (string | null | undefined)[]) {
  for (const relPath of relPaths) {
    if (!relPath) continue;
    try {
      fs.unlinkSync(absolutePhotoPath(relPath));
    } catch {
      // ignore
    }
  }
}
