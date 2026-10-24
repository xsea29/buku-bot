import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * Append-only list of schema migrations. The index + 1 is stored in
 * PRAGMA user_version, so each entry runs exactly once. Never edit an
 * entry that has shipped; add a new one instead.
 */
const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_user_id INTEGER NOT NULL,
    username TEXT,
    book_title TEXT NOT NULL,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'awaiting_email',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_requests_user_status
    ON requests (telegram_user_id, status);
  CREATE INDEX IF NOT EXISTS idx_requests_status
    ON requests (status);
  `,
];

function migrate(db: Database.Database): void {
  const current = db.pragma("user_version", { simple: true }) as number;

  for (let version = current; version < MIGRATIONS.length; version++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[version]!);
      db.pragma(`user_version = ${version + 1}`);
    })();
  }
}

export function openDatabase(filePath: string): Database.Database {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}
