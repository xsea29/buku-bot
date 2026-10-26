import type { Context, Telegraf } from "telegraf";
import type { User } from "telegraf/types";
import { messages } from "../../messages";
import { isValidTitle, normalizeEmail } from "../../validation";
import type { AppDeps } from "../deps";
import { getMessageText } from "../guards";
import { notifyAdmins } from "../notify";
import type { Session } from "../sessions";

type StepHandler<S extends Session> = (
  ctx: Context,
  user: User,
  session: S,
  text: string
) => Promise<void>;

/** Handles ordinary text messages according to the user's current step. */
export function registerConversation(bot: Telegraf, deps: AppDeps): void {
  const { config, requests, sessions } = deps;

  const onTitle: StepHandler<Extract<Session, { step: "title" }>> = async (
    ctx,
    user,
    _session,
    text
  ) => {
    if (!isValidTitle(text, config.limits)) {
      await ctx.reply(messages.invalidTitle(config.limits));
      return;
    }

    const requestId = await requests.create({
      telegramUserId: user.id,
      username: user.username ?? null,
      bookTitle: text,
    });

    sessions.set(user.id, { step: "email", requestId });
    await ctx.reply(messages.titleSaved(text));
  };

  const onEmail: StepHandler<Extract<Session, { step: "email" }>> = async (
    ctx,
    user,
    session,
    text
  ) => {
    const email = normalizeEmail(text, config.limits);
    if (!email) {
      await ctx.reply(messages.invalidEmail);
      return;
    }

    const request = await requests.findById(session.requestId);
    if (!request || !(await requests.attachEmail(request.id, user.id, email))) {
      sessions.delete(user.id);
      await ctx.reply(messages.restartRequest);
      return;
    }

    sessions.delete(user.id);
    await ctx.reply(messages.requestSaved(request.bookTitle));
    await notifyAdmins(
      ctx.telegram,
      config.adminIds,
      messages.admin.newRequest({ ...request, email })
    );
  };

  bot.on("text", async (ctx) => {
    if (ctx.chat.type !== "private") return;

    const text = getMessageText(ctx);
    if (!text || text.startsWith("/")) return;

    const session = sessions.get(ctx.from.id);
    if (!session) {
      await ctx.reply(messages.noActiveStep);
      return;
    }

    // Exhaustive: adding a Session variant is a compile error until handled here.
    switch (session.step) {
      case "title":
        return onTitle(ctx, ctx.from, session, text);
      case "email":
        return onEmail(ctx, ctx.from, session, text);
    }
  });
}
