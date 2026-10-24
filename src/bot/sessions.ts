/** What the bot is waiting for from a user in a private chat. */
export type Session =
  | { step: "title" }
  | { step: "email"; requestId: number };

/**
 * Conversation state lives behind this interface. The in-memory store is fine
 * for a single process; implement it on Redis/SQLite to survive restarts or
 * to run several instances.
 */
export interface SessionStore {
  get(userId: number): Session | undefined;
  set(userId: number, session: Session): void;
  delete(userId: number): void;
}

export class MemorySessionStore implements SessionStore {
  private readonly sessions = new Map<number, Session>();

  get(userId: number): Session | undefined {
    return this.sessions.get(userId);
  }

  set(userId: number, session: Session): void {
    this.sessions.set(userId, session);
  }

  delete(userId: number): void {
    this.sessions.delete(userId);
  }
}
