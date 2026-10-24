import type { Telegraf } from "telegraf";
import { messages } from "../../messages";
import type { AppDeps } from "../deps";
import { privateOnly } from "../guards";

export function registerUserCommands(bot: Telegraf, { requests, sessions }: AppDeps): void {
  bot.start(async (ctx) => {
    await ctx.reply(
      ctx.chat.type === "private" ? messages.help : messages.startInGroup
    );
  });

  bot.help(async (ctx) => {
    await ctx.reply(messages.help);
  });

  bot.command("thanks", async (ctx) => {
    await ctx.reply(messages.thanks);
  });

  bot.command(
    "request",
    privateOnly(async (ctx, user) => {
      sessions.set(user.id, { step: "title" });
      await ctx.reply(messages.askTitle);
    }, messages.requestInGroup)
  );

  bot.command(
    "email",
    privateOnly(async (ctx, user) => {
      const pending = requests.findLatestAwaitingEmail(user.id);
      if (!pending) {
        await ctx.reply(messages.startWithRequest);
        return;
      }

      sessions.set(user.id, { step: "email", requestId: pending.id });
      await ctx.reply(messages.askEmail);
    }, messages.emailInGroup)
  );

  bot.command(
    "cancel",
    privateOnly(async (ctx, user) => {
      sessions.delete(user.id);
      await ctx.reply(messages.cancelled);
    })
  );
}
