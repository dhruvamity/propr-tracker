# integrations

# **WebSocket (Real-Time)**

**Auth Required**

### **Connection**

```
wss://api.propr.xyz/ws
# Connect with header: X-API-Key: <your_api_key>
```

Copy

On success you'll receive: `{ "type": "connected", "data": { "userId": "..." } }`

Heartbeat: Server pings every 20 seconds. Dead connections are terminated automatically.

### **Quick Setup**

Install dependencies and configure your environment:

```
pip install requests python-ulid websockets python-dotenv
```

Copy

Create a `.env` file:

```
PROPR_API_KEY=pk_live_your_api_key_here
# PROPR_API_URL=https://api.propr.xyz/v1
# PROPR_WS_URL=wss://api.propr.xyz/ws
```

Copy

### **Events**

All events follow this format:

```
{
  "type": "order.filled",
  "userId": "...",
  "data": { ... },
  "timestamp": 1709136000000
}
```

Copy

| **Event** | **Description** |
| --- | --- |
| mark.updated | Live per-asset mark prices (batched, ~4Hz). Use these to derive unrealized PnL, equity and liquidation prices in real time. |
| account.updated | Balance/margin changed |
| order.created | New order placed |
| order.updated | Order state changed |
| order.cancelled | Order cancelled |
| order.triggered | Conditional order fired (WS only, not a REST status filter) |
| order.filled | Order fully filled |
| order.partially_filled | Order partially filled |
| position.opened | New position opened |
| position.updated | Position metrics changed |
| position.closed | Position closed |
| position.liquidated | Position liquidated |
| position.take_profit.hit | Take profit reached |
| position.stop_loss.hit | Stop loss triggered |
| trade.created | New trade execution |

### **Deriving Live Values (Client-Side)**

Everything that changes with price, like unrealized PnL, equity, liquidation price and drawdown, you calculate on your side from the `mark.updated` price feed and the latest `account.updated` / `position` events you've received.

`mark.updated` is global (no `userId`) and carries every asset that moved in one message:

```
{
  "type": "mark.updated",
  "data": {
    "marks": { "hyperliquid": { "BTC": "94210.5", "ETH": "3180.22" } },
    "timestamp": 1709136000000
  },
  "timestamp": 1709136000000
}
```

Copy

The functions below are the exact ones our own UI uses to render live values. Pick your language:

**TypeScriptPython**

**For each open position**, recalculate on every mark. `quantity` is always positive, and `positionSide` gives the direction:

```
const MMR = 0.005 // maintenance-margin rate
const sign = p.positionSide === 'long' ? 1 : -1
const mark = marks[p.exchange][p.asset]
const qty = Math.abs(Number(p.quantity))

const unrealizedPnl = sign * qty * (mark - Number(p.entryPrice))
const notionalValue = qty * mark
const roe = p.marginUsed ? unrealizedPnl / Number(p.marginUsed) : 0
const maintMargin = notionalValue * MMR

// ISOLATED positions: liq price is fixed at entry, does NOT move with the mark
const inv = 1 / Number(p.leverage)
const isolatedLiq =
  sign === 1
    ? Number(p.entryPrice) * (1 - inv + MMR)
    : Number(p.entryPrice) * (1 + inv - MMR)
```

Copy

**Then roll the positions up to the account.** Sum the per-position values, then add your cached balance and margins:

```
const totalUpnl = positions.reduce((s, pos) => s + pos.unrealizedPnl, 0)
const crossUpnl = positions
  .filter((pos) => pos.marginMode === 'cross')
  .reduce((s, pos) => s + pos.unrealizedPnl, 0)
const totalMM = positions.reduce((s, pos) => s + pos.maintMargin, 0)

const equity = balance + totalUpnl + isolatedPositionMargin
const crossWallet = balance + crossUpnl
// "available to trade": free cross collateral for new orders (ticks with crossUpnl).
// isolatedPositionMargin is already out of balance, so only isolated ORDER margin is subtracted.
const availableBalance = crossWallet - crossPositionMargin - crossOrderMargin - isolatedOrderMargin
const marginRatio = crossWallet <= 0 ? 1 : totalMM / crossWallet // >= 1 -> liquidatable

// CROSS positions: liq price MOVES with the mark (via crossWallet & maintenance margin)
const positionMM = notionalValue * MMR
const otherMM = totalMM - positionMM
const walletExclThis = crossWallet - unrealizedPnl
const crossLiq =
  sign === 1 // long
    ? Math.max(
        (Number(p.entryPrice) * qty + otherMM - walletExclThis) / (qty * (1 - MMR)),
        0,
      )
    : (walletExclThis + Number(p.entryPrice) * qty - otherMM) / (qty * (1 + MMR)) // short
```

Copy

**To show how close an account is to failing.** Challenge and funded accounts have loss limits; these compare current equity against them. Percentages are whole numbers, so `5` means 5%:

```
// drawdownType: 'static' or 'trailing' (highWaterMark tracks peak equity)
const ddAmount = (maxDrawdownPercent / 100) * initialBalance
const ddLimit =
  drawdownType === 'trailing'
    ? Math.min(highWaterMark - ddAmount, initialBalance)
    : initialBalance - ddAmount
// All from GET /accounts/{id}/daily-metrics: startingBalance + startingIsolatedPositionMargin
// (today's opening realized value). Daily-loss base = their sum (no floor); it is both the
// reference the daily loss is measured from and the amount the allowance is a percent of.
const dailyLossBase = startingBalance + startingIsolatedPositionMargin
const dailyLimit = dailyLossBase - (maxDailyLossPercent / 100) * dailyLossBase

const ref = drawdownType === 'trailing' ? highWaterMark : startingBalance
const drawdownUsedPct = (Math.max(ref - equity, 0) / startingBalance) * 100
const dailyLossUsedPct = (Math.max(dailyLossBase - equity, 0) / dailyLossBase) * 100
const profitTargetPct = ((equity - phaseStartingBalance) / phaseStartingBalance) * 100

// the mark at which equity would hit a limit -> the "you fail / liquidate at $X" line
function breachPrice(equityLimit, equity, mark, quantity, side) {
  const buffer = equity - equityLimit
  if (buffer <= 0) return null // buffer already gone
  const offset = buffer / Math.abs(quantity)
  return side === 'long' ? mark - offset : mark + offset
}
```

Copy

### **Values To Cache**

Store these fields from the events and reuse them on every mark. Only the price-dependent values above get recalculated each tick.

| **From** | **Fields to cache** |
| --- | --- |
| position.opened / .updated | entryPrice, quantity, positionSide, leverage, marginMode, marginUsed, exchange, asset |
| account.updated | balance, isolatedPositionMargin, crossPositionMargin, crossOrderMargin, isolatedOrderMargin, highWaterMark |
| challenge / funded account (REST, once) | initialBalance, startingBalance, phaseStartingBalance, drawdownType, maxDrawdownPercent, maxDailyLossPercent |
| GET /accounts/{accountId}/daily-metrics | startingBalance + startingIsolatedPositionMargin (opening realized value; the daily-loss base is their sum) |

### **Putting It Together**

Keep your account and positions from the events, update your marks on `mark.updated`, and recalculate on each tick:

```
const positions = new Map() // positionId -> position (opened / updated / closed)
let account = {} // balance, isolatedPositionMargin, crossPositionMargin, crossOrderMargin, isolatedOrderMargin, highWaterMark (account.updated)
let config = {} // drawdown / daily-loss config (challenge or funded account, once)
const marks = {} // exchange -> asset -> price (mark.updated)

function onEvent(evt) {
  const { type, data = {} } = evt
  if (type === 'mark.updated') {
    for (const [ex, assets] of Object.entries(data.marks))
      marks[ex] = { ...(marks[ex] ?? {}), ...assets }
    recompute() // re-derive on every price tick
  } else if (type === 'position.opened' || type === 'position.updated') {
    positions.set(data.positionId, data)
  } else if (type === 'position.closed') {
    positions.delete(data.positionId)
  } else if (type === 'account.updated') {
    account = { ...account, ...data }
  }
}

function recompute() {
  // For each position in positions.values(), run the per-position + aggregate +
  // challenge-risk functions above, reading marks / account / config.
}
```

Copy

These values match what you see in the Propr app. Propr runs the real liquidation and breach checks on its side, so your local numbers are for display.

### **WebSocket Client Example (Python)**

Full async client with all 15 event handlers and reconnect logic. Save as `ws_example.py` and run with `python3 ws_example.py`:

```
import asyncio, json, os, sys
from datetime import datetime
import websockets
from dotenv import load_dotenv

load_dotenv()

WS_URL = os.getenv("PROPR_WS_URL", "wss://api.propr.xyz/ws")
API_KEY = os.getenv("PROPR_API_KEY")
RECONNECT_DELAY = 5

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"[{ts}] {msg}")

# ── Event Handlers ──
EVENT_HANDLERS = {
    "connected":              lambda d: log(f"Connected: userId: {d.get('userId')}"),
    # Price feed. Recompute your live metrics here (see "Deriving Live Values").
    "mark.updated":           lambda d: log(f"Marks: {d.get('marks')}"),
    "account.updated":        lambda d: log(f"Account updated: balance: {d.get('balance')}"),
    "order.created":          lambda d: log(f"Order CREATED: {d.get('side','?').upper()} "
                                            f"{d.get('quantity')} {d.get('base')} @ {d.get('price','market')}"),
    "order.updated":          lambda d: log(f"Order UPDATED: status={d.get('status')} id={d.get('orderId')}"),
    "order.cancelled":        lambda d: log(f"Order CANCELLED: id={d.get('orderId')}"),
    "order.triggered":        lambda d: log(f"Order TRIGGERED: {d.get('type')} id={d.get('orderId')}"),
    "order.filled":           lambda d: log(f"Order FILLED: {d.get('side','?').upper()} "
                                            f"{d.get('cumulativeQuantity')} {d.get('base')} "
                                            f"@ avg {d.get('averageFillPrice')}"),
    "order.partially_filled": lambda d: log(f"Order PARTIAL: {d.get('cumulativeQuantity')}/"
                                            f"{d.get('quantity')} filled"),
    "position.opened":        lambda d: log(f"Position OPENED: {d.get('positionSide','?').upper()} "
                                            f"{d.get('quantity')} {d.get('base')} @ {d.get('entryPrice')}"),
    "position.updated":       lambda d: log(f"Position UPDATED: mark: {d.get('markPrice')} "
                                            f"uPnL: {d.get('unrealizedPnl')}"),
    "position.closed":        lambda d: log(f"Position CLOSED: PnL: {d.get('realizedPnl')} USDC"),
    "position.liquidated":    lambda d: log(f"LIQUIDATED: {d.get('base')} loss: {d.get('realizedPnl')}"),
    "position.take_profit.hit": lambda d: log(f"TP HIT: PnL: {d.get('realizedPnl')}"),
    "position.stop_loss.hit": lambda d: log(f"SL HIT: PnL: {d.get('realizedPnl')}"),
    "trade.created":          lambda d: log(f"Trade: {d.get('type')} {d.get('side','?').upper()} "
                                            f"{d.get('quantity')} {d.get('base')} @ {d.get('price')}"),
}

async def listen(ws):
    async for raw in ws:
        try:
            msg = json.loads(raw)
        except json.JSONDecodeError:
            continue
        handler = EVENT_HANDLERS.get(msg.get("type"))
        if handler:
            handler(msg.get("data", msg))
        else:
            log(f"Unhandled: {msg.get('type')}")

async def connect_and_listen():
    if not API_KEY:
        sys.exit("Set PROPR_API_KEY in .env")
    while True:
        try:
            async with websockets.connect(
                WS_URL,
                additional_headers={"X-API-Key": API_KEY},
                ping_interval=20, ping_timeout=10
            ) as ws:
                log("Listening for events...")
                await listen(ws)
        except websockets.ConnectionClosed as e:
            log(f"Disconnected: {e}")
        log(f"Reconnecting in {RECONNECT_DELAY}s...")
        await asyncio.sleep(RECONNECT_DELAY)

if __name__ == "__main__":
    asyncio.run(connect_and_listen())
```

Copy

# **OpenAPI Specification**

**Download**

Full OpenAPI 3.0.3 spec with all 14 endpoints, request/response schemas, and field-level documentation. Use it with Swagger UI, code generators, or feed it directly to your AI agent for context.

[**Download openapi.json**](https://www.propr.xyz/openapi.json)

[**Download openapi.json**](https://www.propr.xyz/openapi.json)

Schemas included: Order (32 fields), Position (28 fields), Trade (31 fields), MarginConfig (8 fields), OrderRequest, Error, PaginatedResponse

# **Enums Reference**

| **Category** | **Values** |
| --- | --- |
| Exchange | hyperliquid |
| Product Type | spot, perp |
| Position Side | long, short |
| Order Side | buy, sell |
| Margin Mode | cross, isolated |
| Currency | USDC, USD, EUR |

# **Error Handling**

| **Code** | **Meaning** |
| --- | --- |
| 400 | Bad request / validation error |
| 401 | Unauthorized - invalid or missing API key |
| 403 | Forbidden - insufficient permissions |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |