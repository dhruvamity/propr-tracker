// ─── Propr Sync Service Entry Point ───────────────────────────────────────────
// Starts the REST sync + WebSocket worker.

import "dotenv/config";
import { ProprClient } from "@propr/client";
import { SEED_PURCHASES } from "@propr/finance";
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

  // Initialize store
  const store: DataStore = REDIS_URL
    ? new RedisStore(REDIS_URL)
    : new MemoryStore();

  console.log(`[STORE] Using ${REDIS_URL ? "Redis" : "in-memory"} store`);

  // Initialize Propr client
  const client = new ProprClient({ apiKey: API_KEY! });

  // Seed finance ledger if empty
  const existingLedger = await store.getLedger();
  if (existingLedger.length === 0) {
    console.log("[FINANCE] Seeding purchase history...");
    await store.setLedger(SEED_PURCHASES);
  }

  // Initial REST sync
  await performSync(client, store);

  // Start WebSocket worker
  const wsWorker = new WsSyncWorker({
    apiKey: API_KEY!,
    wsUrl: WS_URL,
    store,
    onResyncNeeded: () => performSync(client, store),
  });

  await wsWorker.start();

  // Periodic REST resync
  setInterval(() => {
    performSync(client, store).catch((err) => {
      console.error("[SYNC] Periodic sync failed:", err);
    });
  }, REST_SYNC_INTERVAL);

  // Graceful shutdown
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
    // Check API health first
    const health = await client.getServiceHealth();
    if (health.core !== "OK") {
      console.warn("[SYNC] Propr API core is not OK:", health.core);
    }

    // Get user profile
    const user = await client.getUser();
    console.log(`[SYNC] User: ${user.email}`);

    // Get ledger and payouts
    const ledger = await store.getLedger();
    const payouts = await client.getAllPayouts();

    // Store payouts
    await store.setPayouts(payouts);

    // Build normalized account universe
    const accounts = await buildAccountUniverse(
      client,
      ledger,
      payouts
    );

    // Store snapshot
    await store.setSnapshot(accounts);

    // Update health
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
