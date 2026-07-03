import { v4 as uuid } from "uuid";
import { db } from "../../db";
import { ChecklistItemRepository } from "../interfaces";
import { mapChecklistItem } from "./rowMappers";

export class SqliteChecklistItemRepository implements ChecklistItemRepository {
  create(input: { spaceId: string; text: string; estimatedMinutes: number; sortOrder: number }) {
    const id = uuid();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO checklist_items (id, space_id, text, estimated_minutes, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, input.spaceId, input.text, input.estimatedMinutes, input.sortOrder, createdAt);
    return this.findById(id)!;
  }

  findById(id: string) {
    const row = db.prepare(`SELECT * FROM checklist_items WHERE id = ?`).get(id);
    return row ? mapChecklistItem(row) : null;
  }

  listBySpace(spaceId: string) {
    const rows = db
      .prepare(`SELECT * FROM checklist_items WHERE space_id = ? ORDER BY sort_order ASC, created_at ASC`)
      .all(spaceId);
    return rows.map(mapChecklistItem);
  }

  update(id: string, input: Partial<{ text: string; estimatedMinutes: number; sortOrder: number }>) {
    const current = this.findById(id)!;
    const text = input.text ?? current.text;
    const estimatedMinutes = input.estimatedMinutes ?? current.estimatedMinutes;
    const sortOrder = input.sortOrder ?? current.sortOrder;
    db.prepare(`UPDATE checklist_items SET text = ?, estimated_minutes = ?, sort_order = ? WHERE id = ?`).run(
      text,
      estimatedMinutes,
      sortOrder,
      id
    );
    return this.findById(id)!;
  }

  delete(id: string) {
    db.prepare(`DELETE FROM checklist_items WHERE id = ?`).run(id);
  }
}
