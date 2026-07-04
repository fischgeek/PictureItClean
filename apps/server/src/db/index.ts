import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "..", "data");
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(path.join(dataDir, "photos"), { recursive: true });

const dbPath = path.join(dataDir, "data.sqlite");
export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
db.exec(schema);

// Runtime migrations: CREATE TABLE IF NOT EXISTS above is a no-op against tables that already
// existed before a column was added, so already-deployed databases need an explicit ALTER TABLE.
function ensureColumn(table: string, column: string, ddl: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

ensureColumn("users", "role", "role TEXT NOT NULL DEFAULT 'user'");
ensureColumn("spaces", "frequency_days", "frequency_days INTEGER NOT NULL DEFAULT 7");
ensureColumn("buildings", "photo_path", "photo_path TEXT");
ensureColumn("buildings", "thumbnail_path", "thumbnail_path TEXT");
ensureColumn("areas", "photo_path", "photo_path TEXT");
ensureColumn("areas", "thumbnail_path", "thumbnail_path TEXT");

// Bootstrap: guarantee at least one admin exists. Covers both a freshly-migrated database
// (existing users all defaulted to 'user' above) and any other state that somehow ended up
// adminless -- the earliest-created account is promoted.
const adminCount = (db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get() as { n: number }).n;
if (adminCount === 0) {
  db.exec("UPDATE users SET role = 'admin' WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)");
}

export const photosDir = path.join(dataDir, "photos");
