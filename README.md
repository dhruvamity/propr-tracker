# Propr Trading Terminal

Read-only personal dashboard for tracking Propr prop firm accounts, breach limits, open positions, and bank cash reconciliation.

## Who is it for?
Traders running evaluation challenges or funded accounts on Propr who need an independent monitor for trailing drawdown limits, daily loss proximity, open positions, and actual cash spent across prop firms (Propr and Breakout).

## What does it do?
- **Account Discovery**: Discovers both challenge attempts (`/challenge-attempts`) and book issuances (`/book-account-issuances`).
- **Risk Monitoring**: Calculates trailing drawdown against high-water marks and daily loss against day-start balance plus isolated margin.
- **Three-Layer Accounting**:
  - Layer 1 (Face Value): USD challenge purchase prices ($218.75 total; $75.00 active).
  - Layer 2 (Actual Cash): Grounded in INR bank debits across Propr (₹21,559.58) and Breakout (₹3,835.25), totaling ₹25,394.83 with ₹0.00 unexplained difference.
  - Layer 3 (Trading Metrics): Realized and unrealized PnL, equity, and fees calculated with Decimal.js.
- **Live Trading View**: Displays open positions and resting orders, filtering out closed zero-quantity entries.
- **Truthful Failure State**: Fails closed with explicit error indicators if upstream APIs are unreachable.

## Architecture

The repository is structured as a monorepo:

- `apps/terminal`: Next.js 16 App Router interface.
- `services/propr-sync`: Standalone worker for WebSocket events and periodic REST resync.
- `packages/calculations`: Mathematical functions for PnL, drawdown, daily loss, and cash aggregation using Decimal.js.
- `packages/data-model`: Zod schemas and TypeScript definitions.
- `packages/finance`: Cash ledger models, baseline transaction data, and reconciliation logic.
- `packages/propr-client`: Server-side HTTP client for the Propr REST API.

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PROPR_API_KEY` | Propr API authentication key (server-side only) | *(required)* |
| `PROPR_API_URL` | Base URL for Propr REST API | `https://api.propr.xyz/v1` |
| `PROPR_WS_URL` | WebSocket URL for live updates | `wss://api.propr.xyz/ws` |
| `USD_TO_INR` | Reference FX rate for USD face value estimates | `84.5` |
| `PAYSAGI_EFFECTIVE_RATE` | Effective INR rate per USD for dynamic Paysagi card debits (forex + GST) | `97.82` |
| `REDIS_URL` | Optional Redis URL for persistent cache in `propr-sync` | *(in-memory fallback)* |

## Running Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your PROPR_API_KEY
```

### 3. Run automated tests
```bash
npm test
```

### 4. Start local development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Production build
```bash
npm run build
```

> **Note on Build-Time Font Fetching:** `apps/terminal` uses `next/font/google` (`Inter` and `JetBrains Mono`). During `npm run build`, Next.js downloads these font files directly from Google Fonts at build time to optimize and self-host them. In restricted offline environments or CI sandboxes without outbound internet access to `fonts.googleapis.com`, `next build` may report a network error. Automated testing (`npm test`), design token verification (`npm run check:palette`), and type checking (`npm run type-check`) execute entirely offline with zero network dependency.

## Intentionally Unsupported
- **Order Placement & Modification**: The terminal does not place orders, cancel orders, or modify stops. It contains zero mutation endpoints.
- **Payout Requests**: Payout withdrawals cannot be initiated from this application.
- **Trading Bots / Automation**: The system is an observational terminal, not an automated execution engine.
