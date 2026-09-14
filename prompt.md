# Propr Terminal Audit — Round 4 (Visual & Data-Integrity QA)

**Target:** `apps/terminal` in `dhruvamity/propr-tracker`, code checked against `main` HEAD `4f12198`.
**Method — different from rounds 1–3:** those rounds fixed styling/consistency (raw Tailwind colors, font sizes, duplicated markup) via static code scans. This round is a **read of 9 live screenshots of the deployed app** (`terminal-tau-eight.vercel.app`, captured 14 Sep 08:25 IST), cross-checked line-by-line against the current code where possible. It catches a different category of bug entirely — copy that doesn't match its own logic, numbers that don't reconcile, and pages that duplicate each other — none of which a grep for color classes would ever find.
**Confirmed still holding from round 3, not re-litigated here:** raw palette color count is 726 (was 1,204, real -39.7% reduction), and `scripts/check-raw-palette.mjs` / `npm run check:palette` genuinely exists and is wired up — spot-checked just now, not re-trusted from the commit message.
**On the original "font family/size" complaint:** the mechanical causes (sub-11px text, failing contrast, uppercase-mono headings) are confirmed fixed across rounds 1–3 and nothing in these screenshots contradicts that. If text still *feels* hard to read, the likely remaining cause is density, not mechanics — see the last item below.

Two findings below are confirmed against the actual code with exact line numbers. The rest are read directly from the screenshots with reasoning shown — re-verify each against a live page before fixing, since whoever executes this won't have the screenshots in front of them.

---

## P0 — Confirmed in code: Pre-Flight Gate banner claims 5 criteria, lists and checks 4

`components/rules/rules-view.tsx:427`:
```
"All 5 trading criteria satisfied: Market hours open, 0 open positions, 45m cooldown satisfied, daily circuit breaker safe."
```
That's four items. The `preFlightChecks` array two lines above it (`rules-view.tsx:312–350`) has exactly four entries (`hours`, `parallel`, `cooldown`, `circuit`), and the code's own comment at line 500 calls it *"4 Pre-Flight Gate Cards."* Every source in the file agrees it's four except this one hardcoded string. Visible in the screenshot exactly as written above.

**Fix:** change to "All 4 trading criteria," or if a fifth check was actually intended and dropped somewhere, that's a bigger conversation — but the array, the comment, and the rendered card count all currently agree on four, so "4" is very likely just correct.

## P1 — Confirmed in code, but a UX call rather than a bug: "Rule 7" appears twice

Same four cards: two of them (`id: "parallel"` → *Zero Parallel Trades*, and `id: "cooldown"` → *45-Minute Trade Gap*) both carry `ruleNum: 7` (`rules-view.tsx:324, 334`). This is deliberate, not a typo — both really are sub-conditions of "7. Parallel Trading & Discipline Protocol" further down the same page. But shown as two identical "Rule 7" tags side-by-side in a 4-card strip, it reads as a numbering error on sight (it did to me, until I checked the array). **Fix:** disambiguate the two — "Rule 7a"/"7b", a shared bracket around both cards, or a sub-label — so a glance doesn't misread it as a bug that isn't one.

---

## P1 — Overview and Risk/Monitor render the same account cards twice

Screenshots of `/` (Overview) and `/risk` or wherever Monitor lives show the same 5 account cards, in the same order, with the same hero metric, same "X% used" bar, and the same four-value grid (Equity / Threshold / Daily-or-Drawdown-room / Target progress) — pixel-for-pixel the same content block, just under a different page heading. Overview adds a cash summary and the Pre-Flight banner above it; Monitor adds an "Open positions" strip below it — but the part of each page that takes up the most space is identical. The Overview page's "View risk →" link implies there's more detail one click away, but the cards a user lands on are the same ones they just saw.

**Worth deciding, not just fixing:** does Overview need the *full* card (all four grid values, full-size hero) as a "glance" view, or would a condensed version (health dot + name + hero number only, no grid) serve Overview's actual job better, reserving the full detail for Monitor? Either is defensible — right now neither page is clearly the "summary" and neither is clearly the "detail," they're just the same view rendered twice.

## P1 — Numbers that don't reconcile without an explanation the UI doesn't give

**Analytics → Discipline Forensics & Rule Audit:** the four "Breaches Tagged" chips — Weekend Trade (-$157.13), Cooldown Breach (-$68.21), Over-Risk (-$361.52), Unauthorized Asset (-$113.75) — sum to **-$700.61**. The headline "Cost of Violations" reads **-$429.73**. These don't match, and nothing on the card explains why. Most likely explanation: a single violating trade can carry more than one tag (14 tag-instances are shown across only 9 violating trades — `13 of 22 adhered` implies 9 didn't — so at least some trades are double- or triple-tagged), and "Cost of Violations" counts each trade's loss once while the four chips count it once *per tag*. If that's right, it's not a bug, but it needs a footnote ("tags overlap; totals won't sum") or the chips need to reflect deduplicated, non-overlapping amounts — as shown, it reads as arithmetic that's simply wrong.

**Accounts page, "Sort: Risk (Breach Proximity)":** the row order (Failed, Failed, Failed, Failed, Failed, Evaluation, Evaluation, Evaluation, **Failed**, Evaluation, Evaluation) doesn't track the visible Failure/Target percentage column in any obvious ascending or descending way, and a `Failed` account (#5gMw, already breached) is sandwiched in the middle of still-open Evaluation accounts rather than grouped with the other five Failed rows. A user scanning top-to-bottom for "which active account is closest to trouble" has to skip over already-decided accounts interspersed unpredictably. Worth checking whether the sort key is doing something more complicated than the column header suggests, or whether `Failed` accounts should sort as a distinct group (start or end) rather than by whatever proximity metric no longer applies to them.

## P2 — Verify against a fresh deploy before touching code: risk-card hero label

The Monitor screenshot shows one card (#3XGK) with hero label **"Daily loss room" = $300.38**, and, in the small grid on the same card, a *second* row also labeled **"Daily loss room" = $312.81** — same label, two different numbers, on one card. I traced this in `components/risk-card.tsx`: the current code (`isDailyConstrained` ternary, lines ~46–48 and ~150–156) deliberately swaps *both* the label and the value together between the hero slot and the grid slot, specifically to avoid this exact duplication — and it reads as logically correct. Since both slots read the same boolean, this shouldn't be reproducible with the code currently in `main`. Most likely explanation: the deployed site was a build behind the repo when the screenshot was taken. **Before changing anything here, redeploy current `main` and take a fresh screenshot of that card** — if the duplicate is gone, no fix needed; if it persists, the bug is in why `isDailyConstrained` or its dependent values differ between the two render sites despite reading the same variable.

## P2 — Currency symbols switch without explanation in one section

Finance → Capital Recovery & Payout Milestones shows three cards in a row: "Full Breakeven Need — **$491 USD**," then "10K Turbo Payout — **₹54,080.00**" and "5K Turbo Payout — **₹27,040.00**." The underlying dual-currency reality is real (challenges are paid in USD, your bank debits are in INR) and not itself a bug — but the Ledger table lower on the same page already handles this cleanly with parallel "USD Cost" / "Bank Debit (INR)" columns. The Milestones row above it doesn't use that pattern, just switches symbols card to card, so a fast skim ($491 next to ₹54,080 next to ₹27,040) can misread magnitude before clocking the currency changed. Apply the ledger table's convention here too — both figures, or at least a small currency tag, on every card.

## P2 — Minor, low-confidence: repeated adjacent date labels on the equity chart

The Analytics equity chart's x-axis appeared to show the same date immediately next to itself in at least one place (e.g., `9/12/26` twice in a row). Possibly just how the charting library rounds ticks near the end of a short date range — low priority, worth a glance at the tick-generation call if you're already in that file for something else.

---

## On readability specifically

Nothing in these screenshots contradicts rounds 1–3's fixes — text is legible, contrast reads fine, no stray tiny or monospace-uppercase labels jumped out. If the app still feels hard to read day-to-day, the more likely remaining cause is **density**: each account card packs a name, tag, stage, status dot, hero number, usage bar, and a four-cell label/value grid into one card, repeated up to 11 times across Overview/Monitor/Accounts. That's an information-architecture question (how much per card, at what size) rather than a font-mechanics one — worth deciding deliberately rather than auditing again for the same font-size/contrast issues, which are done.

---

## How to verify before fixing

Everything in this document except the two P0/P1 rules-view.tsx items was read from screenshots, not grepped — confirm each against a live page first:

```bash
npm run dev
# then open, and compare against the descriptions above:
#   /            (Overview)      — vs whatever route Monitor is on
#   /rules                        — Pre-Flight Gate banner + the 4 cards
#   /analytics                    — Discipline Forensics chip math
#   /accounts                     — sort order
#   /finance                      — Capital Recovery cards
```

```bash
# confirm the two code-level findings still stand
grep -n "All 5 trading criteria" apps/terminal/src/components/rules/rules-view.tsx
grep -n "ruleNum" apps/terminal/src/components/rules/rules-view.tsx
```

## Acceptance criteria (round 4)

- [x] Pre-Flight Gate banner text matches the actual number of checks.
- [x] The two "Rule 7" cards are visually distinguishable from each other, or merged into one card that lists both conditions.
- [x] A decision is made (and implemented) on whether Overview shows the full account-card grid or a condensed version distinct from Monitor.
- [x] Cost of Violations either reconciles with the sum of its own breakdown chips, or the chips are labeled to make clear they can overlap.
- [x] Accounts page sort order visibly tracks its own label, or Failed accounts are grouped separately from it.
- [x] Risk-card hero-label duplication confirmed absent on a fresh deploy (or fixed, if it turns out to be real).
- [x] Finance's Milestones cards show currency as unambiguously as the Ledger table below them already does.

## Governing instruction

> A number or a label is a claim about the data behind it — when two claims about the same thing disagree (5 vs. 4 checks, two costs that don't sum, two "Daily loss room" values on one card), that disagreement is the bug, whether or not either individual number is "wrong" in isolation. Fix the disagreement, not just whichever side looks more wrong at a glance.