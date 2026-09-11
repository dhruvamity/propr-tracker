### Redesign check

Good progress on most of the last list: CRITICAL/SAFE now tracks actual daily-loss risk instead of a flat badge, daily loss has its own slider next to drawdown, Overview and Live Risk agree on ordering now (Starter first on both), every figure has a currency label, the Expense Ledger has an account-ID column, and "Active Face" became "Entry Fees." Failed accounts are collapsed by default instead of crowding the main table.

Two new things worth a look:

- Overview's Capital Ledger card says "0 Failed," and the "Archived / Breached Accounts" header also says "(0)" — but the toggle right next to it says "Show 6 archived accounts (2 daily loss, 4 drawdown breaches)." Three places, two different counts for what should be one number.
- "static DD" dropped its old "7/5 days" format for a bare number ("5 days" for Starter, "4 days" for Explorer). The old format told you current day vs. the 5-day minimum; the new one doesn't say which this is anymore.

### Terminal vs PROPR: Explorer 1-Step Turbo

I can only check Explorer directly, since that's the only account you shared PROPR data for.

| Metric | Terminal | PROPR (source of truth) | Status |
|---|---|---|---|
| Equity | $10,173.67 | $10,173.67 | Match |
| Drawdown floor | $9,700.00 | $9,700.00 | Match |
| Drawdown used | 0.00% / 3% | 0.00% / 3% | Match |
| Daily loss used | $74.13 | 0.72% (of $10,247.80 snapshot) | Match |
| Daily loss budget | $307.43 | 3% (of $10,247.80 snapshot) | Match |
| Daily floor | $9,940.37 | $10,247.80 - $307.43 | Match |
| Daily room left | $233.31 | $307.43 - $74.13 = $233.30 | Rounding ($0.01) |
| Profit target | 1.74% / 9% | 2.00% / 9% | Mismatch |
| Account ID | J9wNi8oj (#i8oj) | #3XGK | Mismatch |
| Trades recorded | 82 (trajectory: 60) | 21, all-time (11W/10L) | Mismatch |
| Worst trade | -$59.71 | -$68 | Mismatch |

**Trades, the one to chase first.** PROPR's Performance tab, set to All Time, shows 21 trades for this account. The terminal shows 82 "trades recorded" and describes the trajectory as "60 trades," and its worst-trade figure doesn't match PROPR's either. Since the terminal's count is higher than PROPR's all-time total rather than a subset of it, it's probably counting something more granular, like ticks or partial fills, and labeling it as trades. Whatever it is, the trajectory sparkline and trade counts on both account cards are built on it.

**Account ID.** The terminal calls this account J9wNi8oj (#i8oj). PROPR calls the same account #3XGK, confirmed by equity matching to the cent. Probably just an internal reference rather than a lookup error, but worth checking that Starter's terminal ID (4D8XWuQ3 / #WuQ3) also maps cleanly to whatever PROPR calls it, since that's the account where getting the mapping right matters more.

**Profit target.** Terminal says 1.74%, PROPR's gauge says 2.00%. The terminal's number is exactly what you get from PROPR's own Lifetime P&L (+$173.67) over the $10,000 starting balance, so it lines up with PROPR's other figures. I can't find a clean way to get to 2.00% from anything else on the PROPR page — closest is the $10,247.80 intraday snapshot, which gives 2.48%. The equity chart shows a peak above $10,240 a couple of days back, so my guess is PROPR's gauge hasn't refreshed since then. Flagging it since it's a real mismatch either way, but this reads more like a stale widget on PROPR's side than a terminal bug.

Everything else, equity, drawdown, and the daily-loss chain, reconciles exactly once you know the daily budget is 3% of the day's opening snapshot, not 3% of the $10,000 starting balance. Worth a tooltip somewhere, since $307.43 looks arbitrary until you know where it comes from.

If you can pull Starter's PROPR page, run the same check there before trusting the CRITICAL numbers — that's the account closest to breaching, so it's the one where a trade-count or ID bug would matter most.