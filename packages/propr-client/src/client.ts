// ─── Propr REST API Client ────────────────────────────────────────────────────
// Read-only, typed client for all Propr API endpoints.
// API key is handled server-side only — never exposed to the browser.

import type {
  ProprChallengeAttempt,
  ProprFundedIssuance,
  PositionSnapshot,
  OrderSnapshot,
  TradeSnapshot,
  PayoutRecord,
  UserProfile,
  PaginatedResponse,
  DailyMetrics,
} from "@propr/data-model";
import {
  ProprChallengeAttemptSchema,
  ProprFundedIssuanceSchema,
  ProprPositionSchema,
  ProprOrderSchema,
  ProprTradeSchema,
  ProprPayoutSchema,
  ProprUserProfileSchema,
  ProprMarginConfigSchema,
  DailyMetricsSchema,
  HealthCheckSchema,
  ServiceHealthSchema,
} from "@propr/data-model";

const DEFAULT_BASE_URL = "https://api.propr.xyz/v1";
const DEFAULT_PAGE_SIZE = 100; // Maximize to reduce request count

export interface ProprClientConfig {
  apiKey: string;
  baseUrl?: string;
  pageSize?: number;
}

export class ProprApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: number,
    message?: string
  ) {
    super(`Propr API error ${status}: ${message || "Unknown error"}`);
    this.name = "ProprApiError";
  }
}

export class ProprClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly pageSize: number;

  constructor(config: ProprClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.pageSize = config.pageSize || DEFAULT_PAGE_SIZE;
  }

  // ─── Internal Fetch ─────────────────────────────────────────────────────────

  private async request<T>(
    path: string,
    params?: Record<string, string | number | undefined>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorBody: { code?: number; message?: string } = {};
      try {
        errorBody = (await response.json()) as { code?: number; message?: string };
      } catch {
        // ignore parse errors
      }
      throw new ProprApiError(
        response.status,
        errorBody.code,
        errorBody.message
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Fetch all pages for a paginated endpoint.
   * Rate limit: 1200 req/min — this fetches sequentially.
   */
  private async fetchAllPages<T>(
    path: string,
    params?: Record<string, string | number | undefined>
  ): Promise<T[]> {
    const allItems: T[] = [];
    let offset = 0;

    while (true) {
      const result = await this.request<PaginatedResponse<T>>(path, {
        ...params,
        limit: this.pageSize,
        offset,
      });

      allItems.push(...result.data);

      // If we got fewer items than the page size, we've reached the end
      if (result.data.length < this.pageSize || allItems.length >= result.total) {
        break;
      }
      offset += result.data.length;
    }

    return allItems;
  }

  // ─── Health ─────────────────────────────────────────────────────────────────

  async getHealth(): Promise<{ status: string }> {
    const raw = await this.request<unknown>("/health");
    return HealthCheckSchema.parse(raw);
  }

  async getServiceHealth(): Promise<{ core: string }> {
    const raw = await this.request<unknown>("/health/services");
    return ServiceHealthSchema.parse(raw);
  }

  // ─── User Profile ──────────────────────────────────────────────────────────

  async getUser(): Promise<UserProfile> {
    const raw = await this.request<unknown>("/users/me");
    return ProprUserProfileSchema.parse(raw) as UserProfile;
  }

  // ─── Challenge Attempts ─────────────────────────────────────────────────────

  async getChallengeAttempts(
    status?: "active" | "passed" | "failed"
  ): Promise<ProprChallengeAttempt[]> {
    const items = await this.fetchAllPages<unknown>("/challenge-attempts", {
      status,
    });
    return items.map((item) =>
      ProprChallengeAttemptSchema.parse(item)
    ) as ProprChallengeAttempt[];
  }

  async getAllChallengeAttempts(): Promise<ProprChallengeAttempt[]> {
    // Fetch all statuses — don't only get active
    const [active, passed, failed] = await Promise.all([
      this.getChallengeAttempts("active"),
      this.getChallengeAttempts("passed"),
      this.getChallengeAttempts("failed"),
    ]);
    return [...active, ...passed, ...failed];
  }

  async getChallengeAttempt(
    attemptId: string
  ): Promise<ProprChallengeAttempt> {
    const raw = await this.request<unknown>(
      `/challenge-attempts/${attemptId}`
    );
    return ProprChallengeAttemptSchema.parse(raw) as ProprChallengeAttempt;
  }

  // ─── Funded Accounts ────────────────────────────────────────────────────────

  async getFundedIssuances(
    status?: "active" | "closed" | "review_pending"
  ): Promise<ProprFundedIssuance[]> {
    const items = await this.fetchAllPages<unknown>(
      "/book-account-issuances",
      { status }
    );
    return items.map((item) =>
      ProprFundedIssuanceSchema.parse(item)
    ) as ProprFundedIssuance[];
  }

  async getAllFundedIssuances(): Promise<ProprFundedIssuance[]> {
    // Fetch all statuses
    const [active, closed, review] = await Promise.all([
      this.getFundedIssuances("active"),
      this.getFundedIssuances("closed"),
      this.getFundedIssuances("review_pending"),
    ]);
    return [...active, ...closed, ...review];
  }

  async getFundedIssuance(issuanceId: string): Promise<ProprFundedIssuance> {
    const raw = await this.request<unknown>(
      `/book-account-issuances/${issuanceId}`
    );
    return ProprFundedIssuanceSchema.parse(raw) as ProprFundedIssuance;
  }

  // ─── Orders ─────────────────────────────────────────────────────────────────

  async getOrders(
    accountId: string,
    status?: string
  ): Promise<OrderSnapshot[]> {
    const items = await this.fetchAllPages<unknown>(
      `/accounts/${accountId}/orders`,
      { status }
    );
    return items.map((item) =>
      ProprOrderSchema.parse(item)
    ) as unknown as OrderSnapshot[];
  }

  async getOpenOrders(accountId: string): Promise<OrderSnapshot[]> {
    // Use exact status enums — not "active" (which returns 400)
    const [pending, open, partiallyFilled] = await Promise.all([
      this.getOrders(accountId, "pending"),
      this.getOrders(accountId, "open"),
      this.getOrders(accountId, "partially_filled"),
    ]);
    return [...pending, ...open, ...partiallyFilled];
  }

  // ─── Positions ──────────────────────────────────────────────────────────────

  async getPositions(
    accountId: string,
    status?: "open" | "closed" | "liquidated"
  ): Promise<PositionSnapshot[]> {
    const items = await this.fetchAllPages<unknown>(
      `/accounts/${accountId}/positions`,
      { status }
    );
    const parsed = items.map((item) =>
      ProprPositionSchema.parse(item)
    ) as unknown as PositionSnapshot[];

    // Filter out zero-quantity positions (per Propr docs)
    return parsed.filter(
      (p) => p.quantity !== "0" && p.quantity !== "0.0" && p.quantity !== ""
    );
  }

  async getOpenPositions(accountId: string): Promise<PositionSnapshot[]> {
    return this.getPositions(accountId, "open");
  }

  // ─── Trades ─────────────────────────────────────────────────────────────────

  async getTrades(
    accountId: string,
    limit?: number
  ): Promise<TradeSnapshot[]> {
    const items = await this.fetchAllPages<unknown>(
      `/accounts/${accountId}/trades`,
      { limit: limit || this.pageSize }
    );
    return items.map((item) =>
      ProprTradeSchema.parse(item)
    ) as unknown as TradeSnapshot[];
  }

  // ─── Margin Config ──────────────────────────────────────────────────────────

  async getMarginConfig(
    accountId: string,
    asset: string
  ): Promise<{
    configId: string;
    accountId: string;
    exchange: string;
    asset: string;
    marginMode: string;
    leverage: string;
  }> {
    const raw = await this.request<unknown>(
      `/accounts/${accountId}/margin-config/${asset}`
    );
    return ProprMarginConfigSchema.parse(raw);
  }

  // ─── Daily Metrics ──────────────────────────────────────────────────────────

  /**
   * Attempt to fetch daily metrics. This endpoint may not exist in the API.
   * Returns null if 404.
   */
  async getDailyMetrics(accountId: string): Promise<DailyMetrics | null> {
    try {
      const raw = await this.request<unknown>(
        `/accounts/${accountId}/daily-metrics`
      );
      return DailyMetricsSchema.parse(raw) as unknown as DailyMetrics;
    } catch (err) {
      if (err instanceof ProprApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  // ─── Payouts ────────────────────────────────────────────────────────────────

  async getPayoutHistory(
    status?: string
  ): Promise<PayoutRecord[]> {
    const items = await this.fetchAllPages<unknown>("/payouts/history", {
      status,
    });
    return items.map((item) =>
      ProprPayoutSchema.parse(item)
    ) as unknown as PayoutRecord[];
  }

  async getAllPayouts(): Promise<PayoutRecord[]> {
    return this.getPayoutHistory();
  }

  // ─── Challenges (public, no auth needed) ────────────────────────────────────

  async getChallenges(): Promise<unknown[]> {
    return this.fetchAllPages<unknown>("/challenges");
  }
}
