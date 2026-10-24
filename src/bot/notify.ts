import type { Telegram } from "telegraf";

/** Sends `text` to every admin; one failing delivery never blocks the others or the caller. */
export async function notifyAdmins(
  telegram: Telegram,
  adminIds: readonly number[],
  text: string
): Promise<void> {
  const results = await Promise.allSettled(
    adminIds.map((id) => telegram.sendMessage(id, text))
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`Admin notification to ${adminIds[index]} failed:`, result.reason);
    }
  });
}
