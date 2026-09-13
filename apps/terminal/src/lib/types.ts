// ─── Propr Terminal Shared Types ──────────────────────────────────────────────
// Client-safe types used across Server and Client components.

export type AccountStage =
  | "EVALUATION"
  | "PASSED"
  | "FUNDED"
  | "BREACHED"
  | "FAILED"
  | "CLOSED"
  | "REVIEW_PENDING"
  | "UNKNOWN";

export interface AccountSnapshot {
  accountId: string;
  firm: "Propr";
  stage: AccountStage;
  source: "challenge_attempt" | "funded_issuance";
  challengeName?: string;
  challengeId?: string;
  attemptId?: string;
  issuanceId?: string;
  currentPhase?: number;
  accountType?: string;
  failureReason?: string;
  closureReason?: string;
  initialBalance: string;
  startingBalance: string;
  phaseStartingBalance: string;
  balance: string;
  equity: string;
  realizedPnl: string;
  unrealizedPnl: string;
  fees: string;
  totalPnl: string;
  drawdownType?: string;
  profitTargetPercent: string;
  profitTargetPct?: string;
  profitTargetProgressPercent: string;
  toTargetAmount?: string;
  maxDrawdownPercent: string;
  maxDrawdownAmount?: string;
  drawdownUsedPercent: string;
  drawdownUsedAmount?: string;
  drawdownLimitConsumedPercent: string;
  drawdownRemaining: string;
  breachFloor?: string;
  maxDailyLossPercent: string;
  dailyLossLimitAmount?: string;
  dailyLossUsedAmount?: string;
  dailyLossUsedPercent: string;
  dailyLossLimitConsumedPercent: string;
  dailyLossRemaining: string;
  dailyLossFloor?: string;
  failureDetails?: Record<string, unknown>;
  highWaterMark?: string;
  tradingDays?: number;
  requiredTradingDays?: number;
  winRate?: string;
  winLossRatio?: string;
  worstTradeUSD?: string;
  bestTradeUSD?: string;
  closedTradesCount?: number;
  rawFillsCount?: number;
  openPositionCount: number;
  openOrderCount: number;
  positions: PositionData[];
  orders: OrderData[];
  trades?: TradeData[];
  purchaseId?: string;
  purchaseCostUSD: string;
  payoutsWithdrawnUSD: string;
  actualCashPnLUSD: string;
  lastUpdatedAt: string;
}

export interface PositionData {
  positionId: string;
  accountId: string;
  asset: string;
  base: string;
  quote: string;
  positionSide: "long" | "short";
  leverage: string;
  marginMode: "cross" | "isolated";
  quantity: string;
  entryPrice: string;
  markPrice: string;
  liquidationPrice?: string;
  unrealizedPnl: string;
  realizedPnl: string;
  marginUsed: string;
  notionalValue: string;
  returnOnEquity: string;
  cumulativeTradingFees: string;
}

export interface OrderData {
  orderId: string;
  accountId: string;
  asset: string;
  base: string;
  type: string;
  side: "buy" | "sell";
  positionSide: "long" | "short";
  status: string;
  quantity: string;
  price?: string;
  triggerPrice?: string;
  cumulativeQuantity: string;
  createdAt: string;
}

export interface TradeData {
  tradeId: string;
  userId?: string;
  accountId: string;
  orderId?: string;
  positionId?: string;
  exchange?: string;
  type: string;
  liquidityType: "maker" | "taker";
  asset: string;
  base: string;
  quote: string;
  side: "buy" | "sell";
  positionSide: "long" | "short";
  quantity: string;
  price: string;
  quoteQuantity: string;
  fee: string;
  feeAsset?: string;
  feeRate?: string;
  realizedPnl: string;
  slippage?: string;
  executedAt: string;
  createdAt: string;
  fillsCount?: number;
}

export interface PayoutData {
  payoutId: string;
  reason: string;
  status: string;
  amount: string;
  userAmount?: string;
  txHash?: string;
  processedAt?: string;
  createdAt: string;
  accountId?: string;
}

export interface SystemHealth {
  restStatus: "HEALTHY" | "ERROR" | "UNKNOWN";
  wsStatus: "CONNECTED" | "DISCONNECTED" | "ERROR";
  lastSyncAt: string;
  accountCount: number;
  apiHealthy: boolean;
}

export interface FinanceTransaction {
  id: string;
  date: string;
  cashTransactionDate?: string;
  firm: string;
  challengeName?: string;
  type: "purchase" | "payout" | "refund" | "adjustment";
  transactionType?: "purchase" | "payout" | "refund" | "adjustment";
  amountUSD: string;
  amountINR?: string;
  purchaseFaceValueUSD?: string;
  actualCashCostINR?: string;
  bankVerified: boolean;
  bankReference?: string;
  invoiceNumber?: string;
  purchaseId?: string;
  accountId?: string;
  notes?: string;
}

export interface DashboardData {
  accounts: AccountSnapshot[];
  allPositions: PositionData[];
  allOrders: OrderData[];
  payouts: PayoutData[];
  health: SystemHealth;
  finance: {
    totalInvestedUSD: string;
    totalInvestedINR: string;
    proprActualCashCostINR: string;
    breakoutActualCashCostINR: string;
    totalActualCashCostINR: string;
    totalPayoutsUSD: string;
    totalPayoutsINR: string;
    actualCashPnLUSD: string;
    actualCashPnLINR: string;
    activeCapitalUSD: string;
    activeCapitalINR: string;
    activeActualCashCostINR: string;
    historicalSunkCashCostINR: string;
    totalRefundsINR: string;
    totalAdjustmentsINR: string;
    ledger: FinanceTransaction[];
  };
  summary: {
    activeEvals: number;
    funded: number;
    passed: number;
    failedBreached: number;
    totalAccounts: number;
  };
}
