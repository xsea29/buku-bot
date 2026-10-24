import dns from "node:dns";
import net from "node:net";
import { createBot } from "./bot/create-bot";
import { MemorySessionStore } from "./bot/sessions";
import { loadConfig } from "./config";
import { openDatabase } from "./db/database";
import { RequestRepository } from "./db/request-repository";
import { startHealthServer } from "./health";

// api.telegram.org resolves to IPv4 and IPv6, and some networks black-hole the
// IPv6 route. Prefer IPv4, and give each connection attempt longer than Node's
// 250ms default, which slower links exceed and then fail with ETIMEDOUT.
dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamilyAttemptTimeout(3000);

async function main(): Promise<void> {
  const config = loadConfig();
  const db = await openDatabase(config.databaseUrl, config.databaseAuthToken);
  const healthServer = config.port ? startHealthServer(config.port) : undefined;

  const bot = createBot({
    config,
    requests: new RequestRepository(db),
    sessions: new MemorySessionStore(),
  });

  const shutdown = (signal: string) => {
    bot.stop(signal);
    healthServer?.close();
    db.close();
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  // launch() resolves only once the bot stops, so announce readiness via the callback.
  await bot.launch(() => console.log("🐧 Buku is running."));
}

main().catch((error) => {
  console.error("Could not start Buku:", error);
  process.exitCode = 1;
});
