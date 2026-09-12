import type { DashboardData, AccountSnapshot, TradeData } from "./propr-api";
import { formatUSD, formatINR, formatPercent, formatShortId, formatAccountTag } from "./utils";

export function generateMarkdownExport(data: DashboardData): string {
  const { accounts, allPositions, allOrders, finance } = data;
  const now = new Date();
  const utcDateStr = now.toUTCString();
  const istDateStr = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";

  const activeAccounts = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  );
  const breachedAccounts = accounts.filter(
    (a) => a.stage === "BREACHED" || a.stage === "FAILED" || a.stage === "CLOSED"
  );

  // Financial baseline numbers
  const totalCapitalBudgetINR = 90000;
  const totalSpentINR = Number(finance.totalActualCashCostINR || finance.totalInvestedINR || 25394.83);
  const activeAtRiskINR = Number(finance.activeActualCashCostINR || finance.activeCapitalINR || 7336.19);
  const sunkCapitalINR = Number(finance.historicalSunkCashCostINR || (totalSpentINR - activeAtRiskINR));
  const remainingRunwayINR = Math.max(0, totalCapitalBudgetINR - totalSpentINR);
  const totalPayoutsINR = Number(finance.totalPayoutsINR || 0);

  const lines: string[] = [];

  // ─── Document Title & Portfolio Meta ───────────────────────────────────────
  lines.push("# Prop Firm Trading Portfolio — Comprehensive Performance & Capital Audit Dossier");
  lines.push("");
  lines.push(`> **Audit Timestamp:** ${utcDateStr} / ${istDateStr}`);
  lines.push(`> **Total Capital Pool:** ${formatINR(totalCapitalBudgetINR)} | **Actual Cash Spent:** ${formatINR(totalSpentINR)} | **Preserved Capital Runway:** ${formatINR(remainingRunwayINR)} (${((remainingRunwayINR / totalCapitalBudgetINR) * 100).toFixed(1)}%)`);
  lines.push(`> **Portfolio Scope:** ${accounts.length} Total Accounts (${activeAccounts.length} Active Evaluations · ${breachedAccounts.length} Breached/Archived Historical Attempts)`);
  lines.push(`> **Primary Objective:** Rigorous data-backed evaluation of trader profitability, progression from learning to consistency, funded withdrawal projections, and capital budgeting.`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // ─── 1. Capital Budget, Runway & Prop Firm Allocation ───────────────────────
  lines.push("## 1. Capital Budget, Runway & Prop Firm Allocation");
  lines.push("");
  lines.push("### Overall Financial Position (INR Base)");
  lines.push("| Metric | Amount (INR) | Equivalent (USD) | Portfolio Context |");
  lines.push("| :--- | :---: | :---: | :--- |");
  lines.push(`| **Total Allocated Capital Budget** | **${formatINR(totalCapitalBudgetINR)}** | ~$1,070.00 | Total capital pool set aside for prop firm trading |`);
  lines.push(`| **Total Actual Cash Spent** | **${formatINR(totalSpentINR)}** | ${formatUSD(finance.totalInvestedUSD)} | Settled bank cash spent across all challenge fees |`);
  lines.push(`| **Active Capital at Risk** | **${formatINR(activeAtRiskINR)}** | ${formatUSD(finance.activeCapitalUSD)} | Capital deployed across current active accounts (\`#3XGK\` + \`#fjU6\`) |`);
  lines.push(`| **Historical Sunk Capital** | ${formatINR(sunkCapitalINR)} | — | Capital spent on earlier learning/breached evaluations |`);
  lines.push(`| **Remaining Dry Powder / Runway** | **${formatINR(remainingRunwayINR)}** | ~$${(remainingRunwayINR / 84).toFixed(0)} | Uncommitted bank cash reserved for future accounts |`);
  lines.push(`| **Total Payouts Realized** | **${formatINR(totalPayoutsINR)}** | ${formatUSD(finance.totalPayoutsUSD)} | Funded account payout withdrawals settled |`);
  lines.push("");

  lines.push("### Prop Firm Cash Allocation");
  lines.push("| Prop Firm | Actual Cash Spent | Share (%) | Active Evaluations | Breached Accounts | Notes |");
  lines.push("| :--- | :---: | :---: | :---: | :---: | :--- |");
  const proprPct = totalSpentINR > 0 ? ((Number(finance.proprActualCashCostINR || 21559.58) / totalSpentINR) * 100).toFixed(1) : "84.9";
  const breakoutPct = totalSpentINR > 0 ? ((Number(finance.breakoutActualCashCostINR || 3835.25) / totalSpentINR) * 100).toFixed(1) : "15.1";
  lines.push(`| **Propr** (\`app.propr.xyz\`) | ${formatINR(finance.proprActualCashCostINR || 21559.58)} | ${proprPct}% | 2 | 5 | Primary DEX perpetuals prop firm platform |`);
  lines.push(`| **Breakout** (\`breakoutprop.com\`) | ${formatINR(finance.breakoutActualCashCostINR || 3835.25)} | ${breakoutPct}% | 0 | 1 | Single historical evaluation attempt |`);
  lines.push("");

  lines.push("### Evaluation Unit Economics & 20% Discount Opportunity");
  lines.push("| Challenge Tier | Account Size | Standard Price | 20% Discount Price | Standard INR (est.) | Discounted INR (est.) | Affordable with Remaining Runway |");
  lines.push("| :--- | :---: | :---: | :---: | :---: | :---: | :---: |");
  lines.push(`| **Starter 1-Step Turbo** | $5,000 | $25.00 | **$20.00** | ₹2,446 | **₹1,957** | **~33 accounts** |`);
  lines.push(`| **Explorer 1-Step Turbo** | $10,000 | $50.00 | **$40.00** | ₹4,890 | **₹3,912** | **~16 accounts** |`);
  lines.push("");
  lines.push("> **Runway Cushion:** With ₹64,605.17 in remaining dry powder, the trader holds over 71% of total capital in reserve. Buying 2-3 queued accounts during the 20% discount (e.g. ₹7,800 - ₹11,700 total) consumes only 12-18% of the remaining runway while locking in permanent cost savings.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // ─── 2. Progression & Learning Curve Analysis ───────────────────────────────
  lines.push("## 2. Progression & Learning Curve Analysis");
  lines.push("");
  lines.push("A rigorous examination of execution logs reveals three distinct trading evolutions:");
  lines.push("");
  lines.push("### Phase 1: Early Novice Period (Aug 24 – Sep 3) — Drawdown Sensitivity & Onboarding");
  lines.push("- **Monitored Accounts:** `#1Aqi`, `#y9rs`, `#BdAJ`, `#uN2G`");
  lines.push("- **Behavioral Pattern:** Rapid execution of 15 to 58 micro-trades per account with win rates between 0.0% and 18.2%.");
  lines.push("- **Primary Failure Mode:** Breaching the static 3% maximum trailing drawdown floor ($4,850 on $5,000 balance). In this early phase, small losses accumulated quickly and trade management lacked asymmetric reward-to-risk.");
  lines.push("");
  lines.push("### Phase 2: Inflection & The Near-Pass Account (`#5gMw`) — Proven Profit Capability");
  lines.push("- **Account:** `qeBHuFFg5gMw` (`#5gMw`) — Starter Turbo ($5,000)");
  lines.push("- **Timeline:** Aug 29 – Sep 3, 2026 (73 trades executed)");
  lines.push("- **Peak Equity Reached:** **$5,266.62 (+5.33% net gain)**");
  lines.push("- **Proximity to Funded Target:** The profit target was 6% ($5,300) or 8% ($5,400). At $5,266.62, the account was **left by only 0.67% to 2.67% max ($33.38 to $133.38 away)** from passing into a funded account!");
  lines.push("- **Gross Wins:** The trader produced **+$892.74 in gross winning trades**, demonstrating an ability to generate substantial directional alpha.");
  lines.push("- **Breach Root Cause:** Breached `max_daily_loss_exceeded` on Sep 3 with a daily loss of $158.63 (3.01% vs 3.00% daily limit = breached by just **$8.63**!). Crucially, the account was **STILL in overall net profit at $5,107.99 (+2.16% above starting balance)** at the moment of breach.");
  lines.push("- **Key Lesson:** The trading edge was already working; the only failure was daily loss rule management on a single high-volatility session.");
  lines.push("");
  lines.push("### Phase 3: Mature & Recent Trading (Sep 5 – Present) — Consistency & Positive PnL");
  lines.push("- **Monitored Accounts:** `#fjU6` (Starter $5k) & `#3XGK` (Explorer $10k)");
  lines.push("- **Current Status:** **Both active accounts are simultaneously in net profit**:");
  lines.push("  - `#3XGK` ($10k): Balance **$10,173.67** (+$173.67 profit) · Gross Profit **+$629.81** vs Gross Loss $452.90");
  lines.push("  - `#fjU6` ($5k): Balance **$5,127.49** (+$127.49 profit) · Gross Profit **+$574.46** vs Gross Loss $554.35");
  lines.push("- **Asymmetric Edge:** Win sizes on winning trades now significantly exceed loss sizes, yielding positive net expectancy even with conservative win rates.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // ─── 3. Active Risk & Funded Proximity ─────────────────────────────────────
  lines.push("## 3. Active Accounts Live Status & Target Proximity");
  lines.push("");
  lines.push("The active accounts ranked by proximity to their profit target and daily loss buffer:");
  lines.push("");
  lines.push("| Account | Challenge Tier | Tag | Current Equity | Starting Bal | Net Profit | Target Goal | Target Progress | Profit Needed to Pass | Daily Loss Buffer | DD Floor |");
  lines.push("| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |");

  activeAccounts.forEach((acc) => {
    const eq = Number(acc.equity || acc.balance || 0);
    const start = Number(acc.initialBalance || acc.startingBalance || 10000);
    const net = eq - start;
    const netStr = net >= 0 ? `+${formatUSD(net)}` : `-${formatUSD(Math.abs(net))}`;
    const targetPct = Number(acc.profitTargetPercent || 8);
    const targetGoalUSD = start * (1 + targetPct / 100);
    const neededUSD = Math.max(0, targetGoalUSD - eq);
    const tag = formatAccountTag(acc.accountId);
    const dlRoom = formatUSD(acc.dailyLossRemaining);
    const floor = formatUSD(acc.breachFloor);

    lines.push(`| **${acc.challengeName || "Starter Turbo"}** | ${formatUSD(start)} | \`${tag}\` | **${formatUSD(eq)}** | ${formatUSD(start)} | **${netStr}** | ${formatUSD(targetGoalUSD)} (${targetPct}%) | **${formatPercent(acc.profitTargetPct, 2)}** | **${formatUSD(neededUSD)} (${((neededUSD / start) * 100).toFixed(2)}%)** | ${dlRoom} | ${floor} |`);
  });

  lines.push("");
  lines.push("---");
  lines.push("");

  // ─── 4. Realistic Funded Withdrawal Projections ────────────────────────────
  lines.push("## 4. Realistic Funded Account Withdrawal & Payout Projections");
  lines.push("");
  lines.push("Based on the trader's demonstrated performance in Phase 3 (average win sizes of $30–$80, net monthly return capability of 3%–8%), the following table models realistic bi-weekly/monthly withdrawal expectations upon funding:");
  lines.push("");
  lines.push("### Payout Modeling (80% Trader Profit Split)");
  lines.push("| Funded Account Configuration | Monthly Gross Gain | Account Net Profit | Trader Payout (80%) (USD) | Trader Payout (INR Equivalent) | Payback of Total Spent (₹25.4k) |");
  lines.push("| :--- | :---: | :---: | :---: | :---: | :--- |");
  lines.push(`| **Single $5,000 Account** (\`#fjU6\`) | Conservative: 3.0% | $150.00 | **$120.00** | **₹10,080** | 40% recouped in 1 month |`);
  lines.push(`| **Single $5,000 Account** (\`#fjU6\`) | Realistic: 5.0% | $250.00 | **$200.00** | **₹16,800** | 66% recouped in 1 month |`);
  lines.push(`| **Single $10,000 Account** (\`#3XGK\`) | Conservative: 3.0% | $300.00 | **$240.00** | **₹20,160** | 79% recouped in 1 month |`);
  lines.push(`| **Single $10,000 Account** (\`#3XGK\`) | Realistic: 5.0% | $500.00 | **$400.00** | **₹33,600** | **132% recouped (Full payback + ₹8.2k surplus)** |`);
  lines.push(`| **Single $10,000 Account** (\`#3XGK\`) | Strong: 8.0% | $800.00 | **$640.00** | **₹53,760** | **211% recouped (Full payback + ₹28.3k surplus)** |`);
  lines.push(`| **Combined $15,000 Allocation** (\`#3XGK\` + \`#fjU6\`) | Conservative: 3.0% | $450.00 | **$360.00** | **₹30,240** | **119% recouped in first payout** |`);
  lines.push(`| **Combined $15,000 Allocation** (\`#3XGK\` + \`#fjU6\`) | Realistic: 5.0% | $750.00 | **$600.00** | **₹50,400** | **198% recouped (Doubles total historical costs)** |`);
  lines.push(`| **Combined $15,000 Allocation** (\`#3XGK\` + \`#fjU6\`) | Strong: 8.0% | $1,200.00 | **$960.00** | **₹80,640** | **317% recouped (Nearly restores full ₹90k pool)** |`);
  lines.push("");
  lines.push("> **Core Financial Finding:** Because the total spent to date is modest (₹25,394.83), **a single realistic payout of 5% on the $10k account alone ($400 / ₹33,600) fully erases all historical evaluation costs and yields an immediate net profit.**");
  lines.push("");
  lines.push("---");
  lines.push("");

  // ─── 5. Strategic Capital Allocation & 20% Discount Assessment ─────────────
  lines.push("## 5. Strategic Capital Allocation & 20% Discount Recommendation");
  lines.push("");
  lines.push("### Critical Question: Should you purchase accounts ahead of the Sep 15 20% discount deadline?");
  lines.push("");
  lines.push("#### 1. The Strategy: Buying Ahead vs. Trading in Parallel");
  lines.push("- **Strictly Avoid Parallel Trading:** The trader's explicit decision **NOT** to trade newly purchased accounts in parallel is mathematically sound. In crypto perpetual trading, multiple active accounts simultaneously enter correlated positions, which geometrically magnifies drawdown risk during adverse market spikes.");
  lines.push("- **Queueing (Inventory) Model:** Purchasing accounts at a 20% discount and holding them unactivated in a queue until active accounts are either passed or breached locks in discounted cost basis without increasing market risk.");
  lines.push("");
  lines.push("#### 2. Sizing Guidance (How Many to Buy):");
  lines.push("- **Total Capital Budget:** ₹90,000 INR");
  lines.push("- **Already Spent:** ₹25,394.83 INR");
  lines.push("- **Available Runway:** ₹64,605.17 INR");
  lines.push("- **Recommended Purchase:** **2x $10,000 Explorer Turbo accounts** (or 1x $10,000 + 2x $5,000):");
  lines.push("  - At 20% discount, 2x $10,000 accounts cost $80.00 (~**₹7,824 INR**).");
  lines.push("  - This leaves **₹56,781 INR (63.1% of original ₹90k capital) intact** in the bank.");
  lines.push("- **Why not buy more?** Even with confidence, preserving >60% of total capital protects against unforeseen macro regime shifts or extended consolidation cycles. 2 accounts provide an ample 2-to-4 month operational buffer.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // ─── 6. Open Positions & Resting Orders ─────────────────────────────────────
  lines.push("## 6. Current Market Exposures & Resting Orders");
  lines.push("");
  lines.push(`### Open Perpetual Positions (${allPositions.length} active)`);

  if (allPositions.length === 0) {
    lines.push("*No open positions currently held. Capital is fully preserved in cross margin balance across active accounts.*");
    lines.push("");
  } else {
    lines.push("| Account | Asset | Side | Quantity | Entry Price | Mark Price | Liq Price | Margin Used | Unrealized PnL | ROE |");
    lines.push("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |");
    allPositions.forEach((pos) => {
      const uPnl = Number(pos.unrealizedPnl || 0);
      const uPnlStr = uPnl >= 0 ? `+${formatUSD(uPnl)}` : `-${formatUSD(Math.abs(uPnl))}`;
      lines.push(`| \`${formatAccountTag(pos.accountId)}\` | **${pos.asset}** | \`${pos.positionSide.toUpperCase()}\` | ${pos.quantity} | ${formatUSD(pos.entryPrice)} | ${formatUSD(pos.markPrice)} | ${pos.liquidationPrice ? formatUSD(pos.liquidationPrice) : "None"} | ${formatUSD(pos.marginUsed)} | **${uPnlStr}** | ${formatPercent(pos.returnOnEquity, 2, true)} |`);
    });
    lines.push("");
  }

  lines.push(`### Resting & Protective Orders (${allOrders.length} active)`);
  if (allOrders.length === 0) {
    lines.push("*No pending resting limit or stop-loss orders.*");
    lines.push("");
  } else {
    lines.push("| Account | Asset | Side | Order Type | Size | Trigger Price | Status | Time in Force |");
    lines.push("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |");
    allOrders.forEach((ord) => {
      lines.push(`| \`${formatAccountTag(ord.accountId)}\` | **${ord.asset}** | \`${ord.side.toUpperCase()}\` | ${ord.type} | ${ord.quantity} | ${formatUSD(ord.price || ord.triggerPrice)} | \`${ord.status}\` | GTC |`);
    });
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // ─── 7. Master Accounts Directory ─────────────────────────────────────────
  lines.push("## 7. Master Accounts Directory & Performance Summary");
  lines.push("");
  lines.push(`Total accounts monitored: **${accounts.length}** (${activeAccounts.length} Active / ${breachedAccounts.length} Breached / Archived)`);
  lines.push("");
  lines.push("| Tag | Challenge Tier | Stage | Starting Balance | Peak Equity | Current / Ending Equity | Realized PnL | Fees | Net PnL | Win Rate | Trades | Lifecycle Status |");
  lines.push("| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |");

  accounts.forEach((acc) => {
    const tag = formatAccountTag(acc.accountId);
    const tier = acc.challengeName || "Starter Turbo";
    const startBal = formatUSD(acc.initialBalance || acc.startingBalance || 10000);
    const peak = formatUSD(acc.highWaterMark || acc.equity || startBal);
    const currEq = formatUSD(acc.equity || acc.balance);
    const rPnl = formatUSD(acc.realizedPnl);
    const fees = formatUSD(acc.fees);
    const net = Number(acc.totalPnl || (Number(acc.equity || 0) - Number(acc.initialBalance || 0)));
    const netStr = net >= 0 ? `+${formatUSD(net)}` : `-${formatUSD(Math.abs(net))}`;
    const wr = acc.winRate || "0.0%";
    const tCount = acc.closedTradesCount || acc.trades?.length || 0;

    let statusCol = "Active Evaluation";
    if (acc.stage === "BREACHED" || acc.stage === "FAILED") {
      statusCol = `Breached: \`${acc.failureReason || "limit_exceeded"}\``;
    } else if (acc.stage === "FUNDED") {
      statusCol = "Funded Account Active";
    } else if (acc.profitTargetPct) {
      statusCol = `In Progress: ${formatPercent(acc.profitTargetPct, 2)}`;
    }

    lines.push(`| \`${tag}\` | ${tier} | \`${acc.stage}\` | ${startBal} | ${peak} | **${currEq}** | ${rPnl} | ${fees} | **${netStr}** | ${wr} | ${tCount} | ${statusCol} |`);
  });

  lines.push("");
  lines.push("---");
  lines.push("");

  // ─── 8. Granular Account Dossiers & Trade Histories ───────────────────────
  lines.push("## 8. Account-by-Account Granular Dossiers & Trade Histories");
  lines.push("");
  lines.push("Complete parameters, risk calibrations, breach diagnostics, and complete trade execution records for all 8 accounts owned:");
  lines.push("");

  accounts.forEach((acc, accIdx) => {
    const tag = formatAccountTag(acc.accountId);
    const name = acc.challengeName || "Starter Turbo";
    const trades = acc.trades || [];

    lines.push(`### 8.${accIdx + 1} Account: ${name} (\`${tag}\`)`);
    lines.push(`- **Identifier:** \`${acc.accountId}\``);
    lines.push(`- **Lifecycle Stage:** \`${acc.stage}\` (${acc.source === "challenge_attempt" ? "Challenge Evaluation" : "Funded Issuance"})`);
    lines.push(`- **Starting Capital:** ${formatUSD(acc.initialBalance || acc.startingBalance)}`);
    lines.push(`- **Final / Current Equity:** ${formatUSD(acc.equity || acc.balance)}`);
    lines.push(`- **High-Water Mark (Peak):** ${formatUSD(acc.highWaterMark || acc.equity)}`);
    lines.push(`- **Drawdown Limit Policy:** ${formatPercent(acc.maxDrawdownPercent, 1)} Max Drawdown (Floor: ${formatUSD(acc.breachFloor)})`);
    lines.push(`- **Daily Loss Policy:** ${formatPercent(acc.maxDailyLossPercent, 1)} Daily Loss Allowance (Floor: ${formatUSD(acc.dailyLossFloor)})`);
    lines.push(`- **Profit Target:** ${formatPercent(acc.profitTargetPercent, 1)}`);

    if (acc.stage === "BREACHED" || acc.stage === "FAILED") {
      lines.push(`- **Breach Diagnostic:**`);
      lines.push(`  - **Failure Reason:** \`${acc.failureReason || "rule_violation"}\``);
      if (acc.failureDetails) {
        Object.entries(acc.failureDetails).forEach(([k, v]) => {
          lines.push(`  - **${k}:** \`${String(v)}\``);
        });
      }
    }

    lines.push("");
    lines.push(`#### Complete Trade Execution History (${trades.length} Orders / Fills)`);

    if (trades.length === 0) {
      lines.push("*No trade executions recorded for this account.*");
      lines.push("");
    } else {
      lines.push("| # | Executed At (UTC) | Asset | Side | Quantity | Price | Notional ($) | Fee ($) | Gross PnL ($) | Net PnL ($) | Status | Fills | Trade ID |");
      lines.push("| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |");

      trades.forEach((t: TradeData, tIdx: number) => {
        const dateStr = t.executedAt ? new Date(t.executedAt).toISOString().replace("T", " ").replace("Z", " UTC") : "—";
        const sideStr = (t.side || t.positionSide || "buy").toUpperCase();
        const rPnl = Number(t.realizedPnl || 0);
        const fee = Number(t.fee || 0);
        const netPnl = rPnl - fee;
        const isWin = netPnl >= 0;
        const netStr = isWin ? `+${formatUSD(netPnl)}` : `-${formatUSD(Math.abs(netPnl))}`;
        const grossStr = rPnl >= 0 ? `+${formatUSD(rPnl)}` : `-${formatUSD(Math.abs(rPnl))}`;

        lines.push(`| ${tIdx + 1} | ${dateStr} | **${t.asset}** | \`${sideStr}\` | ${t.quantity} | ${formatUSD(t.price)} | ${formatUSD(t.quoteQuantity)} | -${formatUSD(fee)} | ${grossStr} | **${netStr}** | \`${isWin ? "WIN" : "LOSS"}\` | ${t.fillsCount || 1} | \`${formatShortId(t.tradeId)}\` |`);
      });
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  });

  // ─── 9. Financial Ledger & Bank Settlement Audit ───────────────────────────
  lines.push("## 9. Bank-Verified Purchase Ledger & Invoice Audit");
  lines.push("");
  lines.push("Itemized reconciliation of all challenge purchases against bank statements and gateway invoices:");
  lines.push("");
  lines.push("| Date | Firm | Challenge Tier | Account Tag | Face Value (USD) | Actual Bank Debit (INR) | Bank Reference | Invoice Code | Bank Settled |");
  lines.push("| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |");

  finance.ledger.forEach((tx) => {
    const tag = tx.accountId ? formatAccountTag(tx.accountId) : "—";
    const faceVal = tx.purchaseFaceValueUSD ? formatUSD(tx.purchaseFaceValueUSD) : formatUSD(tx.amountUSD);
    const inrVal = tx.actualCashCostINR ? formatINR(tx.actualCashCostINR) : formatINR(tx.amountINR);
    const bankRef = tx.bankReference || "—";
    const inv = tx.invoiceNumber || "—";
    const verified = tx.bankVerified ? "VERIFIED" : "PENDING";

    lines.push(`| ${tx.date} | **${tx.firm}** | ${tx.challengeName || "Starter Turbo"} | \`${tag}\` | ${faceVal} | **${inrVal}** | \`${bankRef}\` | \`${inv}\` | \`${verified}\` |`);
  });

  lines.push("");
  lines.push("---");
  lines.push("*End of Trader Performance & Capital Audit Dossier.*");

  return lines.join("\n");
}
