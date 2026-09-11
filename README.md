# Propr Trading Terminal

A production-grade, read-only personal trading terminal for **Propr** prop firm accounts, built with Next.js 16, Tailwind CSS, TypeScript, and Decimal.js.

## Features
- **Overview Dashboard**: Executive financial metrics (Total Invested, Active Capital, Payouts Withdrawn, Net Cash PnL), account status distribution, active evaluation risk meters.
- **Real-Time Integration**: REST synchronizer and persistent WebSocket worker handling 15 event types (`mark.updated`, `account.updated`, `position.*`, `order.*`, `trade.*`).
- **Precision Financial Math**: Strictly uses Decimal.js (no floating point errors) for uPnL, ROE, drawdown, and daily loss tracking.
- **Clean Lifecycle Tracking**: Distinguishes between evaluation, passed, funded (A-Book/B-Book), breached, and closed states.
- **Read-Only & Secure**: Zero mutation endpoints, with credentials strictly maintained on the server.

## Architecture
- `apps/terminal`: Next.js 16 App Router personal terminal UI.
- `services/propr-sync`: Standalone persistent WebSocket & REST reconciliation worker.
- `packages/data-model`: Core types, Zod schemas, and DecimalString wrappers.
- `packages/calculations`: Pure calculation functions for PnL, risk, equity, and finance.
- `packages/propr-client`: Typed Propr API client.
- `packages/finance`: Finance ledger models and CSV ingestion.

## Getting Started

### 1. Environment Setup
Copy `.env.example` to `.env.local` inside `apps/terminal`:
```bash
cp .env.example apps/terminal/.env.local
```
Configure your credentials:
```env
PROPR_API_KEY=pk_live_your_api_key
PROPR_API_URL=https://api.propr.xyz/v1
USD_TO_INR=84.5
```

### 2. Development
Run the terminal app locally:
```bash
cd apps/terminal
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the terminal.

### 3. Vercel Deployment
- **Root Directory**: Select or configure `apps/terminal` (or keep root with build script `cd apps/terminal && npm run build`).
- **Build Command**: `next build` (inside `apps/terminal`) or `cd apps/terminal && npm run build`.
- **Environment Variables**: Add `PROPR_API_KEY`, `PROPR_API_URL`, and `USD_TO_INR` in the Vercel project settings.
