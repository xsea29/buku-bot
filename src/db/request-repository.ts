import type { Client } from "@libsql/client";
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

function toBookRequest(row: unknown): BookRequest {
  const r = row as RequestRow;
  return {
    id: r.id,
    telegramUserId: r.telegram_user_id,
    username: r.username,
    bookTitle: r.book_title,
    email: r.email,
    status: r.status,
    createdAt: r.created_at,
  };
}

/** The only place that knows SQL. Swap this class to move to another datastore. */
export class RequestRepository {
  constructor(private readonly db: Client) {}

  /** Creates a request that is waiting for the user's delivery email. */
  async create(input: {
    telegramUserId: number;
    username: string | null;
    bookTitle: string;
  }): Promise<number> {
    const result = await this.db.execute({
      sql: `INSERT INTO requests (telegram_user_id, username, book_title, status)
            VALUES (?, ?, ?, ?)`,
      args: [
        input.telegramUserId,
        input.username,
        input.bookTitle,
        RequestStatus.AwaitingEmail,
      ],
    });
    return Number(result.lastInsertRowid);
  }

  async findById(id: number): Promise<BookRequest | undefined> {
    const { rows } = await this.db.execute({
      sql: `SELECT * FROM requests WHERE id = ?`,
      args: [id],
    });
    return rows[0] && toBookRequest(rows[0]);
  }

  async findLatestAwaitingEmail(telegramUserId: number): Promise<BookRequest | undefined> {
    const { rows } = await this.db.execute({
      sql: `SELECT * FROM requests
            WHERE telegram_user_id = ? AND status = ?
            ORDER BY id DESC LIMIT 1`,
      args: [telegramUserId, RequestStatus.AwaitingEmail],
    });
    return rows[0] && toBookRequest(rows[0]);
  }

  async listByStatus(status: RequestStatus, limit: number): Promise<BookRequest[]> {
    const { rows } = await this.db.execute({
      sql: `SELECT * FROM requests WHERE status = ? ORDER BY id ASC LIMIT ?`,
      args: [status, limit],
    });
    return rows.map(toBookRequest);
  }

  /** Stores the email and moves the request to review. False if it wasn't the user's open request. */
  async attachEmail(id: number, telegramUserId: number, email: string): Promise<boolean> {
    const result = await this.db.execute({
      sql: `UPDATE requests SET email = ?, status = ?
            WHERE id = ? AND telegram_user_id = ? AND status = ?`,
      args: [email, RequestStatus.PendingReview, id, telegramUserId, RequestStatus.AwaitingEmail],
    });
    return result.rowsAffected > 0;
  }

  /** Moves a request between statuses only if it is currently in `from`. */
  async transition(id: number, from: RequestStatus, to: RequestStatus): Promise<boolean> {
    const result = await this.db.execute({
      sql: `UPDATE requests SET status = ? WHERE id = ? AND status = ?`,
      args: [to, id, from],
    });
    return result.rowsAffected > 0;
  }
}
