import type { DashboardData, AccountSnapshot, TradeData } from "./types";
import { formatUSD, formatINR, formatPercent, formatShortId, formatAccountTag } from "./utils";

interface ComputedAccountMetrics {
  account: AccountSnapshot;
  tag: string;
  initialBal: number;
  currentEquity: number;
  currentBalance: number;
  netPnL: number;
  highWaterMark: number;
  peakGainUSD: number;
  peakGainPct: number;
  targetPct: number;
  targetDollarGoal: number;
  targetBalance: number;
  peakDistancePct: number;
  isNearPass: boolean;
  tradesCount: number;
  winsCount: number;
  lossesCount: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  payoffRatio: number;
  totalFees: number;
  bestTrade: number;
  worstTrade: number;
  firstTradeDate: string | null;
  lastTradeDate: string | null;
}

function computeMetrics(acc: AccountSnapshot): ComputedAccountMetrics {
  const initialBal = Number(acc.initialBalance || acc.startingBalance || 10000);
  const currentEquity = Number(acc.equity || acc.balance || initialBal);
  const currentBalance = Number(acc.balance || currentEquity);
  const netPnL = Number(acc.totalPnl || (currentEquity - initialBal));
  const highWaterMark = Number(acc.highWaterMark || currentEquity);
  const peakGainUSD = Math.max(0, highWaterMark - initialBal);
  const peakGainPct = (peakGainUSD / initialBal) * 100;
  const targetPct = Number(acc.profitTargetPercent || 8);
  const targetDollarGoal = initialBal * (targetPct / 100);
  const targetBalance = initialBal + targetDollarGoal;
  const peakDistancePct = Math.max(0, targetPct - peakGainPct);
  // Near-pass: reached within 3.5% of passing the target at peak
  const isNearPass = peakGainPct > 0 && peakDistancePct <= 3.5;

  const trades = acc.trades || [];
  let winsCount = 0;
  let lossesCount = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let totalFees = 0;
  let bestTrade = -Infinity;
  let worstTrade = Infinity;
  let firstTradeDate: string | null = null;
  let lastTradeDate: string | null = null;

  if (trades.length > 0) {
    // Sort trades chronologically
    const sorted = [...trades].sort((a, b) => {
      const tA = new Date(a.executedAt || "").getTime();
      const tB = new Date(b.executedAt || "").getTime();
      return tA - tB;
    });
    firstTradeDate = sorted[0].executedAt || null;
    lastTradeDate = sorted[sorted.length - 1].executedAt || null;

    for (const t of trades) {
      const rPnl = Number(t.realizedPnl || 0);
      const fee = Number(t.fee || 0);
      const net = rPnl - fee;
      totalFees += fee;
      if (net > bestTrade) bestTrade = net;
      if (net < worstTrade) worstTrade = net;
      if (net > 0) {
        winsCount++;
        grossProfit += net;
      } else if (net < 0) {
        lossesCount++;
        grossLoss += Math.abs(net);
      }
    }
  }

  const closedTrades = winsCount + lossesCount;
  const winRate = closedTrades > 0 ? (winsCount / closedTrades) * 100 : 0;
  const avgWin = winsCount > 0 ? grossProfit / winsCount : 0;
  const avgLoss = lossesCount > 0 ? grossLoss / lossesCount : 0;
  const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

  return {
    account: acc,
    tag: formatAccountTag(acc.accountId),
    initialBal,
    currentEquity,
    currentBalance,
    netPnL,
    highWaterMark,
    peakGainUSD,
    peakGainPct,
    targetPct,
    targetDollarGoal,
    targetBalance,
    peakDistancePct,
    isNearPass,
    tradesCount: trades.length,
    winsCount,
    lossesCount,
    winRate,
    grossProfit,
    grossLoss,
    profitFactor,
    avgWin,
    avgLoss,
    payoffRatio,
    totalFees,
    bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
    worstTrade: worstTrade === Infinity ? 0 : worstTrade,
    firstTradeDate,
    lastTradeDate,
  };
}

export function generateMarkdownExport(data: DashboardData): string {
  const { accounts, allPositions, allOrders, finance } = data;
  const now = new Date();
  const utcDateStr = now.toUTCString();
  const istDateStr = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";

  // Compute metrics for every account dynamically
  const computedList: ComputedAccountMetrics[] = accounts.map(computeMetrics);

  const activeMetrics = computedList.filter(
    (m) => m.account.stage === "EVALUATION" || m.account.stage === "FUNDED"
  );
  const breachedMetrics = computedList.filter(
    (m) => m.account.stage === "BREACHED" || m.account.stage === "FAILED" || m.account.stage === "CLOSED"
  );

  // Financial calculations dynamically aggregated from finance & ledger
  const totalSpentINR = Number(finance.totalActualCashCostINR || finance.totalInvestedINR || 0);
  const activeAtRiskINR = Number(finance.activeActualCashCostINR || finance.activeCapitalINR || 0);
  const sunkCapitalINR = Number(finance.historicalSunkCashCostINR || Math.max(0, totalSpentINR - activeAtRiskINR));
  const totalPayoutsINR = Number(finance.totalPayoutsINR || 0);
  const netCashOutflowINR = totalSpentINR - totalPayoutsINR;

  // Prop firm breakdown dynamically computed from ledger
  const firmMap = new Map<string, { totalINR: number; totalUSD: number; count: number }>();
  if (finance.ledger && finance.ledger.length > 0) {
    for (const tx of finance.ledger) {
      const firm = tx.firm || "Unknown";
      const cur = firmMap.get(firm) || { totalINR: 0, totalUSD: 0, count: 0 };
      cur.totalINR += Number(tx.actualCashCostINR || tx.amountINR || 0);
      cur.totalUSD += Number(tx.purchaseFaceValueUSD || tx.amountUSD || 0);
      cur.count += 1;
      firmMap.set(firm, cur);
    }
  }

  // Chronological sort: by first trade date or creation
  const chronologicalList = [...computedList].sort((a, b) => {
    const tA = a.firstTradeDate ? new Date(a.firstTradeDate).getTime() : 0;
    const tB = b.firstTradeDate ? new Date(b.firstTradeDate).getTime() : 0;
    return tA - tB;
  });

  const lines: string[] = [];

  // ─── Header & Metadata ─────────────────────────────────────────────────────
  lines.push("# Prop Firm Portfolio & Trade History — Master Performance Dossier");
  lines.push("");
  lines.push(`> **Generated At:** ${utcDateStr} / ${istDateStr}`);
  lines.push(`> **Accounts Monitored:** ${accounts.length} Total (${activeMetrics.length} Active Evaluations · ${breachedMetrics.length} Breached/Archived Attempts)`);
  lines.push(`> **Bank Cash Spent (INR):** ${formatINR(totalSpentINR)} (${formatUSD(finance.totalInvestedUSD)}) · **Active Capital at Risk:** ${formatINR(activeAtRiskINR)} (${formatUSD(finance.activeCapitalUSD)}) · **Historical Sunk Capital:** ${formatINR(sunkCapitalINR)}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // ─── Section 1: Executive Capital Allocation & Financial Ledger Summary ─────
  lines.push("## 1. Executive Capital Allocation & Financial Ledger Summary");
  lines.push("");
  lines.push("### Bank Cash Outflow & Risk Capital Summary (INR Base)");
  lines.push("| Metric | Amount (INR) | Amount (USD) | Accounting Context |");
  lines.push("| :--- | :---: | :---: | :--- |");
  lines.push(`| **Total Actual Cash Spent** | **${formatINR(totalSpentINR)}** | ${formatUSD(finance.totalInvestedUSD)} | Settled bank cash across all evaluations & challenge fees |`);
  lines.push(`| **Active Capital at Risk** | **${formatINR(activeAtRiskINR)}** | ${formatUSD(finance.activeCapitalUSD)} | Capital deployed in currently active evaluation accounts |`);
  lines.push(`| **Historical Sunk Capital** | ${formatINR(sunkCapitalINR)} | — | Capital consumed by earlier breached/archived evaluations |`);
  lines.push(`| **Total Payouts Received** | **${formatINR(totalPayoutsINR)}** | ${formatUSD(finance.totalPayoutsUSD)} | Realized withdrawals from funded accounts |`);
  lines.push(`| **Net Out-of-Pocket Outflow** | **-${formatINR(netCashOutflowINR)}** | -${formatUSD(finance.actualCashPnLUSD)} | Total spent minus total payouts realized |`);
  lines.push("");

  if (firmMap.size > 0) {
    lines.push("### Prop Firm Breakdown");
    lines.push("| Prop Firm | Actual Bank Debit (INR) | Face Value (USD) | Share of Total Spent | Purchases / Challenges |");
    lines.push("| :--- | :---: | :---: | :---: | :---: |");
    for (const [firm, stats] of firmMap.entries()) {
      const pct = totalSpentINR > 0 ? ((stats.totalINR / totalSpentINR) * 100).toFixed(1) : "0.0";
      lines.push(`| **${firm}** | ${formatINR(stats.totalINR)} | ${formatUSD(stats.totalUSD)} | ${pct}% | ${stats.count} |`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // ─── Section 2: Chronological Performance & Progression Matrix ────────────
  lines.push("## 2. Chronological Performance & Progression Matrix");
  lines.push("");
  lines.push("All accounts ordered chronologically from earliest to most recent, illustrating execution consistency, payoff ratio, and target progress over time:");
  lines.push("");
  lines.push("| Tag | Tier | Stage | Trading Window (UTC) | Trades | Win Rate | Payoff Ratio (Avg W : Avg L) | Profit Factor | Gross Wins | Gross Losses | Net PnL | Peak Equity | Peak Gain (%) | Dist. to Target at Peak | Lifecycle Outcome |");
  lines.push("| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |");

  chronologicalList.forEach((m) => {
    const acc = m.account;
    const tier = acc.challengeName || "Starter Turbo";
    const wr = `${m.winRate.toFixed(1)}% (${m.winsCount}W/${m.lossesCount}L)`;
    const payoff = m.avgLoss > 0 ? `${(m.avgWin / m.avgLoss).toFixed(2)}x` : m.avgWin > 0 ? "∞" : "0.00x";
    const pf = m.profitFactor > 50 ? ">50" : m.profitFactor.toFixed(2);
    const net = m.netPnL >= 0 ? `+${formatUSD(m.netPnL)}` : `-${formatUSD(Math.abs(m.netPnL))}`;
    const peakG = `+${m.peakGainPct.toFixed(2)}%`;
    const dist = m.peakDistancePct === 0 ? "Target Met" : `Left by ${m.peakDistancePct.toFixed(2)}%`;

    const startStr = m.firstTradeDate ? m.firstTradeDate.slice(0, 10) : "—";
    const endStr = m.lastTradeDate ? m.lastTradeDate.slice(0, 10) : "Active";
    const windowStr = `${startStr} → ${endStr}`;

    let outcomeStr = "Active";
    if (acc.stage === "BREACHED" || acc.stage === "FAILED") {
      outcomeStr = `Breached: \`${acc.failureReason || "rule_violation"}\``;
    } else if (acc.stage === "FUNDED") {
      outcomeStr = "Funded";
    }

    lines.push(`| \`${m.tag}\` | ${tier} | \`${acc.stage}\` | ${windowStr} | ${m.tradesCount} | ${wr} | ${payoff} | ${pf} | ${formatUSD(m.grossProfit)} | ${formatUSD(m.grossLoss)} | **${net}** | ${formatUSD(m.highWaterMark)} | ${peakG} | ${dist} | ${outcomeStr} |`);
  });

  lines.push("");

  // Dynamically identify near-pass accounts (left by <= 3.5% from target at peak)
  const nearPassAccounts = computedList.filter((m) => m.isNearPass);
  if (nearPassAccounts.length > 0) {
    lines.push("### Near-Pass Account Audit (Accounts within 1%–3.5% of Passing at Peak)");
    lines.push("");
    lines.push("The following accounts reached within 3.5% of their profit target before failing or are currently within proximity:");
    lines.push("");
    lines.push("| Tag | Account Tier | Starting Balance | Peak Equity Reached | Target % | Target Balance | Distance from Target at Peak | Gross Wins Produced | Final / Current Status | Failure Trigger |");
    lines.push("| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |");

    nearPassAccounts.forEach((m) => {
      const acc = m.account;
      const tier = acc.challengeName || "Starter Turbo";
      const start = formatUSD(m.initialBal);
      const peak = formatUSD(m.highWaterMark);
      const targetBal = formatUSD(m.targetBalance);
      const distUSD = formatUSD(Math.max(0, m.targetBalance - m.highWaterMark));
      const distPct = `${m.peakDistancePct.toFixed(2)}% (${distUSD})`;
      const grossW = formatUSD(m.grossProfit);
      const reason = acc.failureReason ? `\`${acc.failureReason}\`` : "In Progress";

      lines.push(`| \`${m.tag}\` | ${tier} | ${start} | **${peak} (+${m.peakGainPct.toFixed(2)}%)** | ${m.targetPct}% | ${targetBal} | **Left by ${distPct}** | ${grossW} | \`${acc.stage}\` | ${reason} |`);
    });
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // ─── Section 3: Active Accounts Status & Distance to Funded ────────────────
  lines.push("## 3. Active Accounts Live Status & Distance to Target");
  lines.push("");
  lines.push("Active accounts ranked by proximity to their target and current binding loss buffer:");
  lines.push("");
  lines.push("| Account | Tag | Starting Balance | Current Equity | Net Profit | Target % | Profit Goal ($) | Target Progress | Profit Needed to Pass | Daily Loss Buffer | Daily Used | Max DD Buffer | Binding Breach Floor |");
  lines.push("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |");

  activeMetrics.forEach((m) => {
    const acc = m.account;
    const tier = acc.challengeName || "Starter Turbo";
    const net = m.netPnL >= 0 ? `+${formatUSD(m.netPnL)}` : `-${formatUSD(Math.abs(m.netPnL))}`;
    const neededUSD = Math.max(0, m.targetBalance - m.currentEquity);
    const neededPct = ((neededUSD / m.initialBal) * 100).toFixed(2);
    const dlUsed = `${formatPercent(acc.dailyLossUsedPercent, 1)} (${formatUSD(acc.dailyLossUsedAmount)})`;

    lines.push(`| **${tier}** | \`${m.tag}\` | ${formatUSD(m.initialBal)} | **${formatUSD(m.currentEquity)}** | **${net}** | ${m.targetPct}% | ${formatUSD(m.targetBalance)} | **${formatPercent(acc.profitTargetPct, 2)}** | **${formatUSD(neededUSD)} (${neededPct}%)** | **${formatUSD(acc.dailyLossRemaining)}** | ${dlUsed} | ${formatUSD(acc.drawdownRemaining)} | ${formatUSD(acc.breachFloor)} |`);
  });

  lines.push("");
  lines.push("---");
  lines.push("");

  // ─── Section 4: Current Market Exposures & Resting Orders ──────────────────
  lines.push("## 4. Current Market Exposures & Resting Orders");
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

  // ─── Section 5: Master Accounts Directory ──────────────────────────────────
  lines.push("## 5. Master Accounts Directory & Performance Summary");
  lines.push("");
  lines.push(`Total accounts monitored: **${accounts.length}** (${activeMetrics.length} Active / ${breachedMetrics.length} Breached / Archived)`);
  lines.push("");
  lines.push("| Tag | Challenge Tier | Stage | Starting Balance | Peak Equity | Current / Ending Equity | Realized PnL | Fees | Net PnL | Win Rate | Trades | Lifecycle Status |");
  lines.push("| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |");

  computedList.forEach((m) => {
    const acc = m.account;
    const tier = acc.challengeName || "Starter Turbo";
    const startBal = formatUSD(m.initialBal);
    const peak = formatUSD(m.highWaterMark);
    const currEq = formatUSD(m.currentEquity);
    const rPnl = formatUSD(acc.realizedPnl);
    const fees = formatUSD(acc.fees);
    const netStr = m.netPnL >= 0 ? `+${formatUSD(m.netPnL)}` : `-${formatUSD(Math.abs(m.netPnL))}`;
    const wr = `${m.winRate.toFixed(1)}%`;
    const tCount = m.tradesCount;

    let statusCol = "Active Evaluation";
    if (acc.stage === "BREACHED" || acc.stage === "FAILED") {
      statusCol = `Breached: \`${acc.failureReason || "limit_exceeded"}\``;
    } else if (acc.stage === "FUNDED") {
      statusCol = "Funded Account Active";
    } else if (acc.profitTargetPct) {
      statusCol = `In Progress: ${formatPercent(acc.profitTargetPct, 2)}`;
    }

    lines.push(`| \`${m.tag}\` | ${tier} | \`${acc.stage}\` | ${startBal} | ${peak} | **${currEq}** | ${rPnl} | ${fees} | **${netStr}** | ${wr} | ${tCount} | ${statusCol} |`);
  });

  lines.push("");
  lines.push("---");
  lines.push("");

  // ─── Section 6: Granular Account Dossiers & Trade Histories ────────────────
  lines.push("## 6. Account-by-Account Granular Dossiers & Trade Histories");
  lines.push("");
  lines.push("Complete parameters, risk calibrations, breach diagnostics, and complete trade execution records for all monitored accounts:");
  lines.push("");

  computedList.forEach((m, accIdx) => {
    const acc = m.account;
    const name = acc.challengeName || "Starter Turbo";
    const trades = acc.trades || [];

    lines.push(`### 6.${accIdx + 1} Account: ${name} (\`${m.tag}\`)`);
    lines.push(`- **Account URN:** \`${acc.accountId}\``);
    lines.push(`- **Lifecycle Stage:** \`${acc.stage}\` (${acc.source === "challenge_attempt" ? "Challenge Evaluation" : "Funded Issuance"})`);
    lines.push(`- **Starting Capital:** ${formatUSD(m.initialBal)}`);
    lines.push(`- **Final / Current Equity:** ${formatUSD(m.currentEquity)}`);
    lines.push(`- **High-Water Mark (Peak):** ${formatUSD(m.highWaterMark)} (+${m.peakGainPct.toFixed(2)}% gain)`);
    lines.push(`- **Profit Target:** ${m.targetPct}% (Goal: ${formatUSD(m.targetBalance)} | Peak Distance: Left by ${m.peakDistancePct.toFixed(2)}%)`);
    lines.push(`- **Risk Policies:** ${formatPercent(acc.maxDrawdownPercent, 1)} Max Drawdown (Floor: ${formatUSD(acc.breachFloor)}) · ${formatPercent(acc.maxDailyLossPercent, 1)} Daily Loss Allowance (Floor: ${formatUSD(acc.dailyLossFloor)})`);
    lines.push(`- **Performance Stats:** ${m.tradesCount} trades · Win Rate: ${m.winRate.toFixed(1)}% (${m.winsCount}W/${m.lossesCount}L) · Profit Factor: ${m.profitFactor > 50 ? ">50" : m.profitFactor.toFixed(2)} · Avg Win: ${formatUSD(m.avgWin)} · Avg Loss: ${formatUSD(m.avgLoss)} · Gross Wins: ${formatUSD(m.grossProfit)} · Gross Losses: ${formatUSD(m.grossLoss)} · Total Fees: ${formatUSD(m.totalFees)} · Net PnL: ${m.netPnL >= 0 ? "+" : ""}${formatUSD(m.netPnL)}`);

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

  // ─── Section 7: Bank-Verified Purchase Ledger & Invoice Audit ─────────────
  lines.push("## 7. Bank-Verified Purchase Ledger & Invoice Audit");
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
  lines.push("*End of Master Performance & Trade History Dossier.*");

  return lines.join("\n");
}
