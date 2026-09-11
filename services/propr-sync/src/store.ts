// ─── Redis/KV Store Interface ─────────────────────────────────────────────────
// Centralized state store for normalized data. All UI components read from here.

import type {
  AccountSnapshot,
  MarkPrices,
  SystemHealth,
  AuditLogEntry,
  FinanceTransaction,
  PayoutRecord,
  TradeSnapshot,
} from "@propr/data-model";

/**
 * Abstract store interface.
 * In production: Redis (ioredis) or Vercel KV.
 * For local dev: in-memory implementation.
 */
export interface DataStore {
  // ─── Snapshot ─────────────────────────────────────────────────────
  getSnapshot(): Promise<AccountSnapshot[] | null>;
  setSnapshot(accounts: AccountSnapshot[]): Promise<void>;

  // ─── Mark Prices ──────────────────────────────────────────────────
  getMarks(): Promise<MarkPrices | null>;
  setMarks(marks: MarkPrices): Promise<void>;

  // ─── System Health ────────────────────────────────────────────────
  getHealth(): Promise<SystemHealth | null>;
  setHealth(health: SystemHealth): Promise<void>;

  // ─── Payouts ──────────────────────────────────────────────────────
  getPayouts(): Promise<PayoutRecord[]>;
  setPayouts(payouts: PayoutRecord[]): Promise<void>;

  // ─── Finance Ledger ───────────────────────────────────────────────
  getLedger(): Promise<FinanceTransaction[]>;
  setLedger(transactions: FinanceTransaction[]): Promise<void>;

  // ─── Trades ───────────────────────────────────────────────────────
  appendTrade(accountId: string, trade: TradeSnapshot): Promise<void>;
  getTrades(accountId: string, limit?: number, offset?: number): Promise<TradeSnapshot[]>;

  // ─── Audit Log ────────────────────────────────────────────────────
  appendAuditLog(entry: AuditLogEntry): Promise<void>;
  getAuditLog(limit?: number): Promise<AuditLogEntry[]>;
}

/**
 * In-memory store for local development.
 * Can be replaced with Redis/KV in production.
 */
export class MemoryStore implements DataStore {
  private snapshot: AccountSnapshot[] | null = null;
  private marks: MarkPrices | null = null;
  private health: SystemHealth | null = null;
  private payouts: PayoutRecord[] = [];
  private ledger: FinanceTransaction[] = [];
  private auditLog: AuditLogEntry[] = [];
  private tradesByAccount = new Map<string, TradeSnapshot[]>();

  async getSnapshot() {
    return this.snapshot;
  }
  async setSnapshot(accounts: AccountSnapshot[]) {
    this.snapshot = accounts;
    for (const acc of accounts) {
      if (acc.trades && acc.trades.length > 0) {
        const existing = this.tradesByAccount.get(acc.accountId) || [];
        for (const tr of acc.trades) {
          if (!existing.some((t) => t.tradeId === tr.tradeId)) {
            existing.push(tr);
          }
        }
        this.tradesByAccount.set(acc.accountId, existing);
      }
    }
  }

  async getMarks() {
    return this.marks;
  }
  async setMarks(marks: MarkPrices) {
    this.marks = marks;
  }

  async getHealth() {
    return this.health;
  }
  async setHealth(health: SystemHealth) {
    this.health = health;
  }

  async getPayouts() {
    return this.payouts;
  }
  async setPayouts(payouts: PayoutRecord[]) {
    this.payouts = payouts;
  }

  async getLedger() {
    return this.ledger;
  }
  async setLedger(transactions: FinanceTransaction[]) {
    this.ledger = transactions;
  }

  async appendTrade(accountId: string, trade: TradeSnapshot) {
    const list = this.tradesByAccount.get(accountId) || [];
    if (!list.some((t) => t.tradeId === trade.tradeId)) {
      list.push(trade);
      this.tradesByAccount.set(accountId, list);
    }
    if (this.snapshot) {
      const acc = this.snapshot.find((a) => a.accountId === accountId);
      if (acc) {
        acc.trades = this.tradesByAccount.get(accountId) || [];
      }
    }
  }

  async getTrades(accountId: string, limit?: number, offset?: number) {
    const list = this.tradesByAccount.get(accountId) || [];
    const start = offset || 0;
    const end = limit !== undefined ? start + limit : undefined;
    return list.slice(start, end);
  }

  async appendAuditLog(entry: AuditLogEntry) {
    this.auditLog.push(entry);
    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }
  async getAuditLog(limit = 100) {
    return this.auditLog.slice(-limit);
  }
}

/**
 * Redis-backed store using ioredis.
 */
export class RedisStore implements DataStore {
  private redis: import("ioredis").default;

  constructor(redisUrl: string) {
    // Dynamic import to avoid requiring ioredis in all environments
    const Redis = require("ioredis");
    this.redis = new Redis(redisUrl);
  }

  private async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  private async setJson<T>(key: string, value: T, ttl?: number): Promise<void> {
    const json = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, json);
    } else {
      await this.redis.set(key, json);
    }
  }

  async getSnapshot() {
    return this.getJson<AccountSnapshot[]>("propr:snapshot");
  }
  async setSnapshot(accounts: AccountSnapshot[]) {
    await this.setJson("propr:snapshot", accounts);
  }

  async getMarks() {
    return this.getJson<MarkPrices>("propr:marks");
  }
  async setMarks(marks: MarkPrices) {
    await this.setJson("propr:marks", marks, 60); // 60s TTL
  }

  async getHealth() {
    return this.getJson<SystemHealth>("propr:health");
  }
  async setHealth(health: SystemHealth) {
    await this.setJson("propr:health", health, 300); // 5 min TTL
  }

  async getPayouts() {
    return (await this.getJson<PayoutRecord[]>("propr:payouts")) || [];
  }
  async setPayouts(payouts: PayoutRecord[]) {
    await this.setJson("propr:payouts", payouts);
  }

  async getLedger() {
    return (
      (await this.getJson<FinanceTransaction[]>("propr:finance:ledger")) || []
    );
  }
  async setLedger(transactions: FinanceTransaction[]) {
    await this.setJson("propr:finance:ledger", transactions);
  }

  async appendTrade(accountId: string, trade: TradeSnapshot) {
    const key = `propr:trades:${accountId}`;
    await this.redis.rpush(key, JSON.stringify(trade));
    const snapshot = await this.getSnapshot();
    if (snapshot) {
      const acc = snapshot.find((a) => a.accountId === accountId);
      if (acc) {
        acc.trades = acc.trades || [];
        if (!acc.trades.some((t) => t.tradeId === trade.tradeId)) {
          acc.trades.push(trade);
          await this.setSnapshot(snapshot);
        }
      }
    }
  }

  async getTrades(accountId: string, limit = 100, offset = 0) {
    const key = `propr:trades:${accountId}`;
    const items = await this.redis.lrange(key, offset, offset + limit - 1);
    return items.map((item) => JSON.parse(item) as TradeSnapshot);
  }

  async appendAuditLog(entry: AuditLogEntry) {
    await this.redis.lpush("propr:audit", JSON.stringify(entry));
    await this.redis.ltrim("propr:audit", 0, 999);
  }
  async getAuditLog(limit = 100) {
    const items = await this.redis.lrange("propr:audit", 0, limit - 1);
    return items.map((item) => JSON.parse(item) as AuditLogEntry);
  }
}
