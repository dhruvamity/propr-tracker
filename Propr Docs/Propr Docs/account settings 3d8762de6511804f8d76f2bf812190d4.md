# account settings

# **Margin Configuration**

**Auth Required**

**GET**

```
/accounts/{accountId}/margin-config/{asset}
```

Get margin config for a specific asset.

**PUT**

```
/accounts/{accountId}/margin-config/{configId}
```

Update margin configuration.

### **Update Request**

```
{
  "exchange": "hyperliquid",
  "asset": "BTC",
  "marginMode": "cross",
  "leverage": 10
}
```

Copy

Margin modes: `cross` (uses entire account balance) or `isolated` (per-position margin).

### **Margin Config Response**

`GET /accounts/{accountId}/margin-config/{asset}`

```
{
  "configId": "urn:prp-margin-config:Yf1LZ9jMxm7R",
  "accountId": "urn:prp-account:...",
  "exchange": "hyperliquid",
  "asset": "BTC",
  "marginMode": "cross",
  "leverage": "4",
  "createdAt": "2026-02-28T03:39:24.693Z",
  "updatedAt": "2026-02-28T03:39:44.291Z"
}
```

Copy

**Note:** The `configId` from this response is required when calling `PUT /accounts/{accountId}/margin-config/{configId}` to update leverage or margin mode.

### **Available Assets**

The full Hyperliquid asset universe is supported, including native perps and HIP-3 assets (stocks and commodities). The asset format differs by type:

#### **Crypto Perps**

Use the token ticker directly as the asset name.

| **Asset** | **Pair** | **Min Quantity** |
| --- | --- | --- |
| BTC | BTC/USDC | 0.001 |
| ETH | ETH/USDC | 0.01 |
| SOL | SOL/USDC | 0.1 |
| DOGE | DOGE/USDC | 1 |
| XRP | XRP/USDC | 1 |
| AVAX | AVAX/USDC | 0.1 |
| LINK | LINK/USDC | 0.1 |

#### **HIP-3 Assets (Stocks & Commodities)**

HIP-3 assets use the `xyz:SYMBOL` format. You must include the `xyz:` prefix.

| **Asset** | **Type** | **Format** |
| --- | --- | --- |
| Apple | Stock | xyz:AAPL |
| Tesla | Stock | xyz:TSLA |
| Nvidia | Stock | xyz:NVDA |
| Gold | Commodity | xyz:GOLD |
| Silver | Commodity | xyz:SILVER |
| Oil (Crude) | Commodity | xyz:CL |

**Common mistake:** Using `AAPL` instead of `xyz:AAPL` will return a `404 exchange_asset_not_found` error. Always use the `xyz:` prefix for HIP-3 assets.

Use `GET /accounts/{accountId}/margin-config/{asset}` to check if an asset is available - a `200` response confirms the asset is tradeable.

# **Leverage Limits**

**Public**

Before setting leverage on a margin config, query the effective leverage limits to know the maximum allowed per asset.

**GET**

```
/leverage-limits/effective
```

Get the effective max leverage for all assets. No authentication required.

### **Response**

```
{
  "defaultMax": 2,
  "overrides": {
    "BTC": 5,
    "ETH": 5
  }
}
```

Copy

**How to use:** For any asset, check if it exists in `overrides`. If it does, use that value as the max leverage. Otherwise, fall back to `defaultMax`.

**Current limits:** BTC and ETH support up to **5x** leverage. All other assets default to **2x**.

### **Example (Python)**

```
limits = client.get("/leverage-limits/effective")

def max_leverage(asset: str) -> int:
    return limits["overrides"].get(asset, limits["defaultMax"])

# BTC -> 5x, ETH -> 5x, SOL -> 2x (default)
```

Copy

**Note:** Setting leverage above the allowed max for an asset will be rejected by the server. Always check the effective limits before updating margin config.

# **Trading Fees**

All orders are subject to trading fees based on liquidity type:

| **Liquidity** | **Fee Rate** | **Description** |
| --- | --- | --- |
| Taker | 0.045% | Market orders and limit orders that cross the spread |
| Maker | 0.015% | Limit orders that rest on the book (may vary) |

Fees are deducted from your account balance in USDC and tracked per-order in `cumulativeTradingFees` and per-trade in `fee`. The `tradingFeeRate` field on orders and trades shows the rate applied.

**Note:** The `breakEvenPrice` on positions accounts for fees - it differs from `entryPrice` because it includes the cost to enter and exit the position at the current fee rate.

# **Request Payout**

**Coming Soon**

⚡

**Coming Soon** -Payout request functionality is currently under development. Soon you'll be able to request withdrawals directly through the API.

This endpoint will allow funded traders to request payouts from their funded accounts. Stay tuned for updates!