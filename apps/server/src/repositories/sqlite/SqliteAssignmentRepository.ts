import { v4 as uuid } from "uuid";
import { db } from "../../db";
import { ResourceType } from "../../domain/types";
import { AssignmentRepository } from "../interfaces";
import { mapAssignment } from "./rowMappers";

export class SqliteAssignmentRepository implements AssignmentRepository {
  replaceForUser(userId: string, items: { resourceType: ResourceType; resourceId: string }[], createdBy: string) {
    const createdAt = new Date().toISOString();
    db.exec("BEGIN");
    try {
      db.prepare(`DELETE FROM assignments WHERE user_id = ?`).run(userId);
      const insert = db.prepare(
        `INSERT INTO assignments (id, user_id, resource_type, resource_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`
      );
      for (const item of items) {
        insert.run(uuid(), userId, item.resourceType, item.resourceId, createdBy, createdAt);
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }

  listForUser(userId: string) {
    const rows = db.prepare(`SELECT * FROM assignments WHERE user_id = ? ORDER BY created_at ASC`).all(userId);
    return rows.map(mapAssignment);
  }
}
