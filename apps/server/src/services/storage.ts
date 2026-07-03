import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { v4 as uuid } from "uuid";
import { photosDir } from "../db";

export interface StoredPhoto {
  filePath: string; // relative path, stored in DB, served via /api/photos/file/:relpath
  thumbnailPath: string;
}

/** Local-disk photo storage. Swap this module for a different backend (e.g. Jira attachments) without touching routes. */
export async function savePhoto(spaceId: string, buffer: Buffer): Promise<StoredPhoto> {
  const spaceDir = path.join(photosDir, spaceId);
  fs.mkdirSync(spaceDir, { recursive: true });

  const id = uuid();
  const fileName = `${id}.jpg`;
  const thumbName = `${id}_thumb.jpg`;

  const fullPath = path.join(spaceDir, fileName);
  const thumbPath = path.join(spaceDir, thumbName);

  await sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(fullPath);
  await sharp(buffer).rotate().resize({ width: 400, withoutEnlargement: true }).jpeg({ quality: 75 }).toFile(thumbPath);

  return {
    filePath: path.join(spaceId, fileName).split(path.sep).join("/"),
    thumbnailPath: path.join(spaceId, thumbName).split(path.sep).join("/"),
  };
}

export function absolutePhotoPath(relPath: string): string {
  return path.join(photosDir, relPath);
}
