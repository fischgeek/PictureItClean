import { v4 as uuid } from "uuid";
import { db } from "../../db";
import { DailyAssignmentRepository } from "../interfaces";
import { mapDailyAssignment } from "./rowMappers";

export class SqliteDailyAssignmentRepository implements DailyAssignmentRepository {
  listActive(userId: string, today: string) {
    const rows = db
      .prepare(
        `SELECT * FROM daily_assignments
         WHERE user_id = ? AND completed_at IS NULL AND assigned_date <= ?
         ORDER BY assigned_date ASC, created_at ASC`
      )
      .all(userId, today);
    return rows.map(mapDailyAssignment);
  }

  hasAnyForDate(userId: string, date: string) {
    const row = db
      .prepare(`SELECT COUNT(*) AS n FROM daily_assignments WHERE user_id = ? AND assigned_date = ?`)
      .get(userId, date) as { n: number };
    return row.n > 0;
  }

  findById(id: string) {
    const row = db.prepare(`SELECT * FROM daily_assignments WHERE id = ?`).get(id);
    return row ? mapDailyAssignment(row) : null;
  }

  create(input: { userId: string; spaceId: string; assignedDate: string }) {
    const id = uuid();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO daily_assignments (id, user_id, space_id, assigned_date, created_at, completed_at)
       VALUES (?, ?, ?, ?, ?, NULL)`
    ).run(id, input.userId, input.spaceId, input.assignedDate, createdAt);
    return this.findById(id)!;
  }

  markCompletedForSpace(userId: string, spaceId: string) {
    db.prepare(
      `UPDATE daily_assignments SET completed_at = ?
       WHERE user_id = ? AND space_id = ? AND completed_at IS NULL`
    ).run(new Date().toISOString(), userId, spaceId);
  }

  reschedule(id: string, newDate: string) {
    db.prepare(`UPDATE daily_assignments SET assigned_date = ? WHERE id = ?`).run(newDate, id);
    return this.findById(id)!;
  }
}
