import type Database from "better-sqlite3";
import { RequestStatus, type BookRequest } from "../types";

interface RequestRow {
  id: number;
  telegram_user_id: number;
  username: string | null;
  book_title: string;
  email: string | null;
  status: RequestStatus;
  created_at: string;
}

function toBookRequest(row: RequestRow): BookRequest {
  return {
    id: row.id,
    telegramUserId: row.telegram_user_id,
    username: row.username,
    bookTitle: row.book_title,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
  };
}

/** The only place that knows SQL. Swap this class to move to another datastore. */
export class RequestRepository {
  private readonly insert;
  private readonly selectById;
  private readonly selectLatestForUser;
  private readonly selectByStatus;
  private readonly setEmail;
  private readonly setStatus;

  constructor(db: Database.Database) {
    this.insert = db.prepare(
      `INSERT INTO requests (telegram_user_id, username, book_title, status)
       VALUES (?, ?, ?, ?)`
    );
    this.selectById = db.prepare(`SELECT * FROM requests WHERE id = ?`);
    this.selectLatestForUser = db.prepare(
      `SELECT * FROM requests
       WHERE telegram_user_id = ? AND status = ?
       ORDER BY id DESC LIMIT 1`
    );
    this.selectByStatus = db.prepare(
      `SELECT * FROM requests WHERE status = ? ORDER BY id ASC LIMIT ?`
    );
    this.setEmail = db.prepare(
      `UPDATE requests SET email = ?, status = ?
       WHERE id = ? AND telegram_user_id = ? AND status = ?`
    );
    this.setStatus = db.prepare(
      `UPDATE requests SET status = ? WHERE id = ? AND status = ?`
    );
  }

  /** Creates a request that is waiting for the user's delivery email. */
  create(input: {
    telegramUserId: number;
    username: string | null;
    bookTitle: string;
  }): number {
    const result = this.insert.run(
      input.telegramUserId,
      input.username,
      input.bookTitle,
      RequestStatus.AwaitingEmail
    );
    return Number(result.lastInsertRowid);
  }

  findById(id: number): BookRequest | undefined {
    const row = this.selectById.get(id) as RequestRow | undefined;
    return row && toBookRequest(row);
  }

  findLatestAwaitingEmail(telegramUserId: number): BookRequest | undefined {
    const row = this.selectLatestForUser.get(
      telegramUserId,
      RequestStatus.AwaitingEmail
    ) as RequestRow | undefined;
    return row && toBookRequest(row);
  }

  listByStatus(status: RequestStatus, limit: number): BookRequest[] {
    const rows = this.selectByStatus.all(status, limit) as RequestRow[];
    return rows.map(toBookRequest);
  }

  /** Stores the email and moves the request to review. False if it wasn't the user's open request. */
  attachEmail(id: number, telegramUserId: number, email: string): boolean {
    const result = this.setEmail.run(
      email,
      RequestStatus.PendingReview,
      id,
      telegramUserId,
      RequestStatus.AwaitingEmail
    );
    return result.changes > 0;
  }

  /** Moves a request between statuses only if it is currently in `from`. */
  transition(id: number, from: RequestStatus, to: RequestStatus): boolean {
    return this.setStatus.run(to, id, from).changes > 0;
  }
}
