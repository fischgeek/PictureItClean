import { v4 as uuid } from "uuid";
import { db } from "../../db";
import { ResourceType } from "../../domain/types";
import { MembershipRepository } from "../interfaces";
import { mapMembership } from "./rowMappers";

export class SqliteMembershipRepository implements MembershipRepository {
  create(input: { userId: string; resourceType: ResourceType; resourceId: string; role: import("../../domain/types").Role }) {
    const id = uuid();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO memberships (id, user_id, resource_type, resource_id, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, resource_type, resource_id) DO UPDATE SET role = excluded.role`
    ).run(id, input.userId, input.resourceType, input.resourceId, input.role, createdAt);
    const row = db
      .prepare(`SELECT * FROM memberships WHERE user_id = ? AND resource_type = ? AND resource_id = ?`)
      .get(input.userId, input.resourceType, input.resourceId);
    return mapMembership(row);
  }

  findExact(userId: string, resourceType: ResourceType, resourceId: string) {
    const row = db
      .prepare(`SELECT * FROM memberships WHERE user_id = ? AND resource_type = ? AND resource_id = ?`)
      .get(userId, resourceType, resourceId);
    return row ? mapMembership(row) : null;
  }

  listForUserOnChain(userId: string, chain: { resourceType: ResourceType; resourceId: string }[]) {
    if (chain.length === 0) return [];
    const placeholders = chain.map(() => "(resource_type = ? AND resource_id = ?)").join(" OR ");
    const params: any[] = [userId];
    for (const link of chain) params.push(link.resourceType, link.resourceId);
    const rows = db
      .prepare(`SELECT * FROM memberships WHERE user_id = ? AND (${placeholders})`)
      .all(...params);
    return rows.map(mapMembership);
  }

  listForResource(resourceType: ResourceType, resourceId: string) {
    const rows = db
      .prepare(`SELECT * FROM memberships WHERE resource_type = ? AND resource_id = ?`)
      .all(resourceType, resourceId);
    return rows.map(mapMembership);
  }
}
