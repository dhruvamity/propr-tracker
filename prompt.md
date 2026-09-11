

For the terminal itself, roughly in order of impact:

### Daily loss is the real killer, and it's the one metric without a visual

Look at your own Accounts table: two of the four failed accounts shown died to "max daily loss exceeded," not drawdown. That's half your visible failure history.

Right now Starter (4D8XWuQ3) has burned 86% of its daily loss budget — $133.97 of $156.37 — leaving $22.40 of room. That's one bad trade from tripping the daily limit and failing the account. But it's tagged SAFE in green, same as Explorer, which has $233.31 of daily room. Drawdown gets a slider with a visible handle; daily loss gets two plain numbers in the corner of the card.

Give daily loss the same slider treatment, and make SAFE mean something graduated instead of a flat badge that stays green until the account fails. A WATCH or CRITICAL state under some threshold, say 25% room left, would tell you something a green tag currently doesn't.

### The same numbers wearing three different names

- Total Cash Spent (Overview) = Total Cash Outflow (Finance) = ₹25,394.83
- Capital at Risk (Overview) = Active Cash At Risk (Finance) = ₹7,336.19
- Net Outflow (Overview) = Net Cash Position (Finance) = -₹25,394.83

The breakdown underneath is identical too — "Propr: ₹21,559.58 / Breakout: ₹3,835.25" appears verbatim on both pages. On Overview alone, -₹25,394.83 shows up twice on the same screen: once as the Net Outflow headline, again as "Net: -₹25,394.83" right below it.

None of this is wrong. With Payouts at ₹0 today, Net Outflow will always equal negative Total Cash Spent until that changes. But it reads like three separate facts when it's one number wearing different labels. One ledger source, with Finance as the detail view and a one-line summary plus link on Overview, would mean renaming a figure doesn't require updating it twice.

### "#1" means something different on each page

Overview lists Explorer first, Starter second, which lines up with starting balance ($10k vs $5k). Live Risk lists Starter first, Explorer second, because it explicitly sorts by remaining buffer to breach floor, and Starter's buffer is smaller. Both orders make sense on their own page, but the numbered badge reads like a consistent ranking, and it isn't. Either sort both pages by risk, the more useful axis for a risk monitor, or drop the "#1/#2" numbering where it doesn't mean rank.

### Two currencies, no labels

Overview and Finance total everything in ₹. The account cards underneath — equity, floor, daily loss, buffer — are entirely in $. Both symbols are single characters in the same dark, condensed font, and the numbers land close enough in magnitude (₹25,394 next to $10,173) that a fast skim doesn't reliably separate them. Spelling out INR/USD near the biggest figures, or adding a base-currency toggle, would remove a source of misreading that matters more here than on most dashboards.

### Six failed accounts crowd out the two that matter

"All Accounts (8)" is one flat table with no grouping between the 2 active and 6 failed/archived rows. The active accounts are already surfaced as cards above the table, so seeing them again at the top of the table, ahead of the failed rows, adds little. Collapsing the failed accounts by default would free up room for a small trend line per active account, so you can tell whether that $22.40 of daily room disappeared gradually or in one trade.

### Smaller things

- The Expense Ledger has no account-ID column. Three separate $18.75 charges for "Starter 1-Step Turbo" land on the same day, and with at least four accounts sharing that exact name in your Accounts table, there's no way to tell which charge funded which account.
- "Active Face: $75.00" on Finance is undefined, and its relationship to the ₹7,336.19 figure above it isn't obvious.
- Invoice refs are truncated to "PRCR/.../24-08-2026" with only a copy button. A hover tooltip with the full reference would save a paste-to-check step.
- Net Outflow's red styling puts a routine, expected cost (evaluation fees) in the same visual register as an actual account failure. A neutral tone for planned spend would keep red reserved for genuine risk states.

That covers Overview, Live Risk, and Finance. 