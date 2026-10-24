import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

/**
 * Append-only list of schema migrations; each entry is a list of statements
 * applied atomically and recorded in `_migrations`. Never edit an entry that
 * has shipped; add a new one instead.
 */
const MIGRATIONS: readonly (readonly string[])[] = [
  [
    `CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_user_id INTEGER NOT NULL,
      username TEXT,
      book_title TEXT NOT NULL,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'awaiting_email',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_requests_user_status
      ON requests (telegram_user_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_requests_status ON requests (status)`,
  ],
];

async function migrate(db: Client): Promise<void> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY)`
  );

  const { rows } = await db.execute(`SELECT MAX(version) AS v FROM _migrations`);
  const current = Number(rows[0]?.v ?? 0);

  for (let version = current; version < MIGRATIONS.length; version++) {
    await db.batch(
      [
        ...MIGRATIONS[version]!,
        { sql: `INSERT INTO _migrations (version) VALUES (?)`, args: [version + 1] },
      ],
      "write"
    );
  }
}

export async function openDatabase(url: string, authToken?: string): Promise<Client> {
  if (url.startsWith("file:")) {
    fs.mkdirSync(path.dirname(url.slice("file:".length)), { recursive: true });
  }

  const db = createClient({ url, authToken });
  await migrate(db);
  return db;
}
