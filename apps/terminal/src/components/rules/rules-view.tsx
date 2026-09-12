"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { DashboardData, AccountSnapshot, TradeData } from "@/lib/propr-api";
import { formatUSD, formatAccountTag, formatPercent } from "@/lib/utils";
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calculator,
  Flame,
  Layers,
  Sparkles,
  ChevronDown,
} from "lucide-react";

interface RulesViewProps {
  data: DashboardData;
}

const ALLOWED_ASSETS = [
  { symbol: "BTC", name: "Bitcoin", defaultPrice: 68430 },
  { symbol: "Gold", ticker: "PAXG", name: "Gold / PAXG", defaultPrice: 2510 },
  { symbol: "NEAR", name: "Near Protocol", defaultPrice: 4.85 },
  { symbol: "ENA", name: "Ethena", defaultPrice: 0.58 },
  { symbol: "HYPE", name: "Hyperliquid", defaultPrice: 14.5 },
  { symbol: "ZEC", name: "Zcash", defaultPrice: 34.8 },
];

export function RulesView({ data }: RulesViewProps) {
  const { accounts, allPositions } = data;

  // Selected account for account-specific rule checks (defaults to first active)
  const defaultAccount =
    accounts.find((a) => a.stage === "EVALUATION" || a.stage === "FUNDED") ||
    accounts[0];

  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    defaultAccount?.accountId || ""
  );

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.accountId === selectedAccountId) || accounts[0];
  }, [accounts, selectedAccountId]);

  // Real-time clock updating every 1000ms
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── 1. Trading Hours Gate (Rule 1) ────────────────────────────────────────
  // Trading starts: Monday 6:30 AM IST
  // Trading ends: Saturday 12:30 AM IST
  const { isTradingHoursOpen, nextWindowText, sessionCountdown, currentISTString, currentESTString } =
    useMemo(() => {
      // Get current date representation in IST (Asia/Kolkata)
      const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const istDate = new Date(istString);

      const estString = now.toLocaleString("en-US", { timeZone: "America/New_York" });

      const day = istDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      const hour = istDate.getHours();
      const minute = istDate.getMinutes();
      const second = istDate.getSeconds();

      // Convert current IST to total minutes from Sunday 00:00 IST
      const currentWeeklyMinutes = day * 1440 + hour * 60 + minute;

      // Window bounds in minutes of week:
      // Monday 06:30 AM IST: 1 * 1440 + 6 * 60 + 30 = 1830
      // Saturday 00:30 AM IST: 6 * 1440 + 0 * 60 + 30 = 8670
      const openMinute = 1830;
      const closeMinute = 8670;

      const isOpen = currentWeeklyMinutes >= openMinute && currentWeeklyMinutes < closeMinute;

      let remainingMin = 0;
      let nextAction = "";

      if (isOpen) {
        remainingMin = closeMinute - currentWeeklyMinutes;
        nextAction = "Session closes Saturday 12:30 AM IST";
      } else {
        if (currentWeeklyMinutes < openMinute) {
          remainingMin = openMinute - currentWeeklyMinutes;
        } else {
          // Saturday post 00:30 or Sunday
          remainingMin = 10080 - currentWeeklyMinutes + openMinute;
        }
        nextAction = "Next session opens Monday 6:30 AM IST";
      }

      const remHours = Math.floor(remainingMin / 60);
      const remMins = remainingMin % 60;
      const remSecs = 59 - second;
      const countdown = `${remHours}h ${String(remMins).padStart(2, "0")}m ${String(Math.max(0, remSecs)).padStart(2, "0")}s`;

      return {
        isTradingHoursOpen: isOpen,
        nextWindowText: nextAction,
        sessionCountdown: countdown,
        currentISTString: now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
        currentESTString: now.toLocaleTimeString("en-US", {
          timeZone: "America/New_York",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      };
    }, [now]);

  // ─── 2. Weekend Trading Rule (Rule 2) ──────────────────────────────────────
  const { isWeekend, canWeekendTrade, weekendReason } = useMemo(() => {
    const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(istString);
    const day = istDate.getDay();
    const currentWeeklyMinutes = day * 1440 + istDate.getHours() * 60 + istDate.getMinutes();

    // Weekend is anytime outside Monday 6:30 AM to Saturday 12:30 AM
    const isWknd = currentWeeklyMinutes < 1830 || currentWeeklyMinutes >= 8670;

    const initialBal = Number(selectedAccount?.initialBalance || selectedAccount?.startingBalance || 10000);
    const currentEq = Number(selectedAccount?.equity || selectedAccount?.balance || initialBal);
    const isProfit = currentEq > initialBal;

    let reason = "Trading is within standard weekday window.";
    let canTrade = true;

    if (isWknd) {
      if (!isProfit) {
        canTrade = false;
        reason = "Blocked: Account has unrecovered drawdown. Weekend trading strictly prohibited until losses are recovered.";
      } else {
        canTrade = false; // Primary rule #1 still blocks outside 6:30 AM Mon - 12:30 AM Sat
        reason = "Account is in profit, but weekend trading is allowed very rarely and only with secured profits.";
      }
    }

    return { isWeekend: isWknd, canWeekendTrade: canTrade, weekendReason: reason };
  }, [now, selectedAccount]);

  // ─── 3. Account Tier & Risk Limits (Rule 4 & 6) ───────────────────────────
  const { is10k, baseMaxRiskUSD, currentMaxRiskUSD, isTargetProtectionActive, profitPercent } =
    useMemo(() => {
      const initialBal = Number(selectedAccount?.initialBalance || selectedAccount?.startingBalance || 10000);
      const currentEq = Number(selectedAccount?.equity || selectedAccount?.balance || initialBal);
      const profitPct = ((currentEq - initialBal) / initialBal) * 100;

      // Tier check: 10K vs 5K
      const isTenK = initialBal >= 7500 || (selectedAccount?.challengeName?.toLowerCase().includes("10k") ?? false);

      const baseRisk = isTenK ? 50 : 30;

      // Rule 6: Once 7.5% profit is reached, reduce risk to:
      // 5K: Max $25 | 10K: Max $50
      const targetProtected = profitPct >= 7.5;
      const finalRisk = targetProtected ? (isTenK ? 50 : 25) : baseRisk;

      return {
        is10k: isTenK,
        baseMaxRiskUSD: baseRisk,
        currentMaxRiskUSD: finalRisk,
        isTargetProtectionActive: targetProtected,
        profitPercent: profitPct,
      };
    }, [selectedAccount]);

  // ─── 4. Intraday Circuit Breaker (Rule 5) ──────────────────────────────────
  // 5K account: $75 loss | 10K account: $135 loss | Reset: 5:00 AM EST
  const { circuitBreakerCeiling, lossUsedTodayUSD, lossRoomRemainingUSD, isCircuitBreakerTripped, nextResetCountdown } =
    useMemo(() => {
      const ceiling = is10k ? 135 : 75;

      // Calculate today's loss from account metrics
      const dailyUsed = Number(selectedAccount?.dailyLossUsedAmount || 0);
      const remainingRoom = Math.max(0, ceiling - dailyUsed);
      const isTripped = dailyUsed >= ceiling;

      // Countdown to next 5:00 AM EST
      // 5:00 AM EST is 10:00 AM UTC (or 9:00 AM UTC in EDT)
      const estString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
      const estDate = new Date(estString);
      const estHour = estDate.getHours();
      const estMinute = estDate.getMinutes();
      const estSecond = estDate.getSeconds();

      const currentEstMinutes = estHour * 60 + estMinute;
      const targetResetMinute = 5 * 60; // 5:00 AM

      let diffMinutes = 0;
      if (currentEstMinutes < targetResetMinute) {
        diffMinutes = targetResetMinute - currentEstMinutes;
      } else {
        diffMinutes = 1440 - currentEstMinutes + targetResetMinute;
      }

      const h = Math.floor(diffMinutes / 60);
      const m = diffMinutes % 60;
      const s = 59 - estSecond;
      const resetCountdown = `${h}h ${String(m).padStart(2, "0")}m ${String(Math.max(0, s)).padStart(2, "0")}s`;

      return {
        circuitBreakerCeiling: ceiling,
        lossUsedTodayUSD: dailyUsed,
        lossRoomRemainingUSD: remainingRoom,
        isCircuitBreakerTripped: isTripped,
        nextResetCountdown: resetCountdown,
      };
    }, [is10k, selectedAccount, now]);

  // ─── 5. Parallel Trading & 45-min Cooldown (Rule 7) ────────────────────────
  // Maximum 1 open trade across entire portfolio
  // Minimum 45-minute gap between trades
  const {
    openPositionsCount,
    hasParallelViolation,
    activePositionAsset,
    latestTradeTime,
    minutesSinceLastTrade,
    isCooldownActive,
    cooldownRemainingText,
  } = useMemo(() => {
    const openCount = allPositions.length;
    const hasParallel = openCount >= 1;
    const asset = openCount > 0 ? allPositions[0].asset : null;

    // Search for latest trade fill across all accounts
    let latestTs = 0;
    for (const acc of accounts) {
      if (acc.trades && acc.trades.length > 0) {
        for (const t of acc.trades) {
          const ts = new Date(t.executedAt || "").getTime();
          if (ts > latestTs) latestTs = ts;
        }
      }
    }

    let diffMin = 999;
    let cdActive = false;
    let cdText = "Cooldown satisfied (>45m elapsed)";

    if (latestTs > 0) {
      const elapsedMs = now.getTime() - latestTs;
      diffMin = Math.floor(elapsedMs / (1000 * 60));
      if (diffMin < 45) {
        cdActive = true;
        const remMin = 44 - diffMin;
        const remSec = 59 - Math.floor((elapsedMs % 60000) / 1000);
        cdText = `${remMin}m ${String(Math.max(0, remSec)).padStart(2, "0")}s remaining`;
      }
    }

    return {
      openPositionsCount: openCount,
      hasParallelViolation: hasParallel,
      activePositionAsset: asset,
      latestTradeTime: latestTs > 0 ? new Date(latestTs).toUTCString() : null,
      minutesSinceLastTrade: diffMin,
      isCooldownActive: cdActive,
      cooldownRemainingText: cdText,
    };
  }, [allPositions, accounts, now]);

  // ─── 6. Master "Can I Take a Position Right Now?" Checklist ─────────────────
  const preFlightChecks = useMemo(() => {
    return [
      {
        id: "hours",
        ruleNum: 1,
        title: "Trading Window Open",
        description: "Monday 6:30 AM IST to Saturday 12:30 AM IST",
        passed: isTradingHoursOpen,
        failReason: isTradingHoursOpen ? null : "Weekend market window closed. Opens Monday 6:30 AM IST.",
      },
      {
        id: "parallel",
        ruleNum: 7,
        title: "Zero Parallel Trades",
        description: "Max 1 open trade portfolio-wide at any time",
        passed: !hasParallelViolation,
        failReason: hasParallelViolation
          ? `1 trade already active (${activePositionAsset || "Open Position"}). Close existing trade first.`
          : null,
      },
      {
        id: "cooldown",
        ruleNum: 7,
        title: "45-Minute Trade Gap",
        description: "Enforces 45-minute pause after previous trade to prevent overtrading",
        passed: !isCooldownActive,
        failReason: isCooldownActive ? `Cooldown timer running: ${cooldownRemainingText}` : null,
      },
      {
        id: "circuit",
        ruleNum: 5,
        title: "Circuit Breaker Safe",
        description: `Daily loss limit ($${circuitBreakerCeiling}) not reached`,
        passed: !isCircuitBreakerTripped,
        failReason: isCircuitBreakerTripped
          ? `Intraday circuit breaker tripped ($${lossUsedTodayUSD.toFixed(2)} loss). No trading until 5:00 AM EST.`
          : null,
      },
    ];
  }, [
    isTradingHoursOpen,
    hasParallelViolation,
    activePositionAsset,
    isCooldownActive,
    cooldownRemainingText,
    circuitBreakerCeiling,
    isCircuitBreakerTripped,
    lossUsedTodayUSD,
  ]);

  const canTradeNow = preFlightChecks.every((c) => c.passed);
  const activeBlockers = preFlightChecks.filter((c) => !c.passed);

  // ─── 7. Interactive Position Sizing Calculator (Rules 3 & 4) ────────────────
  const [calcAsset, setCalcAsset] = useState<string>("BTC");
  const [entryPriceInput, setEntryPriceInput] = useState<string>("68430");
  const [stopLossInput, setStopLossInput] = useState<string>("67900");

  const calcResults = useMemo(() => {
    const entry = parseFloat(entryPriceInput) || 0;
    const sl = parseFloat(stopLossInput) || 0;
    const distance = Math.abs(entry - sl);
    const maxRisk = currentMaxRiskUSD;

    if (entry <= 0 || sl <= 0 || distance <= 0) {
      return { isValid: false, sizeUnits: 0, notionalUSD: 0, stopDistanceUSD: 0, stopDistancePct: 0 };
    }

    const sizeUnits = maxRisk / distance;
    const notionalUSD = sizeUnits * entry;
    const stopDistancePct = (distance / entry) * 100;

    return {
      isValid: true,
      sizeUnits: Number(sizeUnits.toFixed(4)),
      notionalUSD: Number(notionalUSD.toFixed(2)),
      stopDistanceUSD: Number(distance.toFixed(2)),
      stopDistancePct: Number(stopDistancePct.toFixed(2)),
    };
  }, [entryPriceInput, stopLossInput, currentMaxRiskUSD]);

  const handleAssetSelect = (asset: (typeof ALLOWED_ASSETS)[0]) => {
    setCalcAsset(asset.symbol);
    setEntryPriceInput(String(asset.defaultPrice));
    // Default SL 1% below entry
    setStopLossInput((asset.defaultPrice * 0.99).toFixed(2));
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ─── Top Master Gate Status Banner ─────────────────────────────────── */}
      <div
        className={`p-5 rounded-xl border transition-all ${
          canTradeNow
            ? "bg-emerald-950/25 border-emerald-500/40 text-emerald-300"
            : "bg-red-950/20 border-red-500/30 text-red-300"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                canTradeNow ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
              }`}
            >
              {canTradeNow ? <ShieldCheck size={26} /> : <ShieldAlert size={26} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    canTradeNow ? "bg-emerald-400" : "bg-red-500"
                  }`}
                />
                <h2 className="text-base md:text-lg font-bold tracking-tight text-white">
                  {canTradeNow
                    ? "PRE-FLIGHT GATE: PERMITTED TO TAKE A TRADE"
                    : "TRADE GATE LOCKED: NO POSITIONS ALLOWED"}
                </h2>
              </div>
              <p className="text-xs md:text-sm text-zinc-300 mt-1">
                {canTradeNow
                  ? "All 5 trading criteria satisfied: Market hours open, 0 open positions, 45m cooldown satisfied, daily circuit breaker safe."
                  : activeBlockers.map((b) => b.failReason).join(" · ")}
              </p>
            </div>
          </div>

          {/* Time & Session Clocks */}
          <div className="flex items-center gap-4 bg-zinc-900/80 px-4 py-2.5 rounded-lg border border-zinc-800 shrink-0 text-xs">
            <div className="space-y-0.5">
              <div className="text-zinc-500 font-mono text-[10px] uppercase">IST (Trading Zone)</div>
              <div className="font-mono text-zinc-200 font-medium">{currentISTString}</div>
            </div>
            <div className="w-px h-6 bg-zinc-800" />
            <div className="space-y-0.5">
              <div className="text-zinc-500 font-mono text-[10px] uppercase">EST (Reset Zone)</div>
              <div className="font-mono text-zinc-200 font-medium">{currentESTString}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Account Selector & Personal Dynamic Sizing Context ─────────────── */}
      <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-xs text-zinc-400 font-medium">Selected Account:</div>
          <div className="relative">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono rounded-md px-3 py-1.5 pr-8 appearance-none cursor-pointer focus:outline-none focus:border-zinc-500"
            >
              {accounts.map((acc) => (
                <option key={acc.accountId} value={acc.accountId}>
                  {formatAccountTag(acc.accountId)} — {acc.challengeName || "Starter Turbo"} ({acc.stage})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-zinc-400 pointer-events-none" />
          </div>

          <span
            className={`text-xs px-2 py-0.5 rounded font-mono ${
              is10k ? "bg-purple-950/60 text-purple-300 border border-purple-800/40" : "bg-blue-950/60 text-blue-300 border border-blue-800/40"
            }`}
          >
            {is10k ? "10K Turbo Tier" : "5K Turbo Tier"}
          </span>
        </div>

        {/* Dynamic Sizing Stats for Selected Account */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-zinc-500">Max Risk / Trade: </span>
            <span className="text-emerald-400 font-bold">${currentMaxRiskUSD.toFixed(2)}</span>
            {isTargetProtectionActive && (
              <span className="text-[10px] text-amber-400 ml-1">(De-risked)</span>
            )}
          </div>
          <div className="text-zinc-700">|</div>
          <div>
            <span className="text-zinc-500">Circuit Breaker: </span>
            <span className="text-zinc-200 font-bold">${circuitBreakerCeiling}</span>
            <span className="text-zinc-400 text-[11px] ml-1">(${lossRoomRemainingUSD.toFixed(2)} room)</span>
          </div>
          <div className="text-zinc-700">|</div>
          <div>
            <span className="text-zinc-500">Target Progress: </span>
            <span className={`font-bold ${profitPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {profitPercent >= 0 ? "+" : ""}
              {profitPercent.toFixed(2)}%
            </span>
            <span className="text-zinc-500 text-[10px] ml-1">/ 7.5% de-risk</span>
          </div>
        </div>
      </div>

      {/* ─── 4 Pre-Flight Gate Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {preFlightChecks.map((check) => (
          <div
            key={check.id}
            className={`p-4 rounded-xl border transition-all ${
              check.passed
                ? "bg-[var(--bg-surface)] border-[var(--border-primary)]"
                : "bg-red-950/10 border-red-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="font-mono text-[10px] text-zinc-500">RULE {check.ruleNum}</span>
              </div>
              {check.passed ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 size={13} />
                  <span>PASS</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium">
                  <XCircle size={13} />
                  <span>LOCKED</span>
                </span>
              )}
            </div>

            <div className="mt-2.5 font-medium text-sm text-zinc-100">{check.title}</div>
            <div className="mt-1 text-xs text-zinc-400 leading-relaxed">{check.description}</div>

            {check.failReason && (
              <div className="mt-3 text-[11px] text-red-300 font-mono bg-red-950/40 p-2 rounded border border-red-900/50">
                {check.failReason}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ─── Interactive Position Size & Sizing Calculator (Rules 3 & 4) ───── */}
      <div className="p-5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              Interactive Position Size & Risk Calculator (Rule 4 Enforced)
            </h3>
          </div>
          <div className="text-xs text-zinc-400 font-mono">
            Enforced Risk Ceiling: <span className="text-emerald-400 font-bold">${currentMaxRiskUSD.toFixed(2)}</span>
          </div>
        </div>

        {/* 6 Allowed Assets Quick Chips (Rule 3) */}
        <div>
          <div className="text-xs text-zinc-400 mb-2">
            Approved Assets (Rule 3 Whitelist — Click to load):
          </div>
          <div className="flex flex-wrap gap-2">
            {ALLOWED_ASSETS.map((asset) => {
              const isSelected = calcAsset === asset.symbol;
              return (
                <button
                  key={asset.symbol}
                  onClick={() => handleAssetSelect(asset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? "bg-cyan-950/60 border-cyan-500/50 text-cyan-200"
                      : "bg-zinc-800/70 border-zinc-700/60 text-zinc-300 hover:border-zinc-600 hover:text-white"
                  }`}
                >
                  <span className="font-bold">{asset.symbol}</span>
                  <span className="text-zinc-500 text-[10px]">(${asset.defaultPrice})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Calculator Inputs & Output Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Entry Price ($)</label>
            <input
              type="number"
              step="any"
              value={entryPriceInput}
              onChange={(e) => setEntryPriceInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
              placeholder="e.g. 68430"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Stop-Loss Price ($)</label>
            <input
              type="number"
              step="any"
              value={stopLossInput}
              onChange={(e) => setStopLossInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
              placeholder="e.g. 67900"
            />
          </div>

          {/* Sizing Output Box */}
          <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-1.5 font-mono text-xs">
            <div className="text-[10px] uppercase text-zinc-500">Calculated Position Sizing</div>
            {calcResults.isValid ? (
              <>
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Stop Distance:</span>
                  <span className="text-amber-400 font-medium">
                    ${calcResults.stopDistanceUSD} ({calcResults.stopDistancePct}%)
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Max Allowed Units:</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {calcResults.sizeUnits} {calcAsset}
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-400 text-[11px]">
                  <span>Notional Exposure:</span>
                  <span>${calcResults.notionalUSD.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
                  ✓ If stopped out, loss is exactly ${currentMaxRiskUSD.toFixed(2)} (Rule 4/6 compliant).
                </div>
              </>
            ) : (
              <div className="text-zinc-500 text-xs py-2">
                Enter valid entry and stop-loss prices to calculate permitted size.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Detailed 7 Rules Operational Matrix ────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">
          The 7 Personal Trading Rules — Operational Diagnostics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rule 1 Card */}
          <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-cyan-400" />
                <h4 className="text-sm font-semibold text-white">1. Trading Hours Window</h4>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                  isTradingHoursOpen
                    ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                    : "bg-red-950/60 text-red-300 border border-red-800/40"
                }`}
              >
                {isTradingHoursOpen ? "● Open" : "● Closed"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              <strong>Window:</strong> Monday 6:30 AM IST – Saturday 12:30 AM IST. Strictly zero trading outside this window.
            </p>
            <div className="pt-2 border-t border-zinc-800/80 text-xs font-mono flex justify-between text-zinc-400">
              <span>{nextWindowText}</span>
              <span className="text-zinc-200 font-bold">{sessionCountdown}</span>
            </div>
          </div>

          {/* Rule 2 Card */}
          <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                <h4 className="text-sm font-semibold text-white">2. Weekend Trading Restrictions</h4>
              </div>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                {isWeekend ? "Weekend Active" : "Weekday Normal"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No weekend trades until previous losses are recovered. After recovery, weekend trading allowed very rarely and only risking secured profits.
            </p>
            <div className="pt-2 border-t border-zinc-800/80 text-xs font-mono text-zinc-400">
              <span>Status: </span>
              <span className={profitPercent > 0 ? "text-amber-300" : "text-red-300"}>
                {weekendReason}
              </span>
            </div>
          </div>

          {/* Rule 3 Card */}
          <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-cyan-400" />
                <h4 className="text-sm font-semibold text-white">3. Allowed Assets Whitelist</h4>
              </div>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                6 Assets
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Trading is restricted exclusively to: <strong>Gold, BTC, NEAR, ENA, HYPE, ZEC</strong>. No other coins allowed.
            </p>
            <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap gap-1.5 text-xs font-mono">
              {ALLOWED_ASSETS.map((a) => (
                <span key={a.symbol} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700/60">
                  {a.symbol}
                </span>
              ))}
            </div>
          </div>

          {/* Rule 4 Card */}
          <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-cyan-400" />
                <h4 className="text-sm font-semibold text-white">4. Single-Trade Risk Limit</h4>
              </div>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                ${currentMaxRiskUSD} Max
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              <strong>5K Turbo:</strong> Maximum $30 risk per trade. <strong>10K Turbo:</strong> Maximum $50 risk per trade.
            </p>
            <div className="pt-2 border-t border-zinc-800/80 text-xs font-mono text-zinc-400 flex justify-between">
              <span>Account: {formatAccountTag(selectedAccount?.accountId)} ({is10k ? "10K" : "5K"})</span>
              <span className="text-emerald-400 font-bold">${currentMaxRiskUSD.toFixed(2)} Cap</span>
            </div>
          </div>

          {/* Rule 5 Card */}
          <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" />
                <h4 className="text-sm font-semibold text-white">5. Intraday Circuit Breaker</h4>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono ${
                  isCircuitBreakerTripped
                    ? "bg-red-950 text-red-300 border border-red-800"
                    : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                }`}
              >
                {isCircuitBreakerTripped ? "● Tripped" : "● Operational"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Trading must stop for the day when limit reached: <strong>5K: $75 loss</strong> | <strong>10K: $135 loss</strong>. Reset at 5:00 AM EST.
            </p>
            <div className="pt-2 border-t border-zinc-800/80 text-xs font-mono text-zinc-400 flex justify-between">
              <span>Daily Loss Room: <strong className="text-zinc-200">${lossRoomRemainingUSD.toFixed(2)}</strong></span>
              <span>Reset in: <strong className="text-zinc-300">{nextResetCountdown}</strong></span>
            </div>
          </div>

          {/* Rule 6 Card */}
          <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <h4 className="text-sm font-semibold text-white">6. Target Proximity De-Risking</h4>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono ${
                  isTargetProtectionActive
                    ? "bg-amber-950 text-amber-300 border border-amber-800"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {isTargetProtectionActive ? "ARMED (≥7.5%)" : "Standard"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Once 7.5% profit is reached, reduce risk to: <strong>5K: Max $25 loss</strong> | <strong>10K: Max $50 loss</strong>.
            </p>
            <div className="pt-2 border-t border-zinc-800/80 text-xs font-mono text-zinc-400 flex justify-between">
              <span>Current Profit: {profitPercent >= 0 ? "+" : ""}{profitPercent.toFixed(2)}%</span>
              <span className={isTargetProtectionActive ? "text-amber-400 font-bold" : "text-zinc-500"}>
                {isTargetProtectionActive ? "Risk reduced to $25/$50" : "Arms at +7.50%"}
              </span>
            </div>
          </div>
        </div>

        {/* Rule 7 Card (Full Width) */}
        <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-cyan-400" />
              <h4 className="text-sm font-semibold text-white">7. Parallel Trading & Discipline Protocol</h4>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded font-mono ${
                !hasParallelViolation && !isCooldownActive
                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                  : "bg-amber-950/60 text-amber-300 border border-amber-800/40"
              }`}
            >
              {openPositionsCount}/1 Open Trades
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
              <div className="text-zinc-400 font-medium">Single Position Rule</div>
              <div className="text-zinc-300 text-[11px]">Maximum 1 open trade across entire portfolio at any time.</div>
              <div className="pt-1 font-mono text-[11px]">
                {openPositionsCount === 0 ? (
                  <span className="text-emerald-400">✓ 0 active positions (Clear)</span>
                ) : (
                  <span className="text-red-400">⛔ {openPositionsCount} active trade open</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
              <div className="text-zinc-400 font-medium">45-Minute Cooldown Gap</div>
              <div className="text-zinc-300 text-[11px]">Maintain minimum 45-minute pause between trades.</div>
              <div className="pt-1 font-mono text-[11px]">
                {isCooldownActive ? (
                  <span className="text-amber-400">⏳ {cooldownRemainingText}</span>
                ) : (
                  <span className="text-emerald-400">✓ Cooldown satisfied (&gt;45m)</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
              <div className="text-zinc-400 font-medium">Anti-Revenge Principle</div>
              <div className="text-zinc-300 text-[11px]">
                Protect account first. No revenge trading, no overtrading, no increasing risk after losses.
              </div>
              <div className="pt-1 font-mono text-[11px] text-emerald-400">
                ✓ Policy enforced in terminal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
