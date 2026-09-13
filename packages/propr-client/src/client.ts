// ─── Propr REST API Client ────────────────────────────────────────────────────
// Read-only, typed client for all Propr API endpoints.
// API key is handled server-side only; never exposed to the browser.

import type {
  ProprChallengeAttempt,
  ProprFundedIssuance,
  PositionSnapshot,
  OrderSnapshot,
  TradeSnapshot,
  TradeQueryParams,
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
  LeverageLimitsSchema,
  WalletCredentialsSchema,
  normalizeAssetTicker,
} from "@propr/data-model";

const DEFAULT_BASE_URL = "https://api.propr.xyz/v1";
const DEFAULT_PAGE_SIZE = 100; // Maximize to reduce request count

export interface ProprClientConfig {
  apiKey: string;
  baseUrl?: string;
  pageSize?: number;
  builderCode?: string;
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
  private readonly builderCode?: string;

  constructor(config: ProprClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.pageSize = config.pageSize || DEFAULT_PAGE_SIZE;
    this.builderCode = config.builderCode;
  }

  // ─── Headers ────────────────────────────────────────────────────────────────

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "X-API-Key": this.apiKey,
      "Content-Type": "application/json",
    };
    if (this.builderCode) {
      headers["X-Builder-Code"] = this.builderCode;
    }
    return headers;
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
      headers: this.getHeaders(),
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

  private async post<T>(path: string, body?: unknown): Promise<{ data: T; status: number }> {
    const url = new URL(`${this.baseUrl}${path}`);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok && response.status !== 201) {
      let errorBody: { code?: number; message?: string } = {};
      try {
        errorBody = (await response.json()) as { code?: number; message?: string };
      } catch {
        // ignore
      }
      throw new ProprApiError(
        response.status,
        errorBody.code,
        errorBody.message
      );
    }

    let data: T;
    try {
      data = (await response.json()) as T;
    } catch {
      data = {} as T;
    }

    return { data, status: response.status };
  }

  private async put<T>(path: string, body?: unknown): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    const response = await fetch(url.toString(), {
      method: "PUT",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorBody: { code?: number; message?: string } = {};
      try {
        errorBody = (await response.json()) as { code?: number; message?: string };
      } catch {
        // ignore
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
   * Rate limit: 1200 req/min; fetches sequentially.
   */
  private async fetchAllPages<T>(
    path: string,
    params?: Record<string, string | number | undefined>
  ): Promise<T[]> {
    const allItems: T[] = [];
    let offset = 0;
    const pageSize =
      typeof params?.limit === "number" ? params.limit : this.pageSize;

    while (true) {
      const result = await this.request<PaginatedResponse<T>>(path, {
        ...params,
        limit: pageSize,
        offset,
      });

      allItems.push(...result.data);

      // If we got fewer items than the page size, we've reached the end
      if (result.data.length < pageSize || allItems.length >= result.total) {
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
    // Fetch all statuses, not only active
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

  // ─── Accounts ───────────────────────────────────────────────────────────────

  async getAccount(accountId: string): Promise<Record<string, unknown> | null> {
    try {
      return await this.request<Record<string, unknown>>(`/accounts/${accountId}`);
    } catch (err) {
      if (
        err instanceof ProprApiError &&
        (err.status === 404 || err.status === 400 || err.status === 403)
      ) {
        return null;
      }
      throw err;
    }
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
    // Use exact status enums (not "active", which returns 400)
    const [pending, open, partiallyFilled] = await Promise.all([
      this.getOrders(accountId, "pending"),
      this.getOrders(accountId, "open"),
      this.getOrders(accountId, "partially_filled"),
    ]);
    return [...pending, ...open, ...partiallyFilled];
  }

  async createOrder(
    accountId: string,
    orderData: Record<string, unknown>
  ): Promise<OrderSnapshot> {
    const res = await this.post<unknown>(
      `/accounts/${accountId}/orders`,
      orderData
    );
    return ProprOrderSchema.parse(res.data) as unknown as OrderSnapshot;
  }

  /**
   * Cancel an order. Accepts both HTTP 200 and HTTP 201 as successful cancellations per API spec.
   */
  async cancelOrder(
    accountId: string,
    orderId: string
  ): Promise<{ success: boolean; status: number; orderId: string }> {
    const res = await this.post<{ orderId?: string; status?: string }>(
      `/accounts/${accountId}/orders/${orderId}/cancel`
    );
    const isSuccess = res.status === 200 || res.status === 201;
    return {
      success: isSuccess,
      status: res.status,
      orderId,
    };
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
    params?: TradeQueryParams | number
  ): Promise<TradeSnapshot[]> {
    const queryParams: Record<string, string | number | undefined> = {};
    if (typeof params === "number") {
      queryParams.limit = params;
    } else if (params) {
      if (params.tradeId !== undefined) queryParams.tradeId = params.tradeId;
      if (params.positionId !== undefined) queryParams.positionId = params.positionId;
      if (params.orderId !== undefined) queryParams.orderId = params.orderId;
      if (params.base !== undefined) queryParams.base = params.base;
      if (params.quote !== undefined) queryParams.quote = params.quote;
      if (params.side !== undefined) queryParams.side = params.side;
      if (params.limit !== undefined) queryParams.limit = params.limit;
      if (params.offset !== undefined) queryParams.offset = params.offset;
    }

    // If offset is explicitly passed, fetch that specific page
    if (typeof params === "object" && params?.offset !== undefined) {
      const result = await this.request<PaginatedResponse<unknown>>(
        `/accounts/${accountId}/trades`,
        queryParams
      );
      return result.data.map((item) =>
        ProprTradeSchema.parse(item)
      ) as unknown as TradeSnapshot[];
    }

    const items = await this.fetchAllPages<unknown>(
      `/accounts/${accountId}/trades`,
      queryParams
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
    const normalizedAsset = normalizeAssetTicker(asset);
    const raw = await this.request<unknown>(
      `/accounts/${accountId}/margin-config/${normalizedAsset}`
    );
    return ProprMarginConfigSchema.parse(raw);
  }

  async updateMarginConfig(
    accountId: string,
    configId: string,
    configData: {
      marginMode?: "cross" | "isolated";
      leverage?: string;
    }
  ): Promise<unknown> {
    return this.put<unknown>(
      `/accounts/${accountId}/margin-config/${configId}`,
      configData
    );
  }

  // ─── Leverage Limits ────────────────────────────────────────────────────────

  async getEffectiveLeverageLimits(): Promise<Record<string, unknown>> {
    const raw = await this.request<unknown>("/leverage-limits/effective");
    return LeverageLimitsSchema.parse(raw);
  }

  // ─── Wallet Credentials ─────────────────────────────────────────────────────

  async getWalletCredentials(): Promise<unknown> {
    const raw = await this.request<unknown>("/wallet/credentials");
    return WalletCredentialsSchema.parse(raw);
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

  // ─── Purchases ──────────────────────────────────────────────────────────────

  async getPurchases(): Promise<unknown[]> {
    return this.fetchAllPages<unknown>("/purchases");
  }

  // ─── Challenges (public, no auth needed) ────────────────────────────────────

  async getChallenges(): Promise<unknown[]> {
    return this.fetchAllPages<unknown>("/challenges");
  }
}
