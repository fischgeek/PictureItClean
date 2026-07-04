import { v4 as uuid } from "uuid";
import { db } from "../../db";
import { AreaRepository } from "../interfaces";
import { mapArea } from "./rowMappers";

export class SqliteAreaRepository implements AreaRepository {
  create(input: { buildingId: string; name: string; sortOrder: number }) {
    const id = uuid();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO areas (id, building_id, name, sort_order, created_at) VALUES (?, ?, ?, ?, ?)`
    ).run(id, input.buildingId, input.name, input.sortOrder, createdAt);
    return this.findById(id)!;
  }

  findById(id: string) {
    const row = db.prepare(`SELECT * FROM areas WHERE id = ?`).get(id);
    return row ? mapArea(row) : null;
  }

  listByBuilding(buildingId: string) {
    const rows = db
      .prepare(`SELECT * FROM areas WHERE building_id = ? ORDER BY sort_order ASC, created_at ASC`)
      .all(buildingId);
    return rows.map(mapArea);
  }

  update(
    id: string,
    input: Partial<{ name: string; sortOrder: number; photoPath: string | null; thumbnailPath: string | null }>
  ) {
    const current = this.findById(id)!;
    const name = input.name ?? current.name;
    const sortOrder = input.sortOrder ?? current.sortOrder;
    const photoPath = input.photoPath === undefined ? current.photoPath : input.photoPath;
    const thumbnailPath = input.thumbnailPath === undefined ? current.thumbnailPath : input.thumbnailPath;
    db.prepare(`UPDATE areas SET name = ?, sort_order = ?, photo_path = ?, thumbnail_path = ? WHERE id = ?`).run(
      name,
      sortOrder,
      photoPath,
      thumbnailPath,
      id
    );
    return this.findById(id)!;
  }

  delete(id: string) {
    db.prepare(`DELETE FROM areas WHERE id = ?`).run(id);
  }
}
