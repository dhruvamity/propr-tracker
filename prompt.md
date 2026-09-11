# Terminal UI/UX Refinements

## 1. Bump contrast on secondary card text
In `apps/terminal/src/app/page.tsx` and `finance/page.tsx`, change subtext beneath the main totals from `text-slate-600` to `text-slate-400` so secondary numbers can actually be read.

## 2. Right-align monetary columns in tables
In `finance/page.tsx` and `accounts/page.tsx`:
- Left-align identity columns: Account ID, Stage, Date, and Firm.
- Right-align value columns: Starting balance, current balance, and fiat spend.
- Center status badges: BANK VERIFIED, EVALUATION, and FAILED.

## 3. Truncate the bank reference strings
In the Finance ledger, truncate reference strings (e.g. `PRCR/Paysogi_propr.xyz/Bucharest/24-08-2026-1`) to `PRCR/.../24-08-2026` inside a small monospace badge with a click-to-copy tooltip.

## 4. Show dollar buffers in the Live Risk cards
In `apps/terminal/src/app/live/page.tsx`, add three explicit dollar figures to each card:
- Current equity floor (e.g., Breach Floor: $9,500.00)
- Remaining drawdown cash buffer (e.g., Drawdown Buffer: $500.00)
- Remaining daily loss allowance for the current trading day

## 5. Eliminate the empty lower viewport on Live and System tabs
- In the Live tab: Use the space below the active cards to show an active tick feed, recent fills, or an account limits reference sheet.
- In the System tab: Display the raw WebSocket event stream or connection log in a terminal output pane beneath the telemetry card.
