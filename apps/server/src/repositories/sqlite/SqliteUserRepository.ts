import { v4 as uuid } from "uuid";
import { db } from "../../db";
import { UserRepository } from "../interfaces";
import { mapUser } from "./rowMappers";

export class SqliteUserRepository implements UserRepository {
  create(input: { username: string; passwordHash: string; displayName: string }) {
    const id = uuid();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO users (id, username, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)`
    ).run(id, input.username, input.passwordHash, input.displayName, createdAt);
    return this.findById(id)!;
  }

  findByUsername(username: string) {
    const row = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
    return row ? mapUser(row) : null;
  }

  findById(id: string) {
    const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
    return row ? mapUser(row) : null;
  }
}
