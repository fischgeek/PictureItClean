import { v4 as uuid } from "uuid";
import { db } from "../../db";
import { SpaceRepository } from "../interfaces";
import { mapSpace } from "./rowMappers";

export class SqliteSpaceRepository implements SpaceRepository {
  create(input: { areaId: string; name: string; sortOrder: number }) {
    const id = uuid();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO spaces (id, area_id, name, sort_order, current_photo_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?)`
    ).run(id, input.areaId, input.name, input.sortOrder, now, now);
    return this.findById(id)!;
  }

  findById(id: string) {
    const row = db.prepare(`SELECT * FROM spaces WHERE id = ?`).get(id);
    return row ? mapSpace(row) : null;
  }

  listByArea(areaId: string) {
    const rows = db
      .prepare(`SELECT * FROM spaces WHERE area_id = ? ORDER BY sort_order ASC, created_at ASC`)
      .all(areaId);
    return rows.map(mapSpace);
  }

  update(id: string, input: Partial<{ name: string; sortOrder: number; currentPhotoId: string | null }>) {
    const current = this.findById(id)!;
    const name = input.name ?? current.name;
    const sortOrder = input.sortOrder ?? current.sortOrder;
    const currentPhotoId = input.currentPhotoId === undefined ? current.currentPhotoId : input.currentPhotoId;
    db.prepare(`UPDATE spaces SET name = ?, sort_order = ?, current_photo_id = ?, updated_at = ? WHERE id = ?`).run(
      name,
      sortOrder,
      currentPhotoId,
      new Date().toISOString(),
      id
    );
    return this.findById(id)!;
  }

  delete(id: string) {
    db.prepare(`DELETE FROM spaces WHERE id = ?`).run(id);
  }
}
