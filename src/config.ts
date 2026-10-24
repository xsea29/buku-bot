import "dotenv/config";
import path from "node:path";

export interface Limits {
  titleMin: number;
  titleMax: number;
  emailMax: number;
  pendingListSize: number;
}

export interface Config {
  botToken: string;
  adminIds: readonly number[];
  databasePath: string;
  limits: Limits;
}

type Env = Record<string, string | undefined>;

function requireString(env: Env, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is missing in .env`);
  return value;
}

function optionalInt(env: Env, name: string, fallback: number): number {
  const raw = env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer, got "${raw}"`);
  }
  return value;
}

function parseAdminIds(raw: string): number[] {
  const ids = raw.split(",").map((part) => Number(part.trim()));
  if (ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error(
      "ADMIN_TELEGRAM_ID must be one or more numeric Telegram user IDs, separated by commas"
    );
  }
  return [...new Set(ids)];
}

export function loadConfig(env: Env = process.env): Config {
  const limits: Limits = {
    titleMin: optionalInt(env, "TITLE_MIN_LENGTH", 2),
    titleMax: optionalInt(env, "TITLE_MAX_LENGTH", 200),
    emailMax: optionalInt(env, "EMAIL_MAX_LENGTH", 254),
    pendingListSize: optionalInt(env, "PENDING_LIST_LIMIT", 30),
  };
  if (limits.titleMin > limits.titleMax) {
    throw new Error("TITLE_MIN_LENGTH cannot be greater than TITLE_MAX_LENGTH");
  }

  return {
    botToken: requireString(env, "BOT_TOKEN"),
    adminIds: parseAdminIds(requireString(env, "ADMIN_TELEGRAM_ID")),
    databasePath: path.resolve(env.DATABASE_PATH?.trim() || "data/buku.sqlite"),
    limits,
  };
}
