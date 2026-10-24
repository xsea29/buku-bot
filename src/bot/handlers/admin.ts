import type { Telegraf } from "telegraf";
import { messages } from "../../messages";
import { RequestStatus } from "../../types";
import type { AppDeps } from "../deps";
import { adminOnly, getIdArgument } from "../guards";

interface ReviewAction {
  command: string;
  to: RequestStatus;
  reply: (id: number) => string;
}

/** Add an entry to introduce another review outcome; no handler code needed. */
const REVIEW_ACTIONS: readonly ReviewAction[] = [
  {
    command: "approve",
    to: RequestStatus.ApprovedForSourcing,
    reply: (id) =>
      `Request #${id} approved for sourcing. Add an authorized copy before delivery. 📚`,
  },
  {
    command: "reject",
    to: RequestStatus.Rejected,
    reply: (id) => `Request #${id} rejected.`,
  },
];

export function registerAdminCommands(bot: Telegraf, { config, requests }: AppDeps): void {
  const { adminIds, limits } = config;

  bot.command(
    "pending",
    adminOnly(
      adminIds,
      async (ctx) => {
        const rows = await requests.listByStatus(
          RequestStatus.PendingReview,
          limits.pendingListSize
        );

        await ctx.reply(
          rows.length === 0
            ? messages.admin.nothingPending
            : messages.admin.pendingList(rows)
        );
      },
      messages.admin.deniedVerbose
    )
  );

  for (const action of REVIEW_ACTIONS) {
    bot.command(
      action.command,
      adminOnly(
        adminIds,
        async (ctx) => {
          const id = getIdArgument(ctx);
          if (id === undefined) {
            await ctx.reply(messages.admin.usage(action.command));
            return;
          }

          const changed = await requests.transition(id, RequestStatus.PendingReview, action.to);
          await ctx.reply(changed ? action.reply(id) : messages.admin.notFound);
        },
        messages.admin.denied
      )
    );
  }
}
