import { v4 as uuid } from "uuid";
import { db } from "../../db";
import { PhotoRepository } from "../interfaces";
import { mapPhoto } from "./rowMappers";

export class SqlitePhotoRepository implements PhotoRepository {
  create(input: { spaceId: string; filePath: string; thumbnailPath: string; uploadedBy: string }) {
    const id = uuid();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO photos (id, space_id, file_path, thumbnail_path, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, input.spaceId, input.filePath, input.thumbnailPath, input.uploadedBy, createdAt);
    return this.findById(id)!;
  }

  findById(id: string) {
    const row = db.prepare(`SELECT * FROM photos WHERE id = ?`).get(id);
    return row ? mapPhoto(row) : null;
  }

  listBySpace(spaceId: string) {
    const rows = db.prepare(`SELECT * FROM photos WHERE space_id = ? ORDER BY created_at DESC`).all(spaceId);
    return rows.map(mapPhoto);
  }
}
