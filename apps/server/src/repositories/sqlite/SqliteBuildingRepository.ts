import { v4 as uuid } from "uuid";
import { db } from "../../db";
import { BuildingRepository } from "../interfaces";
import { mapBuilding } from "./rowMappers";

export class SqliteBuildingRepository implements BuildingRepository {
  create(input: { name: string; createdBy: string }) {
    const id = uuid();
    const createdAt = new Date().toISOString();
    db.prepare(`INSERT INTO buildings (id, name, created_by, created_at) VALUES (?, ?, ?, ?)`).run(
      id,
      input.name,
      input.createdBy,
      createdAt
    );
    return this.findById(id)!;
  }

  findById(id: string) {
    const row = db.prepare(`SELECT * FROM buildings WHERE id = ?`).get(id);
    return row ? mapBuilding(row) : null;
  }

  listForUser(userId: string) {
    const rows = db
      .prepare(
        `SELECT DISTINCT b.* FROM buildings b
         LEFT JOIN memberships m ON m.resource_id = b.id AND m.resource_type = 'building' AND m.user_id = ?
         WHERE b.created_by = ? OR m.id IS NOT NULL
         ORDER BY b.created_at ASC`
      )
      .all(userId, userId);
    return rows.map(mapBuilding);
  }

  listAll() {
    const rows = db.prepare(`SELECT * FROM buildings ORDER BY created_at ASC`).all();
    return rows.map(mapBuilding);
  }

  update(id: string, input: { name: string }) {
    db.prepare(`UPDATE buildings SET name = ? WHERE id = ?`).run(input.name, id);
    return this.findById(id)!;
  }

  delete(id: string) {
    db.prepare(`DELETE FROM buildings WHERE id = ?`).run(id);
  }
}
