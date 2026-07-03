import crypto from "node:crypto";
import { v4 as uuid } from "uuid";
import { db } from "../../db";
import { ResourceType, Role } from "../../domain/types";
import { InviteRepository } from "../interfaces";
import { mapInvite } from "./rowMappers";

export class SqliteInviteRepository implements InviteRepository {
  create(input: { resourceType: ResourceType; resourceId: string; role: Role; createdBy: string; expiresAt: string | null }) {
    const id = uuid();
    const token = crypto.randomBytes(9).toString("base64url");
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO invites (id, token, resource_type, resource_id, role, created_by, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, token, input.resourceType, input.resourceId, input.role, input.createdBy, input.expiresAt, createdAt);
    const row = db.prepare(`SELECT * FROM invites WHERE id = ?`).get(id);
    return mapInvite(row);
  }

  findByToken(token: string) {
    const row = db.prepare(`SELECT * FROM invites WHERE token = ?`).get(token);
    return row ? mapInvite(row) : null;
  }
}
