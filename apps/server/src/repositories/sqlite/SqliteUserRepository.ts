import { v4 as uuid } from "uuid";
import { db } from "../../db";
import { UserRole } from "../../domain/types";
import { UserRepository } from "../interfaces";
import { mapUser } from "./rowMappers";

export class SqliteUserRepository implements UserRepository {
  create(input: { username: string; passwordHash: string; displayName: string; role?: UserRole }) {
    const id = uuid();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO users (id, username, password_hash, display_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, input.username, input.passwordHash, input.displayName, input.role ?? "user", createdAt);
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

  listAll() {
    const rows = db.prepare(`SELECT * FROM users ORDER BY created_at ASC`).all();
    return rows.map(mapUser);
  }

  updateRole(id: string, role: UserRole) {
    db.prepare(`UPDATE users SET role = ? WHERE id = ?`).run(role, id);
    return this.findById(id)!;
  }

  updatePassword(id: string, passwordHash: string) {
    db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(passwordHash, id);
    return this.findById(id)!;
  }

  delete(id: string) {
    db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
  }

  countAdmins() {
    const row = db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'admin'`).get() as { n: number };
    return row.n;
  }
}
