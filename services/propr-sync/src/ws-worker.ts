// ─── WebSocket Sync Worker ─────────────────────────────────────────────────────
// Persistent WebSocket connection to Propr for real-time data.
// Handles all 15 event types, reconnection, and state updates.

import WebSocket from "ws";
import type {
  MarkPrices,
  AccountSnapshot,
  PositionSnapshot,
  OrderSnapshot,
  AuditLogEntry,
  DecimalString,
} from "@propr/data-model";
import { toDecimal, fromDecimal, ds } from "@propr/data-model";
import {
  recalculatePosition,
  calculateEquity,
  sumUnrealizedPnl,
  sumCrossUnrealizedPnl,
} from "@propr/calculations";
import type { DataStore } from "./store.js";

const DEFAULT_WS_URL = "wss://api.propr.xyz/ws";
const INITIAL_RECONNECT_DELAY = 5_000;
const MAX_RECONNECT_DELAY = 60_000;
const HEARTBEAT_TIMEOUT = 30_000;

export interface WsSyncConfig {
  apiKey: string;
  wsUrl?: string;
  store: DataStore;
  onResyncNeeded?: () => Promise<void>;
}

export class WsSyncWorker {
  private ws: WebSocket | null = null;
  private reconnectDelay = INITIAL_RECONNECT_DELAY;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;
  private marks: MarkPrices = {};

  private readonly apiKey: string;
  private readonly wsUrl: string;
  private readonly store: DataStore;
  private readonly onResyncNeeded?: () => Promise<void>;

  constructor(config: WsSyncConfig) {
    this.apiKey = config.apiKey;
    this.wsUrl = config.wsUrl || DEFAULT_WS_URL;
    this.store = config.store;
    this.onResyncNeeded = config.onResyncNeeded;
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.connect();
  }

  stop(): void {
    this.isRunning = false;
    this.clearHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private connect(): void {
    if (!this.isRunning) return;

    console.log(`[WS] Connecting to ${this.wsUrl}...`);

    this.ws = new WebSocket(this.wsUrl, {
      headers: { "X-API-Key": this.apiKey },
    });

    this.ws.on("open", () => {
      console.log("[WS] Connected");
      this.reconnectDelay = INITIAL_RECONNECT_DELAY;
      this.resetHeartbeat();
      this.updateHealth("CONNECTED");
    });

    this.ws.on("message", (data: WebSocket.Data) => {
      this.resetHeartbeat();
      try {
        const event = JSON.parse(data.toString());
        this.handleEvent(event);
      } catch (err) {
        console.error("[WS] Failed to parse message:", err);
      }
    });

    this.ws.on("ping", () => {
      this.resetHeartbeat();
      this.ws?.pong();
    });

    this.ws.on("close", (code, reason) => {
      console.log(
        `[WS] Disconnected: ${code} ${reason.toString()}`
      );
      this.clearHeartbeat();
      this.updateHealth("DISCONNECTED");
      this.scheduleReconnect();
    });

    this.ws.on("error", (err) => {
      console.error("[WS] Error:", err.message);
      this.updateHealth("ERROR");
    });
  }

  private scheduleReconnect(): void {
    if (!this.isRunning) return;

    console.log(
      `[WS] Reconnecting in ${this.reconnectDelay / 1000}s...`
    );

    setTimeout(async () => {
      // Full REST resync on reconnect (per prompt §26)
      if (this.onResyncNeeded) {
        console.log("[WS] Triggering REST resync before reconnect...");
        try {
          await this.onResyncNeeded();
        } catch (err) {
          console.error("[WS] Resync failed:", err);
        }
      }
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      MAX_RECONNECT_DELAY
    );
  }

  private resetHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatTimer = setTimeout(() => {
      console.warn("[WS] Heartbeat timeout — connection may be dead");
      this.ws?.close();
    }, HEARTBEAT_TIMEOUT);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private async handleEvent(event: {
    type: string;
    userId?: string;
    data?: Record<string, unknown>;
    timestamp?: number;
  }): Promise<void> {
    const { type, data = {} } = event;
    const now = new Date().toISOString();

    switch (type) {
      case "connected":
        console.log(`[WS] Authenticated: userId=${data.userId}`);
        break;

      case "mark.updated":
        await this.handleMarkUpdate(data as {
          marks: Record<string, Record<string, string>>;
        });
        break;

      case "account.updated":
        await this.handleAccountUpdate(data);
        break;

      case "position.opened":
      case "position.updated":
        await this.handlePositionUpdate(data, type);
        break;

      case "position.closed":
      case "position.liquidated":
        await this.handlePositionClosed(data, type);
        break;

      case "order.created":
      case "order.updated":
      case "order.cancelled":
      case "order.filled":
      case "order.partially_filled":
      case "order.triggered":
        await this.handleOrderEvent(data, type);
        break;

      case "trade.created":
        await this.handleTradeCreated(data);
        break;

      case "position.take_profit.hit":
      case "position.stop_loss.hit":
        console.log(`[WS] ${type}:`, data);
        break;

      default:
        console.log(`[WS] Unhandled event: ${type}`);
    }

    // Log audit entry
    await this.store.appendAuditLog({
      timestamp: now,
      source: "WS",
      accountId: (data as Record<string, string>).accountId,
      event: type,
      syncStatus: "SUCCESS",
    });
  }

  private async handleMarkUpdate(data: {
    marks: Record<string, Record<string, string>>;
  }): Promise<void> {
    // Merge new marks into existing
    for (const [exchange, assets] of Object.entries(data.marks)) {
      this.marks[exchange] = {
        ...(this.marks[exchange] || {}),
        ...(assets as Record<string, DecimalString>),
      };
    }

    // Save to store
    await this.store.setMarks(this.marks as MarkPrices);

    // Recalculate all positions with new marks
    await this.recalculateWithMarks();
  }

  private async handleAccountUpdate(
    data: Record<string, unknown>
  ): Promise<void> {
    const accountId = data.accountId as string;
    if (!accountId) return;

    const snapshot = await this.store.getSnapshot();
    if (!snapshot) return;

    const account = snapshot.find((a) => a.accountId === accountId);
    if (!account) return;

    // Update account fields from the event
    if (data.balance !== undefined)
      account.balance = ds(data.balance as string);
    if (data.isolatedPositionMargin !== undefined)
      account.isolatedPositionMargin = ds(
        data.isolatedPositionMargin as string
      );
    if (data.crossPositionMargin !== undefined)
      account.crossPositionMargin = ds(
        data.crossPositionMargin as string
      );
    if (data.crossOrderMargin !== undefined)
      account.crossOrderMargin = ds(data.crossOrderMargin as string);
    if (data.isolatedOrderMargin !== undefined)
      account.isolatedOrderMargin = ds(
        data.isolatedOrderMargin as string
      );
    if (data.highWaterMark !== undefined)
      account.highWaterMark = ds(data.highWaterMark as string);

    account.lastRealtimeUpdateAt = new Date().toISOString();
    account.lastUpdatedAt = new Date().toISOString();
    account.dataSource = "LIVE_CALCULATED";

    await this.store.setSnapshot(snapshot);
  }

  private async handlePositionUpdate(
    data: Record<string, unknown>,
    _type: string
  ): Promise<void> {
    const accountId = data.accountId as string;
    const positionId = data.positionId as string;
    if (!accountId || !positionId) return;

    const snapshot = await this.store.getSnapshot();
    if (!snapshot) return;

    const account = snapshot.find((a) => a.accountId === accountId);
    if (!account) return;

    // Update or add position
    const idx = account.positions.findIndex(
      (p) => p.positionId === positionId
    );
    const posData = data as unknown as PositionSnapshot;

    if (idx >= 0) {
      account.positions[idx] = {
        ...account.positions[idx],
        ...posData,
      };
    } else {
      account.positions.push(posData);
    }

    // Filter out zero-quantity positions
    account.positions = account.positions.filter(
      (p) => !toDecimal(p.quantity || "0").isZero()
    );
    account.openPositionCount = account.positions.length;
    account.lastRealtimeUpdateAt = new Date().toISOString();
    account.lastUpdatedAt = new Date().toISOString();

    await this.store.setSnapshot(snapshot);
  }

  private async handlePositionClosed(
    data: Record<string, unknown>,
    _type: string
  ): Promise<void> {
    const accountId = data.accountId as string;
    const positionId = data.positionId as string;
    if (!accountId || !positionId) return;

    const snapshot = await this.store.getSnapshot();
    if (!snapshot) return;

    const account = snapshot.find((a) => a.accountId === accountId);
    if (!account) return;

    account.positions = account.positions.filter(
      (p) => p.positionId !== positionId
    );
    account.openPositionCount = account.positions.length;
    account.lastRealtimeUpdateAt = new Date().toISOString();
    account.lastUpdatedAt = new Date().toISOString();

    await this.store.setSnapshot(snapshot);
  }

  private async handleOrderEvent(
    data: Record<string, unknown>,
    type: string
  ): Promise<void> {
    const accountId = data.accountId as string;
    const orderId = data.orderId as string;
    if (!accountId || !orderId) return;

    const snapshot = await this.store.getSnapshot();
    if (!snapshot) return;

    const account = snapshot.find((a) => a.accountId === accountId);
    if (!account) return;

    const orderData = data as unknown as OrderSnapshot;
    const idx = account.orders.findIndex((o) => o.orderId === orderId);

    if (
      type === "order.cancelled" ||
      type === "order.filled"
    ) {
      // Remove completed/cancelled orders from open orders
      if (idx >= 0) {
        account.orders.splice(idx, 1);
      }
    } else if (idx >= 0) {
      account.orders[idx] = { ...account.orders[idx], ...orderData };
    } else {
      account.orders.push(orderData);
    }

    account.openOrderCount = account.orders.length;
    account.lastRealtimeUpdateAt = new Date().toISOString();
    account.lastUpdatedAt = new Date().toISOString();

    await this.store.setSnapshot(snapshot);
  }

  private async handleTradeCreated(
    data: Record<string, unknown>
  ): Promise<void> {
    // Trade events are logged but don't require immediate recalculation
    // The position.updated event handles the position changes
    console.log(
      `[WS] Trade: ${data.type} ${(data.side as string)?.toUpperCase()} ${data.quantity} ${data.base} @ ${data.price}`
    );
  }

  /**
   * Recalculate all position PnLs using current marks.
   * Called on every mark.updated event.
   */
  private async recalculateWithMarks(): Promise<void> {
    const snapshot = await this.store.getSnapshot();
    if (!snapshot) return;

    let changed = false;

    for (const account of snapshot) {
      for (const position of account.positions) {
        const markPrice =
          this.marks[position.exchange]?.[position.asset];
        if (!markPrice) continue;

        const { unrealizedPnl, notionalValue, roe } =
          recalculatePosition(position, ds(markPrice));

        position.unrealizedPnl = unrealizedPnl;
        position.notionalValue = notionalValue;
        position.returnOnEquity = roe;
        position.markPrice = ds(markPrice);
        changed = true;
      }

      if (changed && account.balance) {
        // Recalculate account-level equity
        const totalUpnl = sumUnrealizedPnl(account.positions);
        const isolatedMargin = toDecimal(account.isolatedPositionMargin || "0");
        account.unrealizedPnl = totalUpnl;
        account.equity = fromDecimal(
          toDecimal(account.balance)
            .plus(toDecimal(totalUpnl))
            .plus(isolatedMargin)
        );
        account.dataSource = "LIVE_CALCULATED";
        account.lastRealtimeUpdateAt = new Date().toISOString();
        account.lastUpdatedAt = new Date().toISOString();
      }
    }

    if (changed) {
      await this.store.setSnapshot(snapshot);
    }
  }

  private async updateHealth(
    status: "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "ERROR"
  ): Promise<void> {
    const existing = (await this.store.getHealth()) || {
      restStatus: "UNKNOWN" as const,
      wsStatus: "DISCONNECTED" as const,
      freshness: "OFFLINE" as const,
      accountCount: 0,
    };

    await this.store.setHealth({
      ...existing,
      wsStatus: status,
      lastWsEventAt:
        status === "CONNECTED" ? new Date().toISOString() : existing.lastWsEventAt,
    });
  }
}
