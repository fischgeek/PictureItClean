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

  listIssuedSpaceIds(userId: string) {
    const rows = db.prepare(`SELECT DISTINCT space_id AS spaceId FROM daily_assignments WHERE user_id = ?`).all(userId) as {
      spaceId: string;
    }[];
    return rows.map((r) => r.spaceId);
  }

  listActiveSpaceIds(userId: string) {
    const rows = db
      .prepare(`SELECT DISTINCT space_id AS spaceId FROM daily_assignments WHERE user_id = ? AND completed_at IS NULL`)
      .all(userId) as { spaceId: string }[];
    return rows.map((r) => r.spaceId);
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

  markCompletedForSpace(spaceId: string) {
    db.prepare(
      `UPDATE daily_assignments SET completed_at = ?
       WHERE space_id = ? AND completed_at IS NULL`
    ).run(new Date().toISOString(), spaceId);
  }

  reschedule(id: string, newDate: string) {
    try {
      db.prepare(`UPDATE daily_assignments SET assigned_date = ? WHERE id = ?`).run(newDate, id);
    } catch (err: any) {
      if (err?.code === "ERR_SQLITE_ERROR" && /UNIQUE constraint failed/.test(String(err.message))) {
        // A different row already covers this user/space/date (e.g. a stale duplicate from
        // before the uniqueness constraint existed) -- drop this one instead of crashing.
        db.prepare(`DELETE FROM daily_assignments WHERE id = ?`).run(id);
        return null;
      }
      throw err;
    }
    return this.findById(id)!;
  }

  deleteActiveNotIn(userId: string, keepSpaceIds: string[]) {
    if (keepSpaceIds.length === 0) {
      db.prepare(`DELETE FROM daily_assignments WHERE user_id = ? AND completed_at IS NULL`).run(userId);
      return;
    }
    const placeholders = keepSpaceIds.map(() => "?").join(",");
    db.prepare(
      `DELETE FROM daily_assignments WHERE user_id = ? AND completed_at IS NULL AND space_id NOT IN (${placeholders})`
    ).run(userId, ...keepSpaceIds);
  }
}
