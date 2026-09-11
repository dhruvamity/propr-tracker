# Challenges & Trading

# **Challenges**

**No Auth**

ⓘ

**Getting Started** -You must purchase a challenge before you can trade via the API. Go to [app.propr.xyz/dashboard](https://app.propr.xyz/dashboard), click **Get Started** on a challenge, and complete the checkout.

Lists available trading challenges. No auth required.

**GET**

```
/challenges
```

List all available challenges and their configuration.

Query params:

| **Param** | **Description** |
| --- | --- |
| challengeId | Filter by challenge ID |
| productId | Filter by product ID |
| currency | Filter by currency |
| exchange | Filter by exchange |
| limit | Results per page (default 20) |
| offset | Pagination offset (default 0) |

Response includes: challenge name, description, exchange (hyperliquid), duration, initial balance, max daily loss %, max drawdown %, leverage limits, phases, rewards, and pricing.

# **Challenge Attempts**

**Auth Required**

Your challenge progress. Your `accountId` (needed for all trading endpoints) is found here.

**GET**

```
/challenge-attempts
```

List your challenge attempts.

**GET**

```
/challenge-attempts/{attemptId}
```

Get specific attempt details.

Query params: `attemptId, challengeId, status (active/passed/failed), limit, offset`

Response includes: status, total profit/loss, win rate, max drawdown, trading days, failure reason, linked accountId, current phase.

Failure reasons:

`max_drawdown_hitmax_daily_loss_hitmin_trades_not_metmin_trading_days_not_metprofit_target_not_met`

# **Funded Accounts**

**Auth Required**

When a challenge passes, a separate **funded account** is provisioned for the trader. Funded accounts have a different lifecycle than challenge attempts. They earn real profit splits paid out periodically, require KYC, and are **not returned by** `GET /challenge-attempts`. List them via `GET /book-account-issuances` and use the returned `accountId` with the same trading endpoints (`/accounts/{accountId}/orders`, etc.).

**GET**

```
/book-account-issuances
```

List your funded (b-book / a-book) accounts.

**GET**

```
/book-account-issuances/{issuanceId}
```

Get details for a single funded account.

Query params: `userId, accountId, status (active/closed/review_pending), closureReason, limit, offset`

### **Account Types**

| **Type** | **Stage** | **Endpoint** | **Notes** |
| --- | --- | --- | --- |
| paper | In challenge | /challenge-attempts | Simulated funds, challenge rules apply |
| b_book | Funded | /book-account-issuances | Internal book, profit split paid out periodically |
| a_book | Funded | /book-account-issuances | Hedged on Hyperliquid, same trader-facing API |

### **Find Your Tradeable accountId**

A bot should check both endpoints: the trader may be in a challenge, funded, or running both in parallel.

```
def find_account_id(client):
    """Return a tradeable accountId: funded first, then challenge."""
    # 1. Funded accounts: these are the real-money accounts after passing.
    r = client.get("/book-account-issuances", params={"status": "active"})
    issuances = r.json().get("data", [])
    if issuances:
        return issuances[0]["accountId"]

    # 2. Active challenge attempts: paper accounts during evaluation.
    r = client.get("/challenge-attempts", params={"status": "active"})
    attempts = r.json().get("data", [])
    if attempts:
        return attempts[0]["accountId"]

    raise Exception(
        "No tradeable account. Purchase a challenge or wait for funding."
    )
```

Copy

### **What's Different on a Funded Account**

| **Behavior** | **Paper (challenge)** | **Funded (b-book / a-book)** |
| --- | --- | --- |
| Source of funds | Simulated balance from challenge | Real capital allocated by Propr |
| Failure rules | Challenge phase rules (profit target, daily loss, drawdown) | Daily loss + max drawdown only. No profit target, no phase progression |
| KYC | Not required | Required before any order. Bot will get rejected otherwise |
| Profit | Tracked but not withdrawable | Profit split paid out to a linked wallet |
| Closure reasons | max_drawdown_hit, max_daily_loss_hit, etc. | max_drawdown_exceeded, max_daily_loss_exceeded, admin_closure, manipulation_detected |
| Account lifetime | Ends when phase passes or fails | Persists until admin / drawdown closes it |

**KYC gate:** orders on a funded account are rejected until the trader has passed KYC. Bots running on a freshly-funded account should expect a 403 / error code response on order creation until the user completes verification at `https://app.propr.xyz/settings`.

**Payouts:** profit on funded accounts is paid out via the payouts pipeline (USDC on-chain). The bot's tradeable balance is not the same as the withdrawable balance. Payouts are processed periodically by Propr and don't go through this API. Treat `balance` as available trading capital, not cash you can withdraw.

# **Orders**

**Auth Required**

All trading endpoints follow the pattern `/accounts/{accountId}/...` and require auth. You must own the account.

**GET**

```
/accounts/{accountId}/orders
```

List all orders on the account.

**POST**

```
/accounts/{accountId}/orders
```

Create order(s).

**POST**

```
/accounts/{accountId}/orders/{orderId}/cancel
```

Cancel an order.

### **Cancel Order Response**

`POST /accounts/{accountId}/orders/{orderId}/cancel`

Returns the cancelled order object on success.

| **Code** | **Meaning** |
| --- | --- |
| 201 | Order successfully cancelled |
| 400 | Order cannot be cancelled (already filled, cancelled, or expired) |
| 401 | Unauthorized - invalid or missing API key |
| 404 | Order not found |

Success response (201):

```
{
  "orderId": "urn:prp-order:2z4EkWgopowT",
  "intentId": "01KJJ0N8CJW89K0Q6SX50KZW27",
  "orderGroupId": null,
  "exchangeOrderId": null,
  "userId": "urn:prp-user:...",
  "accountId": "urn:prp-account:...",
  "positionId": null,
  "exchange": "hyperliquid",
  "productType": "perp",
  "type": "limit",
  "side": "buy",
  "positionSide": "long",
  "timeInForce": "GTC",
  "status": "cancelled",
  "asset": "BTC",
  "base": "BTC",
  "quote": "USDC",
  "quantity": "0.001",
  "price": "50000",
  "reduceOnly": false,
  "closePosition": false,
  "cumulativeQuantity": "0",
  "cumulativeQuote": "0",
  "cumulativeTradingFees": "0",
  "tradingFeeRate": "0.00075",
  "expiresAt": null,
  "filledAt": null,
  "cancelledAt": "2026-02-28T11:38:07.872Z",
  "createdAt": "2026-02-28T11:38:06.733Z",
  "updatedAt": "2026-02-28T11:38:07.868Z"
}
```

Copy

Error response (400) - order already filled or cancelled:

```
{
  "code": 13053,
  "message": "bad_request"
}
```

Copy

**Note:** The cancel endpoint returns `201` on success, not `200`. Bots should treat both `200` and `201` as successful cancellation. A `400` response means the order has already been filled, cancelled, or expired - this is safe to ignore.

### **Create Order Request**

```
{
  "orders": [
    {
      "accountId": "your-account-id",
      "intentId": "unique-ulid-you-generate",
      "exchange": "hyperliquid",
      "type": "limit",
      "side": "buy",
      "positionSide": "long",
      "productType": "perp",
      "timeInForce": "GTC",
      "asset": "BTC",
      "base": "BTC",
      "quote": "USDC",
      "quantity": "0.001",
      "price": "95000",
      "reduceOnly": false,
      "closePosition": false
    }
  ]
}
```

Copy

**Important:** `intentId` must be a unique ULID you generate per order. Same intentId = idempotent (same order won't be placed twice).

### **Create Order Response**

Returns the created order(s) wrapped in a `data` array. Response (201):

```
{
  "data": [
    {
      "orderId": "urn:prp-order:2z4EkWgopowT",
      "intentId": "01KJJ0N8CJW89K0Q6SX50KZW27",
      "orderGroupId": null,
      "exchangeOrderId": null,
      "userId": "urn:prp-user:...",
      "accountId": "urn:prp-account:...",
      "positionId": null,
      "exchange": "hyperliquid",
      "productType": "perp",
      "asset": "BTC",
      "base": "BTC",
      "quote": "USDC",
      "type": "limit",
      "side": "buy",
      "positionSide": "long",
      "timeInForce": "GTC",
      "quantity": "0.001",
      "price": "50000",
      "triggerPrice": null,
      "closePosition": false,
      "cumulativeQuantity": "0",
      "cumulativeQuote": "0",
      "averageFillPrice": null,
      "cumulativeTradingFees": "0",
      "tradingFeeRate": "0.00075",
      "expiresAt": null,
      "filledAt": null,
      "cancelledAt": null,
      "status": "open",
      "reduceOnly": false,
      "createdAt": "2026-02-28T11:38:06.733Z",
      "updatedAt": "2026-02-28T11:38:06.733Z"
    }
  ]
}
```

Copy

**Important:** The response `data` array contains one entry per order submitted. Market orders may already show `status: "filled"` in the response. Use the returned `orderId` to track and cancel orders.

### **Order Response Fields**

| **Field** | **Type** | **Description** |
| --- | --- | --- |
| orderId | string | Unique order identifier (URN format) |
| intentId | string | Your ULID from the request |
| orderGroupId | string | null | Group ID if part of a batch |
| exchangeOrderId | string | null | Exchange-assigned ID |
| positionId | string | null | Linked position (null until filled) |
| status | string | Current order status |
| cumulativeQuantity | string | Total quantity filled so far |
| cumulativeQuote | string | Total quote value filled |
| averageFillPrice | string | null | Weighted average fill price |
| cumulativeTradingFees | string | Total fees charged |
| tradingFeeRate | string | Fee rate applied (e.g., "0.00075" = 0.075%) |
| filledAt | string | null | ISO timestamp when fully filled |
| cancelledAt | string | null | ISO timestamp when cancelled |

### **Order Types**

| **Type** | **Description** | **Required Fields** |
| --- | --- | --- |
| market | Executes immediately at best price | quantity |
| limit | Executes at specified price or better | quantity, price |
| stop_market | Triggers market order at trigger price | quantity, triggerPrice |
| stop_limit | Triggers limit order at trigger price | quantity, price, triggerPrice |
| take_profit_market | Take profit as market order | quantity, triggerPrice |
| take_profit_limit | Take profit as limit order | quantity, price, triggerPrice |

### **Time In Force**

| **Value** | **Description** |
| --- | --- |
| GTC | Good Till Cancel (default) |
| IOC | Immediate or Cancel |
| FOK | Fill or Kill (all or nothing) |
| GTX | Good Till Crossing (post-only / maker) |

### **Order Statuses**

pending → open → partially_filled → filled

pending → rejected

open → cancelled / expired

### **Closing Positions**

There are two fields that control position reduction: `reduceOnly` and `closePosition`.

| **Field** | **Effect** |
| --- | --- |
| reduceOnly: true | Order can only reduce an existing position, never increase it. Rejects if no position exists to reduce. |
| closePosition: true | Closes the entire position. Use with reduceOnly: true for safety. |

To reduce a position by a specific amount:

```
{
  "side": "sell",
  "positionSide": "long",
  "quantity": "0.001",
  "reduceOnly": true,
  "closePosition": false
}
```

Copy

To fully close a position:

```
{
  "side": "sell",
  "positionSide": "long",
  "quantity": "1.003",
  "reduceOnly": true,
  "closePosition": true
}
```

Copy

**Warning:** Selling without `reduceOnly: true` on an existing long position will open a separate short position instead of closing the long. Always set `reduceOnly: true` when you intend to close or reduce.

GET orders query params:

| **Param** | **Description** |
| --- | --- |
| orderId | Filter by order ID |
| tradeId | Filter by trade ID |
| positionId | Filter by position ID |
| base | Filter by base asset |
| quote | Filter by quote asset |
| side | buy or sell |
| positionSide | long or short |
| type | market, limit, stop_market, stop_limit, take_profit_market, or take_profit_limit |
| status | pending, open, partially_filled, filled, cancelled, rejected, or expired (use open for working orders; not active or triggered) |
| limit | Results per page |
| offset | Pagination offset |

**Common mistake:** `status=active` is valid on `/challenge-attempts` and `/book-account-issuances`, but **not** on `/orders`. Use `status=open` (and `pending` for conditional orders). `order.triggered` is a WebSocket event name only — there is no `triggered` order status. Invalid `side`, `positionSide`, `type`, or `status` values return **400**.

# **Positions**

**Auth Required**

**GET**

```
/accounts/{accountId}/positions
```

List positions for the account.

Query params: `positionId, asset, base, quote, positionSide (long/short), status (open/closed/liquidated), limit, offset`

Response fields:

`positionIdassetpositionSidestatusquantityentryPricemarkPriceliquidationPriceunrealizedPnlrealizedPnlmarginUsedleveragemarginModecumulativeFundingcumulativeTradingFeesreturnOnEquity`

### **Position Behavior**

**Position merging:** Multiple orders on the same asset and side merge into a single position. For example, three separate BUY 0.001 BTC orders will result in one position with `quantity: "0.003"` and a weighted average `entryPrice`. The `positionId` remains the same.

**Zero-quantity positions:** When a position is fully closed, it may still appear in the API with `quantity: "0"` and `status: "open"` temporarily. Filter these out by checking `quantity != "0"` when listing active positions.

**Tracking bot exposure:** Because orders merge into existing positions, bots cannot distinguish their own fills from manually placed trades by looking at positions alone. Track your bot's net exposure internally by counting successful order fills rather than reading position quantities.

### **Position Response**

`GET /accounts/{accountId}/positions`

```
{
  "data": [
    {
      "positionId": "urn:prp-position:HSS7U71q3Pjb",
      "userId": "urn:prp-user:...",
      "accountId": "urn:prp-account:...",
      "exchange": "hyperliquid",
      "productType": "perp",
      "status": "open",
      "asset": "BTC",
      "base": "BTC",
      "quote": "USDC",
      "positionSide": "long",
      "leverage": "1",
      "marginMode": "cross",
      "quantity": "1.003",
      "entryPrice": "64039.625524",
      "breakEvenPrice": "64087.942865",
      "markPrice": "64039",
      "liquidationPrice": "33972.404959",
      "unrealizedPnl": "-0.627401",
      "realizedPnl": "0.40657",
      "marginUsed": "64231.117",
      "notionalValue": "64231.117",
      "cumulativeFunding": "0",
      "cumulativeTradingFees": "48.462293",
      "tradingFeeRate": "0.00075",
      "returnOnEquity": "-0.00001",
      "createdAt": "2026-02-28T11:12:00.436Z",
      "updatedAt": "2026-02-28T11:37:20.032Z",
      "closedAt": null
    }
  ]
}
```

Copy

# **Trades**

**Auth Required**

Execution history for your account.

**GET**

```
/accounts/{accountId}/trades
```

List trade executions.

Query params: `tradeId, positionId, orderId, base, quote, side, limit, offset`

Trade types: `open, increase, reduce, close, flip, liquidation`

Liquidity types: `maker, taker`

### **Trade Response**

`GET /accounts/{accountId}/trades`

```
{
  "data": [
    {
      "tradeId": "urn:prp-trade:mFye8tSuvvow",
      "userId": "urn:prp-user:...",
      "accountId": "urn:prp-account:...",
      "orderId": "urn:prp-order:CjRJt6rhCHCT",
      "positionId": "urn:prp-position:HSS7U71q3Pjb",
      "exchangeTradeId": null,
      "transactionHash": null,
      "exchange": "hyperliquid",
      "productType": "perp",
      "type": "reduce",
      "liquidityType": "taker",
      "asset": "BTC",
      "base": "BTC",
      "quote": "USDC",
      "side": "sell",
      "positionSide": "long",
      "quantity": "0.001",
      "price": "64152",
      "quoteQuantity": "64.152",
      "fee": "0.048114",
      "feeAsset": "USDC",
      "feeRate": "0.00075",
      "leverage": "1",
      "marginMode": "cross",
      "realizedPnl": "0.112374476",
      "positionSizeBefore": "1.004",
      "slippage": "0",
      "markPriceAtOrder": "64152",
      "isLiquidation": false,
      "executedAt": "2026-02-28T11:34:03.529Z",
      "createdAt": "2026-02-28T11:34:03.404Z"
    }
  ]
}
```

Copy

| **Field** | **Description** |
| --- | --- |
| type | Trade type: open, increase, reduce, close, flip, liquidation |
| liquidityType | maker (limit order resting on book) or taker (crossing the spread) |
| realizedPnl | Profit/loss realized on this trade (string, USDC) |
| positionSizeBefore | Position quantity before this trade executed |
| slippage | Price slippage from mark price at order time |
| isLiquidation | Whether this trade was a forced liquidation |