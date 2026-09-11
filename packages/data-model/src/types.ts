// ─── Core Types ───────────────────────────────────────────────────────────────
// Normalized data model for the Propr Trading Terminal.
// All monetary values are DecimalString — never use floating-point for money.

/** Branded string type for decimal monetary values. */
export type DecimalString = string & { readonly __brand: "DecimalString" };

// ─── Account Lifecycle ────────────────────────────────────────────────────────

export type AccountStage =
  | "EVALUATION"
  | "PASSED"
  | "FUNDED"
  | "BREACHED"
  | "FAILED"
  | "CLOSED"
  | "REVIEW_PENDING"
  | "UNKNOWN";

export type AccountSource = "challenge_attempt" | "funded_issuance";

export type DrawdownType = "static" | "trailing";

// ─── Data Provenance ──────────────────────────────────────────────────────────

export type DataSource = "PROPR_API" | "LIVE_CALCULATED" | "FINANCE_LEDGER";

export type SyncFreshness = "LIVE" | "DELAYED" | "STALE" | "OFFLINE";

export const FRESHNESS_THRESHOLDS = {
  LIVE: 5_000,       // < 5 sec
  DELAYED: 30_000,   // 5–30 sec
  STALE: 120_000,    // 30–120 sec
  // > 120 sec → OFFLINE
} as const;

// ─── Position Snapshot ────────────────────────────────────────────────────────

export interface PositionSnapshot {
  positionId: string;
  accountId: string;
  exchange: string;
  productType: string;
  status: "open" | "closed" | "liquidated";
  asset: string;
  base: string;
  quote: string;
  positionSide: "long" | "short";
  leverage: DecimalString;
  marginMode: "cross" | "isolated";
  quantity: DecimalString;
  entryPrice: DecimalString;
  breakEvenPrice?: DecimalString;
  markPrice: DecimalString;
  liquidationPrice?: DecimalString;
  unrealizedPnl: DecimalString;
  realizedPnl: DecimalString;
  marginUsed: DecimalString;
  notionalValue: DecimalString;
  cumulativeFunding: DecimalString;
  cumulativeTradingFees: DecimalString;
  tradingFeeRate: DecimalString;
  returnOnEquity: DecimalString;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
}

// ─── Order Snapshot ───────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "open"
  | "partially_filled"
  | "filled"
  | "cancelled"
  | "expired"
  | "rejected";

export type OrderType =
  | "market"
  | "limit"
  | "stop_market"
  | "stop_limit"
  | "take_profit_market"
  | "take_profit_limit";

export type TimeInForce = "GTC" | "IOC" | "FOK" | "GTX";

export interface OrderSnapshot {
  orderId: string;
  intentId: string;
  orderGroupId?: string | null;
  exchangeOrderId?: string | null;
  userId: string;
  accountId: string;
  positionId?: string | null;
  exchange: string;
  productType: string;
  type: OrderType;
  side: "buy" | "sell";
  positionSide: "long" | "short";
  timeInForce: TimeInForce;
  status: OrderStatus;
  asset: string;
  base: string;
  quote: string;
  quantity: DecimalString;
  price?: DecimalString;
  triggerPrice?: DecimalString | null;
  reduceOnly: boolean;
  closePosition: boolean;
  cumulativeQuantity: DecimalString;
  cumulativeQuote: DecimalString;
  averageFillPrice?: DecimalString | null;
  cumulativeTradingFees: DecimalString;
  tradingFeeRate: DecimalString;
  expiresAt?: string | null;
  filledAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Trade Snapshot ───────────────────────────────────────────────────────────

export type TradeType =
  | "open"
  | "increase"
  | "reduce"
  | "close"
  | "flip"
  | "liquidation";

export interface TradeSnapshot {
  tradeId: string;
  userId: string;
  accountId: string;
  orderId: string;
  positionId: string;
  exchangeTradeId?: string | null;
  transactionHash?: string | null;
  exchange: string;
  productType: string;
  type: TradeType;
  liquidityType: "maker" | "taker";
  asset: string;
  base: string;
  quote: string;
  side: "buy" | "sell";
  positionSide: "long" | "short";
  quantity: DecimalString;
  price: DecimalString;
  quoteQuantity: DecimalString;
  fee: DecimalString;
  feeAsset: string;
  feeRate: DecimalString;
  leverage: DecimalString;
  marginMode: "cross" | "isolated";
  realizedPnl: DecimalString;
  positionSizeBefore: DecimalString;
  slippage: DecimalString;
  markPriceAtOrder: DecimalString;
  isLiquidation: boolean;
  executedAt: string;
  createdAt: string;
}

// ─── Payout Record ────────────────────────────────────────────────────────────

export type PayoutStatus =
  | "requested"
  | "processing"
  | "processed"
  | "rejected"
  | "cancelled"
  | "failed";

export interface PayoutRecord {
  payoutId: string;
  userId?: string;
  type?: string;
  reason: string;
  status: PayoutStatus;
  amount: DecimalString;
  accountId?: string;
  userAmount?: DecimalString;
  systemAmount?: DecimalString;
  credentialId?: string;
  txHash?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

// ─── Finance Ledger ───────────────────────────────────────────────────────────

export type FinanceTransactionType =
  | "purchase"
  | "payout"
  | "refund"
  | "adjustment";

export interface FinanceTransaction {
  id: string;
  date: string;
  firm: string;
  accountId?: string;
  challengeName?: string;
  type: FinanceTransactionType;
  transactionType?: FinanceTransactionType;
  amountUSD: DecimalString;
  amountINR?: DecimalString;
  purchaseFaceValueUSD?: DecimalString;
  actualCashCostINR?: DecimalString;
  actualCashCostUSDEquivalent?: DecimalString;
  refundINR?: DecimalString;
  adjustmentINR?: DecimalString;
  payoutINR?: DecimalString;
  cashTransactionDate?: string;
  bankVerified: boolean;
  bankReference?: string;
  invoiceNumber?: string;
  purchaseId?: string;
  payoutId?: string;
  notes?: string;
}

// ─── Account Snapshot ─────────────────────────────────────────────────────────

export interface AccountSnapshot {
  accountId: string;
  firm: "Propr";

  stage: AccountStage;
  source: AccountSource;

  // Challenge metadata
  challengeName?: string;
  challengeId?: string;
  attemptId?: string;
  issuanceId?: string;
  currentPhase?: number;
  accountType?: "paper" | "b_book" | "a_book";

  // Failure/closure
  failureReason?: string;
  closureReason?: string;

  // Balance configuration
  initialBalance?: DecimalString;
  startingBalance?: DecimalString;
  phaseStartingBalance?: DecimalString;

  // Live balances
  balance?: DecimalString;
  equity?: DecimalString;

  // PnL
  realizedPnl?: DecimalString;
  unrealizedPnl?: DecimalString;
  fees?: DecimalString;
  totalPnl?: DecimalString;

  // Challenge/funded risk config
  drawdownType?: DrawdownType;
  profitTargetPercent?: DecimalString;
  profitTargetProgressPercent?: DecimalString;
  maxDrawdownPercent?: DecimalString;
  drawdownUsedPercent?: DecimalString;
  drawdownRemaining?: DecimalString;
  maxDailyLossPercent?: DecimalString;
  dailyLossUsedPercent?: DecimalString;
  dailyLossRemaining?: DecimalString;
  highWaterMark?: DecimalString;

  // Trading days
  tradingDays?: number;
  requiredTradingDays?: number;

  // Margin
  isolatedPositionMargin?: DecimalString;
  crossPositionMargin?: DecimalString;
  crossOrderMargin?: DecimalString;
  isolatedOrderMargin?: DecimalString;

  // Position/order counts
  openPositionCount: number;
  openOrderCount: number;

  // Nested data
  positions: PositionSnapshot[];
  orders: OrderSnapshot[];
  trades?: TradeSnapshot[];

  // Finance
  purchaseCostUSD?: DecimalString;
  purchaseCostINR?: DecimalString;
  payoutsWithdrawnUSD?: DecimalString;
  payoutsWithdrawnINR?: DecimalString;
  actualCashPnLUSD?: DecimalString;
  actualCashPnLINR?: DecimalString;

  // Win rate
  winRate?: DecimalString;

  // Data provenance
  dataSource: DataSource;
  lastRestSyncAt?: string;
  lastRealtimeUpdateAt?: string;
  lastUpdatedAt: string;
}

// ─── System Health ────────────────────────────────────────────────────────────

export interface SystemHealth {
  restStatus: "HEALTHY" | "ERROR" | "UNKNOWN";
  wsStatus: "CONNECTED" | "CONNECTING" | "DISCONNECTED" | "ERROR";
  lastRestSyncAt?: string;
  lastWsEventAt?: string;
  lastFullSyncAt?: string;
  freshness: SyncFreshness;
  accountCount: number;
  errorMessage?: string;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  timestamp: string;
  source: "REST" | "WS" | "CALCULATION" | "FINANCE" | "RECONCILIATION";
  accountId?: string;
  event: string;
  oldValue?: string;
  newValue?: string;
  syncStatus: "SUCCESS" | "FAILURE" | "WARNING";
}

// ─── Mark Prices ──────────────────────────────────────────────────────────────

export interface MarkPrices {
  [exchange: string]: {
    [asset: string]: DecimalString;
  };
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  offset: number;
  limit?: number;
}

// ─── Challenge Attempt (raw from Propr API) ───────────────────────────────────

export interface ProprChallengeAttempt {
  attemptId: string;
  challengeId: string;
  userId: string;
  accountId: string;
  status: "active" | "passed" | "failed";
  totalPnl?: string;
  winRate?: string;
  maxDrawdown?: string;
  tradingDays?: number;
  failureReason?: string;
  currentPhase?: number;
  challenge?: {
    name?: string;
    initialBalance?: string;
    maxDailyLossPercent?: string;
    maxDrawdownPercent?: string;
    profitTargetPercent?: string;
    drawdownType?: string;
    requiredTradingDays?: number;
    phases?: unknown[];
  };
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

// ─── Funded Account Issuance (raw from Propr API) ─────────────────────────────

export interface ProprFundedIssuance {
  issuanceId: string;
  userId: string;
  accountId: string;
  status: "active" | "closed" | "review_pending";
  closureReason?: string;
  accountType?: "b_book" | "a_book";
  initialBalance?: string;
  maxDailyLossPercent?: string;
  maxDrawdownPercent?: string;
  drawdownType?: string;
  challengeAttemptId?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

export interface WsEvent {
  type: string;
  userId?: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface WsMarkUpdate {
  type: "mark.updated";
  data: {
    marks: {
      [exchange: string]: {
        [asset: string]: string;
      };
    };
    timestamp: number;
  };
  timestamp: number;
}

export interface WsAccountUpdate {
  type: "account.updated";
  userId: string;
  data: {
    accountId: string;
    balance?: string;
    isolatedPositionMargin?: string;
    crossPositionMargin?: string;
    crossOrderMargin?: string;
    isolatedOrderMargin?: string;
    highWaterMark?: string;
    [key: string]: unknown;
  };
  timestamp: number;
}

// ─── Daily Metrics (may not exist in API) ─────────────────────────────────────

export interface DailyMetrics {
  accountId: string;
  startingBalance: DecimalString;
  startingIsolatedPositionMargin: DecimalString;
  date: string;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: string;
  updatedAt: string;
}
