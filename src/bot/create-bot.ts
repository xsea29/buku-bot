import { Telegraf } from "telegraf";
import type { AppDeps } from "./deps";
import { registerAdminCommands } from "./handlers/admin";
import { registerConversation } from "./handlers/conversation";
import { registerUserCommands } from "./handlers/user";

/**
 * Registration order matters: commands first, then the catch-all text
 * handler, so "/something" is never treated as conversation input.
 */
export function createBot(deps: AppDeps): Telegraf {
  const bot = new Telegraf(deps.config.botToken);

  registerUserCommands(bot, deps);
  registerAdminCommands(bot, deps);
  registerConversation(bot, deps);

  bot.catch((error) => {
    console.error("Buku bot error:", error);
  });

  return bot;
}
