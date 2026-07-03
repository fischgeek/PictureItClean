import { v4 as uuid } from "uuid";
import { db } from "../../db";
import { DailyAssignmentRepository } from "../interfaces";
import { mapDailyAssignment } from "./rowMappers";

export class SqliteDailyAssignmentRepository implements DailyAssignmentRepository {
  findActive(userId: string, assignedDate: string) {
    const row = db
      .prepare(
        `SELECT * FROM daily_assignments
         WHERE user_id = ? AND assigned_date = ? AND completed_at IS NULL
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(userId, assignedDate);
    return row ? mapDailyAssignment(row) : null;
  }

  create(input: { userId: string; spaceId: string; assignedDate: string }) {
    const id = uuid();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO daily_assignments (id, user_id, space_id, assigned_date, created_at, completed_at)
       VALUES (?, ?, ?, ?, ?, NULL)`
    ).run(id, input.userId, input.spaceId, input.assignedDate, createdAt);
    const row = db.prepare(`SELECT * FROM daily_assignments WHERE id = ?`).get(id);
    return mapDailyAssignment(row);
  }

  markCompleted(userId: string, spaceId: string, assignedDate: string) {
    db.prepare(
      `UPDATE daily_assignments SET completed_at = ?
       WHERE user_id = ? AND space_id = ? AND assigned_date = ? AND completed_at IS NULL`
    ).run(new Date().toISOString(), userId, spaceId, assignedDate);
  }
}
