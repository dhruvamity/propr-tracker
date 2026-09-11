# The Rulebook

Twelve rules. Six are hard limits that end the session or the trade automatically.
Six are process rules that shape how a trade is chosen and sized.

Each rule states the evidence it came from, so you can argue with it on the merits
rather than on how you feel that morning.

---

## Part 1 — Hard limits (automatic, no judgement involved)

### H1 · Two positions per UTC day. Maximum.

No exceptions for "great setup". No exceptions for "I'm up". The cap is on positions
opened, not on positions closed.

> **Evidence.** 63 positions in 15 days across five accounts is `$353,196` of turnover
> on `$5,000` accounts — 70x the account. On 24 August you opened 16 positions,
> captured `+$71.02` of favourable movement and lost `$80.86` net after `$85.95` in fees.

### H2 · Stop for the day at two losses, or at 3x your per-trade risk in closed loss.

> **Evidence.** The report's own counterfactual: stopping after the second losing
> position each day turns `-$596.78` into `-$334.09`. Adding a two-per-day cap takes it
> to `-$259.46`. Both are the largest single improvements available in the dataset.

### H3 · Hard notional cap, never exceeded, regardless of stop distance.

See `05-position-sizing.md` for the number by plan. If the correct size at your risk
amount exceeds the cap, the trade is skipped — you do not take a smaller-risk version
of a trade that wanted to be huge.

> **Evidence.** Peak implied margin per account: `$4,824` to `$5,064` on `$5,000`
> accounts. You were routinely deploying the entire account as margin.

### H4 · The stop order is placed in the same action as the entry order.

Not after the fill. Not as a mental level. If the platform will not accept both, do
not take the trade.

> **Evidence.** Limits are equity-based — floating P&L counts. Your worst position
> floated to `-$215.58` on a `$150` allowance before you closed it at `-$146.43`.

### H5 · Never widen a stop. Never add to a loser. Never remove a stop.

A stop that has been moved once is a strategy that has no stop.

### H6 · Two gate violations in a rolling week ends the week.

> **Evidence.** Five accounts died in fifteen days, each replacement opened 19 to 46
> minutes after the last one stopped. There was no circuit breaker. This is it.

---

## Part 2 — Process rules

### P1 · Resting limit orders only. Both sides.

If the entry requires crossing the spread, skip it.

| | Round-trip cost | Your 63 trades would have cost |
|---|---:|---:|
| Taker `0.045%` x2 | `0.090%` | `$280.80` (what happened) |
| Maker `0.015%` x2 | `0.030%` | `$105.96` |

Saving: `$175`. Certain, immediate, requires no improvement in judgement.

### P2 · Size from the drawdown floor, not from margin.

```
risk per trade  =  5% of your total drawdown allowance
notional        =  risk / stop distance %
```

At a `1.0%` stop this puts notional at 100x your risk amount. The `1.0%` stop is
chosen deliberately: your median adverse excursion was `0.367%`, so `1.0%` sits well
outside normal noise and will not be taken out by chop.

### P3 · The 4h trend picks the side. You do not.

`EMA20 > EMA50` on the 4h means longs only, for that whole session. Reversed means
shorts only.

> **Evidence.** Flipping every one of your directional calls would have lost `$385`
> less than what actually happened. Your side selection is measurably worse than a coin
> flip, so it gets removed from the process.
>
> **Honest caveat:** with-trend versus against-trend was a statistical wash in your data
> (`-$299.82` vs `-$296.95`). This rule is not a proven edge. It deletes an input that
> was measured to be actively harmful, which is worth doing on its own terms.

### P4 · Minimum 1:3 reward-to-risk. Skip anything where the next 1h level is closer.

| Reward:risk | Break-even win rate (at maker fees) |
|---|---:|
| 1:2 | `34.3%` |
| **1:3** | **`25.8%`** |
| 1:4 | `20.6%` |

Your observed win rate was `22.2%`, 95% confidence interval `13.7%` to `33.9%`.
At 1:2 you need a win rate above the top of that interval. At 1:3 the observed rate is
statistically indistinguishable from break-even, which is the first ratio that gives
the strategy a chance to work.

### P5 · Confirmed structure only. A partial recovery is not a signal.

1h higher low printed and closed, 15m close through the opposing swing, entry on the
retest. All three, in that order.

> **Evidence.** 40 of 49 losing positions were up more than `0.10%` at some point;
> 24 were up more than `0.30%`. Losers' median best case was `+0.284%` against a median
> realised `-0.132%`. The entries were live but never safe — they were taken before
> confirmation.

### P6 · Log the thesis before the fill, the outcome after.

Thesis, level, invalidation, target, and the specific 1h structure. Then outcome, MAE,
MFE and gate compliance. `propr-trade-journal.xlsx` has the columns.

---

## Part 3 — The review cadence

**Every 10 trades**, check four numbers and nothing else:

| Metric | Target | Yours in the audited sample |
|---|---:|---:|
| Gate compliance rate | `100%` | not tracked |
| Win rate | above `25.8%` | `22.2%` |
| Average R on winners | at least `2.5` | `+0.60%` vs `-0.132%` median |
| Fees as % of gross profit | under `10%` | `89%` of gross loss |

If gate compliance is below 100%, fix that before looking at anything else. The other
three numbers mean nothing while the process is being broken.

**Every 30 trades**, decide: continue, adjust, or stop. See `01-account-choice.md` for
why 30 is a screen and not proof.

---

## Part 4 — Propr's own rules you must not trip

Verified against Propr's published rulebook, August 2026.

- Both the daily loss limit and the maximum drawdown are **equity-based** — floating
  P&L on open positions counts, so a momentary touch breaches the account.
- Limits reset at **00:00 UTC**, and the daily dollar limit is a percentage of your
  **start-of-day balance**, so it shrinks while you are in drawdown.
- **Hedging the same instrument across two Propr accounts is prohibited**, as is
  hedging against an external exchange. Penalty is termination without payout.
- Also prohibited: account sharing, third-party trade coordination, high-frequency
  evaluation cycling, latency arbitrage, wash trading.
- There is **no time limit, no minimum trading days, no consistency rule and no profit
  cap**. Nothing in this rulebook costs you anything except patience.
- Leverage caps: BTC/ETH/SOL `10x`, other crypto `2x`. You were using `1x` to `5x`.
- Payouts: `80%` to you, `$20` minimum, on-chain USDC, processed within 24 hours,
  full sweep with the balance resetting to the starting amount.
