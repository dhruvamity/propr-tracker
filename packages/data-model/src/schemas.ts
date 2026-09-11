// ─── Zod Schemas ──────────────────────────────────────────────────────────────
// Validation schemas for all Propr API responses and internal data types.
// These ensure data integrity at the boundary between Propr and our normalized model.

import { z } from "zod";

// ─── Primitives ───────────────────────────────────────────────────────────────

/** Decimal string — any string that looks like a number. */
export const DecimalStringSchema = z.string();

/** ISO 8601 datetime string. */
export const DateTimeSchema = z.string();

// ─── Propr Challenge Attempt ──────────────────────────────────────────────────

export const ProprChallengeAttemptSchema = z.object({
  attemptId: z.string(),
  challengeId: z.string(),
  userId: z.string(),
  accountId: z.string(),
  status: z.enum(["active", "passed", "failed"]),
  totalPnl: z.string().optional(),
  winRate: z.string().optional(),
  maxDrawdown: z.string().optional(),
  tradingDays: z.number().optional(),
  failureReason: z.string().optional().nullable(),
  currentPhase: z.number().optional(),
  challenge: z
    .object({
      name: z.string().optional(),
      initialBalance: z.string().optional(),
      maxDailyLossPercent: z.string().optional(),
      maxDrawdownPercent: z.string().optional(),
      profitTargetPercent: z.string().optional(),
      drawdownType: z.string().optional(),
      requiredTradingDays: z.number().optional(),
      phases: z.array(z.unknown()).optional(),
    })
    .optional()
    .nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
}).passthrough();

// ─── Propr Funded Issuance ────────────────────────────────────────────────────

export const ProprFundedIssuanceSchema = z.object({
  issuanceId: z.string(),
  userId: z.string(),
  accountId: z.string(),
  status: z.enum(["active", "closed", "review_pending"]),
  closureReason: z.string().optional().nullable(),
  accountType: z.enum(["b_book", "a_book"]).optional(),
  initialBalance: z.string().optional(),
  maxDailyLossPercent: z.string().optional(),
  maxDrawdownPercent: z.string().optional(),
  drawdownType: z.string().optional(),
  challengeAttemptId: z.string().optional().nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
}).passthrough();

// ─── Propr Position ───────────────────────────────────────────────────────────

export const ProprPositionSchema = z.object({
  positionId: z.string(),
  userId: z.string(),
  accountId: z.string(),
  exchange: z.string(),
  productType: z.string(),
  status: z.enum(["open", "closed", "liquidated"]),
  asset: z.string(),
  base: z.string(),
  quote: z.string(),
  positionSide: z.enum(["long", "short"]),
  leverage: z.string(),
  marginMode: z.enum(["cross", "isolated"]),
  quantity: z.string(),
  entryPrice: z.string(),
  breakEvenPrice: z.string().optional(),
  markPrice: z.string(),
  liquidationPrice: z.string().optional().nullable(),
  unrealizedPnl: z.string(),
  realizedPnl: z.string(),
  marginUsed: z.string(),
  notionalValue: z.string(),
  cumulativeFunding: z.string(),
  cumulativeTradingFees: z.string(),
  tradingFeeRate: z.string(),
  returnOnEquity: z.string(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  closedAt: DateTimeSchema.nullable().optional(),
}).passthrough();

// ─── Propr Order ──────────────────────────────────────────────────────────────

export const ProprOrderSchema = z.object({
  orderId: z.string(),
  intentId: z.string(),
  orderGroupId: z.string().nullable().optional(),
  exchangeOrderId: z.string().nullable().optional(),
  userId: z.string(),
  accountId: z.string(),
  positionId: z.string().nullable().optional(),
  exchange: z.string(),
  productType: z.string(),
  type: z.enum([
    "market",
    "limit",
    "stop_market",
    "stop_limit",
    "take_profit_market",
    "take_profit_limit",
  ]),
  side: z.enum(["buy", "sell"]),
  positionSide: z.enum(["long", "short"]),
  timeInForce: z.enum(["GTC", "IOC", "FOK", "GTX"]),
  status: z.enum([
    "pending",
    "open",
    "partially_filled",
    "filled",
    "cancelled",
    "expired",
    "rejected",
  ]),
  asset: z.string(),
  base: z.string(),
  quote: z.string(),
  quantity: z.string(),
  price: z.string().optional().nullable(),
  triggerPrice: z.string().optional().nullable(),
  reduceOnly: z.boolean(),
  closePosition: z.boolean(),
  cumulativeQuantity: z.string(),
  cumulativeQuote: z.string(),
  averageFillPrice: z.string().nullable().optional(),
  cumulativeTradingFees: z.string(),
  tradingFeeRate: z.string(),
  expiresAt: DateTimeSchema.nullable().optional(),
  filledAt: DateTimeSchema.nullable().optional(),
  cancelledAt: DateTimeSchema.nullable().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
}).passthrough();

// ─── Propr Trade ──────────────────────────────────────────────────────────────

export const ProprTradeSchema = z.object({
  tradeId: z.string(),
  userId: z.string(),
  accountId: z.string(),
  orderId: z.string(),
  positionId: z.string(),
  exchangeTradeId: z.string().nullable().optional(),
  transactionHash: z.string().nullable().optional(),
  exchange: z.string(),
  productType: z.string(),
  type: z.enum(["open", "increase", "reduce", "close", "flip", "liquidation"]),
  liquidityType: z.enum(["maker", "taker"]),
  asset: z.string(),
  base: z.string(),
  quote: z.string(),
  side: z.enum(["buy", "sell"]),
  positionSide: z.enum(["long", "short"]),
  quantity: z.string(),
  price: z.string(),
  quoteQuantity: z.string(),
  fee: z.string(),
  feeAsset: z.string(),
  feeRate: z.string(),
  leverage: z.string(),
  marginMode: z.enum(["cross", "isolated"]),
  realizedPnl: z.string(),
  positionSizeBefore: z.string(),
  slippage: z.string(),
  markPriceAtOrder: z.string(),
  isLiquidation: z.boolean(),
  executedAt: DateTimeSchema,
  createdAt: DateTimeSchema,
}).passthrough();

// ─── Propr Payout ─────────────────────────────────────────────────────────────

export const ProprPayoutSchema = z.object({
  payoutId: z.string(),
  userId: z.string().optional(),
  type: z.string().optional(),
  reason: z.string(),
  status: z.enum([
    "requested",
    "processing",
    "processed",
    "rejected",
    "cancelled",
    "failed",
  ]),
  amount: z.string(),
  accountId: z.string().optional(),
  userAmount: z.string().optional(),
  systemAmount: z.string().optional(),
  credentialId: z.string().optional(),
  txHash: z.string().nullable().optional(),
  processedAt: DateTimeSchema.nullable().optional(),
  createdAt: DateTimeSchema,
}).passthrough();

// ─── Propr User Profile ──────────────────────────────────────────────────────

export const ProprUserProfileSchema = z.object({
  userId: z.string(),
  email: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
}).passthrough();

// ─── Propr Margin Config ──────────────────────────────────────────────────────

export const ProprMarginConfigSchema = z.object({
  configId: z.string(),
  accountId: z.string(),
  exchange: z.string(),
  asset: z.string(),
  marginMode: z.enum(["cross", "isolated"]),
  leverage: z.string(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
}).passthrough();

// ─── Paginated Response ───────────────────────────────────────────────────────

export function PaginatedResponseSchema<T extends z.ZodTypeAny>(
  itemSchema: T
) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number().optional(),
  });
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

export const WsEventSchema = z.object({
  type: z.string(),
  userId: z.string().optional(),
  data: z.record(z.unknown()),
  timestamp: z.number(),
});

export const WsMarkUpdateSchema = z.object({
  type: z.literal("mark.updated"),
  data: z.object({
    marks: z.record(z.record(z.string())),
    timestamp: z.number(),
  }),
  timestamp: z.number(),
});

export const WsAccountUpdateSchema = z.object({
  type: z.literal("account.updated"),
  userId: z.string(),
  data: z
    .object({
      accountId: z.string(),
      balance: z.string().optional(),
      isolatedPositionMargin: z.string().optional(),
      crossPositionMargin: z.string().optional(),
      crossOrderMargin: z.string().optional(),
      isolatedOrderMargin: z.string().optional(),
      highWaterMark: z.string().optional(),
    })
    .passthrough(),
  timestamp: z.number(),
});

// ─── Health Check ─────────────────────────────────────────────────────────────

export const HealthCheckSchema = z.object({
  status: z.enum(["OK"]),
});

export const ServiceHealthSchema = z.object({
  core: z.enum(["OK", "ERROR"]),
});

// ─── Daily Metrics (may not exist) ────────────────────────────────────────────

export const DailyMetricsSchema = z.object({
  accountId: z.string(),
  startingBalance: z.string(),
  startingIsolatedPositionMargin: z.string(),
  date: z.string(),
}).passthrough();
