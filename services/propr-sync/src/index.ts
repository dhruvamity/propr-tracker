// ─── Propr Sync Service Entry Point ───────────────────────────────────────────
// Starts the REST sync + WebSocket worker.

import "dotenv/config";
import { ProprClient } from "@propr/client";
import { SEED_PURCHASES, reconcileDynamicPurchases } from "@propr/finance";
import { MemoryStore, RedisStore, type DataStore } from "./store.js";
import { buildAccountUniverse } from "./normalizer.js";
import { WsSyncWorker } from "./ws-worker.js";

const API_KEY = process.env.PROPR_API_KEY;
const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL;
const WS_URL = process.env.PROPR_WS_URL || "wss://api.propr.xyz/ws";
const REST_SYNC_INTERVAL = 60_000; // 1 minute

if (!API_KEY) {
  console.error("PROPR_API_KEY is required");
  process.exit(1);
}

async function main() {
  console.log("┌─────────────────────────────────────────┐");
  console.log("│  PROPR SYNC WORKER                      │");
  console.log("│  REST Synchronizer + WebSocket Listener  │");
  console.log("└─────────────────────────────────────────┘");

  const store: DataStore = REDIS_URL
    ? new RedisStore(REDIS_URL)
    : new MemoryStore();

  console.log(`[STORE] Using ${REDIS_URL ? "Redis" : "in-memory"} store`);

  const client = new ProprClient({ apiKey: API_KEY! });

  // Seed finance ledger if empty
  const existingLedger = await store.getLedger();
  if (existingLedger.length === 0) {
    console.log("[FINANCE] Seeding purchase history...");
    await store.setLedger(SEED_PURCHASES);
  }

  await performSync(client, store);

  const wsWorker = new WsSyncWorker({
    apiKey: API_KEY!,
    wsUrl: WS_URL,
    store,
    onResyncNeeded: () => performSync(client, store),
  });

  await wsWorker.start();

  setInterval(() => {
    performSync(client, store).catch((err) => {
      console.error("[SYNC] Periodic sync failed:", err);
    });
  }, REST_SYNC_INTERVAL);

  process.on("SIGINT", () => {
    console.log("[SYNC] Shutting down...");
    wsWorker.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("[SYNC] Shutting down...");
    wsWorker.stop();
    process.exit(0);
  });
}

async function performSync(
  client: ProprClient,
  store: DataStore
): Promise<void> {
  console.log("[SYNC] Starting REST sync...");
  const startTime = Date.now();

  try {
    const health = await client.getServiceHealth();
    if (health.core !== "OK") {
      console.warn("[SYNC] Propr API core is not OK:", health.core);
    }

    const user = await client.getUser();
    console.log(`[SYNC] User: ${user.email}`);

    const [payouts, purchases, attempts] = await Promise.all([
      client.getAllPayouts().catch(() => []),
      client.getPurchases().catch(() => []),
      client.getAllChallengeAttempts().catch(() => []),
    ]);

    await store.setPayouts(payouts);

    const existingLedger = await store.getLedger();
    const effectiveRate = process.env.PAYSAGI_EFFECTIVE_RATE || "97.82";
    const ledger = reconcileDynamicPurchases(
      purchases as Array<Record<string, unknown>>,
      attempts as unknown as Array<Record<string, unknown>>,
      effectiveRate,
      existingLedger.length > 0 ? existingLedger : SEED_PURCHASES
    );
    await store.setLedger(ledger);

    const accounts = await buildAccountUniverse(
      client,
      ledger,
      payouts
    );

    await store.setSnapshot(accounts);
    await store.setHealth({
      restStatus: "HEALTHY",
      wsStatus:
        (await store.getHealth())?.wsStatus || "DISCONNECTED",
      lastRestSyncAt: new Date().toISOString(),
      lastFullSyncAt: new Date().toISOString(),
      freshness: "LIVE",
      accountCount: accounts.length,
    });

    const elapsed = Date.now() - startTime;
    console.log(
      `[SYNC] Complete: ${accounts.length} accounts synced in ${elapsed}ms`
    );

    // Log audit
    await store.appendAuditLog({
      timestamp: new Date().toISOString(),
      source: "REST",
      event: "full_sync",
      newValue: `${accounts.length} accounts`,
      syncStatus: "SUCCESS",
    });
  } catch (err) {
    console.error("[SYNC] REST sync failed:", err);

    await store.setHealth({
      restStatus: "ERROR",
      wsStatus:
        (await store.getHealth())?.wsStatus || "DISCONNECTED",
      freshness: "STALE",
      accountCount:
        (await store.getHealth())?.accountCount || 0,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    });

    await store.appendAuditLog({
      timestamp: new Date().toISOString(),
      source: "REST",
      event: "sync_failed",
      newValue: err instanceof Error ? err.message : "Unknown error",
      syncStatus: "FAILURE",
    });
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
