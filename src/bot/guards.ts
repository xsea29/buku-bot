import type { Context } from "telegraf";
import type { User } from "telegraf/types";

export type UserHandler = (ctx: Context, user: User) => Promise<void>;

/** Runs the handler only in a private chat. Replies with `denyMessage` elsewhere, or stays silent if omitted. */
export function privateOnly(handler: UserHandler, denyMessage?: string) {
  return async (ctx: Context): Promise<void> => {
    if (ctx.chat?.type !== "private" || !ctx.from) {
      if (denyMessage) await ctx.reply(denyMessage);
      return;
    }
    await handler(ctx, ctx.from);
  };
}

/** Runs the handler only for configured admins. */
export function adminOnly(
  adminIds: readonly number[],
  handler: UserHandler,
  denyMessage: string
) {
  return async (ctx: Context): Promise<void> => {
    if (!ctx.from || !adminIds.includes(ctx.from.id)) {
      await ctx.reply(denyMessage);
      return;
    }
    await handler(ctx, ctx.from);
  };
}

/** The text of the incoming message, trimmed, or undefined for non-text updates. */
export function getMessageText(ctx: Context): string | undefined {
  if (!ctx.message || !("text" in ctx.message)) return undefined;
  return ctx.message.text.trim();
}

/** Parses "/command 42" into 42; undefined if the argument isn't a positive integer. */
export function getIdArgument(ctx: Context): number | undefined {
  const raw = getMessageText(ctx)?.split(/\s+/)[1];
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}
