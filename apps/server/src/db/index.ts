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

// Runtime migration: existing deployments created their users table before the `role` column
// existed, and CREATE TABLE IF NOT EXISTS above is a no-op against an already-existing table.
const userColumns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
if (!userColumns.some((c) => c.name === "role")) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
}

// Bootstrap: guarantee at least one admin exists. Covers both a freshly-migrated database
// (existing users all defaulted to 'user' above) and any other state that somehow ended up
// adminless -- the earliest-created account is promoted.
const adminCount = (db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get() as { n: number }).n;
if (adminCount === 0) {
  db.exec("UPDATE users SET role = 'admin' WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)");
}

export const photosDir = path.join(dataDir, "photos");
