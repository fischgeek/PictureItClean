import { v4 as uuid } from "uuid";
import { db } from "../../db";
import { VerificationEvent } from "../../domain/types";
import { VerificationEventRepository } from "../interfaces";
import { mapVerificationEvent } from "./rowMappers";

export class SqliteVerificationEventRepository implements VerificationEventRepository {
  create(input: {
    spaceId: string;
    userId: string;
    checklistSnapshot: VerificationEvent["checklistSnapshot"];
    note: string | null;
  }) {
    const id = uuid();
    const completedAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO verification_events (id, space_id, user_id, checklist_snapshot_json, note, completed_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, input.spaceId, input.userId, JSON.stringify(input.checklistSnapshot), input.note, completedAt);
    const row = db.prepare(`SELECT * FROM verification_events WHERE id = ?`).get(id);
    return mapVerificationEvent(row);
  }

  listBySpace(spaceId: string) {
    const rows = db
      .prepare(`SELECT * FROM verification_events WHERE space_id = ? ORDER BY completed_at DESC`)
      .all(spaceId);
    return rows.map(mapVerificationEvent);
  }
}
