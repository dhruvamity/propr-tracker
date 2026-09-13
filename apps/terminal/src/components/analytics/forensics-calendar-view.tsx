"use client";

import React, { useState, useMemo } from "react";
import type { AccountSnapshot } from "@/lib/types";
import { formatUSD, formatAccountTag } from "@/lib/utils";
import {
  groupMultiAccountTradesByDay,
  type DailyForensicsSummary,
  type TaggedTrade,
} from "@/lib/forensics";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar as CalendarIcon,
  Layers,
  Filter,
} from "lucide-react";
import Link from "next/link";

interface ForensicsCalendarViewProps {
  accounts: AccountSnapshot[];
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type AccountFilterScope = "ALL" | "FUNDED" | "EVALUATION" | "ARCHIVED";

export function ForensicsCalendarView({ accounts }: ForensicsCalendarViewProps) {
  // Account scope filter: defaults to ALL (mixes all entire past & active accounts)
  const [scopeFilter, setScopeFilter] = useState<AccountFilterScope>("ALL");
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  // Filter accounts based on selected scope
  const filteredAccounts = useMemo(() => {
    if (scopeFilter === "FUNDED") {
      return accounts.filter((a) => a.stage === "FUNDED");
    }
    if (scopeFilter === "EVALUATION") {
      return accounts.filter((a) => a.stage === "EVALUATION");
    }
    if (scopeFilter === "ARCHIVED") {
      return accounts.filter(
        (a) => a.stage === "BREACHED" || a.stage === "FAILED" || a.stage === "CLOSED"
      );
    }
    return accounts;
  }, [accounts, scopeFilter]);

  // Total trade executions across all filtered accounts
  const totalPooledTrades = useMemo(() => {
    return filteredAccounts.reduce((sum, a) => sum + (a.trades || []).length, 0);
  }, [filteredAccounts]);

  const activeAccountsCount = useMemo(() => {
    return filteredAccounts.filter((a) => (a.trades || []).length > 0).length;
  }, [filteredAccounts]);

  // Group trades across ALL accounts into daily unified buckets
  const dailyMap: Map<string, DailyForensicsSummary> = useMemo(() => {
    return groupMultiAccountTradesByDay(filteredAccounts);
  }, [filteredAccounts]);

  // List of all active trading days sorted chronologically
  const sortedDayKeys = useMemo(() => {
    return Array.from(dailyMap.keys()).sort();
  }, [dailyMap]);

  // Initial selected date (latest trading day or today)
  const initialDateKey = useMemo(() => {
    if (sortedDayKeys.length > 0) {
      return sortedDayKeys[sortedDayKeys.length - 1];
    }
    return new Date().toISOString().slice(0, 10);
  }, [sortedDayKeys]);

  const [selectedDateKey, setSelectedDateKey] = useState<string>(initialDateKey);

  // Month navigation state: initialized to the month of initialDateKey
  const [viewYearMonth, setViewYearMonth] = useState<{ year: number; month: number }>(() => {
    const d = new Date(initialDateKey || Date.now());
    return {
      year: isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear(),
      month: isNaN(d.getMonth()) ? new Date().getMonth() : d.getMonth(),
    };
  });

  const handlePrevMonth = () => {
    setViewYearMonth((curr) => {
      if (curr.month === 0) return { year: curr.year - 1, month: 11 };
      return { year: curr.year, month: curr.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewYearMonth((curr) => {
      if (curr.month === 11) return { year: curr.year + 1, month: 0 };
      return { year: curr.year, month: curr.month + 1 };
    });
  };

  const handleJumpToLatest = () => {
    if (sortedDayKeys.length > 0) {
      const latest = sortedDayKeys[sortedDayKeys.length - 1];
      setSelectedDateKey(latest);
      const d = new Date(latest);
      setViewYearMonth({ year: d.getFullYear(), month: d.getMonth() });
    }
  };

  // Month metadata
  const monthName = new Date(viewYearMonth.year, viewYearMonth.month, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  // Calendar matrix days calculation
  const calendarDays = useMemo(() => {
    const { year, month } = viewYearMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday-based index: 0 = Monday, ..., 6 = Sunday
    const firstDayIndex = (firstDay.getDay() + 6) % 7;
    const totalDaysInMonth = lastDay.getDate();

    const days: Array<{
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isWeekend: boolean;
      summary?: DailyForensicsSummary;
    }> = [];

    // Leading padding days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDayNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, prevDayNum);
      const dateKey = prevDate.toISOString().slice(0, 10);
      const dayOfWeek = (prevDate.getDay() + 6) % 7;
      days.push({
        dateKey,
        dayNumber: prevDayNum,
        isCurrentMonth: false,
        isWeekend: dayOfWeek >= 5,
        summary: dailyMap.get(dateKey),
      });
    }

    // Days of current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const curDate = new Date(Date.UTC(year, month, d));
      const dateKey = curDate.toISOString().slice(0, 10);
      const dayOfWeek = (curDate.getUTCDay() + 6) % 7;
      days.push({
        dateKey,
        dayNumber: d,
        isCurrentMonth: true,
        isWeekend: dayOfWeek >= 5,
        summary: dailyMap.get(dateKey),
      });
    }

    // Trailing padding days to fill 7-column grid
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const nextDate = new Date(year, month + 1, i);
        const dateKey = nextDate.toISOString().slice(0, 10);
        const dayOfWeek = (nextDate.getDay() + 6) % 7;
        days.push({
          dateKey,
          dayNumber: i,
          isCurrentMonth: false,
          isWeekend: dayOfWeek >= 5,
          summary: dailyMap.get(dateKey),
        });
      }
    }

    return days;
  }, [viewYearMonth, dailyMap]);

  // Monthly summary stats for visible month
  const monthSummary = useMemo(() => {
    let activeDays = 0;
    let flawlessDays = 0;
    let totalMonthNetPnl = 0;
    let totalMonthViolations = 0;
    let totalMonthViolationCost = 0;

    for (const [key, day] of dailyMap.entries()) {
      const [y, m] = key.split("-").map(Number);
      if (y === viewYearMonth.year && m === viewYearMonth.month + 1) {
        activeDays++;
        if (day.isFlawless) flawlessDays++;
        totalMonthNetPnl += day.netPnl;
        totalMonthViolations += day.violationsCount;
        totalMonthViolationCost += day.costOfViolationsUSD;
      }
    }

    const monthDiscipline =
      activeDays > 0 ? ((flawlessDays / activeDays) * 100).toFixed(1) : "100.0";

    return {
      activeDays,
      flawlessDays,
      totalMonthNetPnl: Number(totalMonthNetPnl.toFixed(2)),
      totalMonthViolations,
      totalMonthViolationCost: Number(totalMonthViolationCost.toFixed(2)),
      monthDiscipline,
    };
  }, [dailyMap, viewYearMonth]);

  // Currently inspected day data
  const selectedDaySummary = useMemo(() => {
    return dailyMap.get(selectedDateKey) || null;
  }, [dailyMap, selectedDateKey]);

  // Unique accounts that traded on the selected day
  const selectedDayAccounts = useMemo(() => {
    if (!selectedDaySummary) return [];
    const set = new Set<string>();
    const list: Array<{ tag: string; tier?: string; stage?: string }> = [];
    for (const tt of selectedDaySummary.taggedTrades) {
      const tag = tt.accountTag || formatAccountTag(tt.trade.accountId);
      if (!set.has(tag)) {
        set.add(tag);
        list.push({ tag, tier: tt.accountTier, stage: tt.accountStage });
      }
    }
    return list;
  }, [selectedDaySummary]);

  // Navigation between active trading days
  const currentIndex = sortedDayKeys.indexOf(selectedDateKey);
  const prevActiveDate = currentIndex > 0 ? sortedDayKeys[currentIndex - 1] : null;
  const nextActiveDate =
    currentIndex !== -1 && currentIndex < sortedDayKeys.length - 1
      ? sortedDayKeys[currentIndex + 1]
      : null;

  const handleStepDay = (targetDateKey: string) => {
    setSelectedDateKey(targetDateKey);
    const d = new Date(targetDateKey);
    setViewYearMonth({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ─── Breadcrumb & Top Master Portfolio Controls ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Link href="/" className="hover:text-zinc-300 transition-colors">
              Terminal
            </Link>
            <span>/</span>
            <Link href="/analytics" className="hover:text-zinc-300 transition-colors">
              Analytics
            </Link>
            <span>/</span>
            <span className="text-[var(--cyan)] font-medium">Forensics Calendar</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="text-[var(--cyan)]" size={22} />
            <span>Master Trade Forensics & Discipline Calendar</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Unified cross-account execution history mixing all evaluations and funded accounts into a single calendar view.
          </p>
        </div>

        {/* Portfolio Scope Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-500 px-2 py-1 font-mono text-[11px] flex items-center gap-1">
              <Filter size={12} />
              Scope:
            </span>
            <button
              type="button"
              onClick={() => setScopeFilter("ALL")}
              className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                scopeFilter === "ALL"
                  ? "bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/40 font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All Accounts ({accounts.length})
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter("FUNDED")}
              className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                scopeFilter === "FUNDED"
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Funded Only
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter("EVALUATION")}
              className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                scopeFilter === "EVALUATION"
                  ? "bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Evaluation Only
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter("ARCHIVED")}
              className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                scopeFilter === "ARCHIVED"
                  ? "bg-amber-950/80 text-amber-300 border border-amber-700/60 font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Archived
            </button>
          </div>
        </div>
      </div>

      {/* ─── Month Navigation & High-Level Summary Card ─── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono min-w-[180px] text-center sm:text-left">
              {monthName}
            </h2>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={handleJumpToLatest}
              className="ml-2 px-2.5 py-1 text-xs font-mono rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
            >
              Latest Day
            </button>
          </div>

          {/* Monthly Aggregated Portfolio KPIs */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
            <div>
              <div className="text-zinc-500 text-[11px]">Accounts Active</div>
              <div className="font-mono font-bold text-zinc-200 text-sm flex items-center gap-1">
                <Layers size={13} className="text-cyan-400" />
                <span>{activeAccountsCount} accounts ({totalPooledTrades} fills)</span>
              </div>
            </div>
            <div>
              <div className="text-zinc-500 text-[11px]">Active Days</div>
              <div className="font-mono font-bold text-zinc-200 text-sm">
                {monthSummary.activeDays} days
              </div>
            </div>
            <div>
              <div className="text-zinc-500 text-[11px]">Flawless Days</div>
              <div className="font-mono font-bold text-emerald-400 text-sm flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>{monthSummary.flawlessDays} / {monthSummary.activeDays}</span>
              </div>
            </div>
            <div>
              <div className="text-zinc-500 text-[11px]">Discipline Score</div>
              <div
                className={`font-mono font-bold text-sm ${
                  Number(monthSummary.monthDiscipline) >= 90
                    ? "text-emerald-400"
                    : Number(monthSummary.monthDiscipline) >= 75
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {monthSummary.monthDiscipline}%
              </div>
            </div>
            <div>
              <div className="text-zinc-500 text-[11px]">Violation Cost</div>
              <div
                className={`font-mono font-bold text-sm ${
                  monthSummary.totalMonthViolationCost > 0 ? "text-red-400" : "text-zinc-300"
                }`}
              >
                {monthSummary.totalMonthViolationCost > 0
                  ? `-${formatUSD(monthSummary.totalMonthViolationCost)}`
                  : "$0.00"}
              </div>
            </div>
            <div>
              <div className="text-zinc-500 text-[11px]">Portfolio Net P&L</div>
              <div
                className={`font-mono font-bold text-sm ${
                  monthSummary.totalMonthNetPnl >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {monthSummary.totalMonthNetPnl >= 0
                  ? `+${formatUSD(monthSummary.totalMonthNetPnl)}`
                  : `-${formatUSD(Math.abs(monthSummary.totalMonthNetPnl))}`}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Interactive Calendar Grid ─── */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-mono font-medium text-zinc-400 pb-2">
              {WEEKDAYS.map((day, idx) => (
                <div
                  key={day}
                  className={`py-1.5 rounded bg-zinc-900/40 border border-zinc-800/60 ${
                    idx >= 5 ? "text-amber-400/80 bg-amber-950/10" : ""
                  }`}
                >
                  <span>{day}</span>
                  {idx >= 5 && (
                    <span className="block text-[9px] font-sans text-amber-500/70 uppercase tracking-tighter">
                      Freeze
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Calendar Day Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell) => {
                const isSelected = cell.dateKey === selectedDateKey;
                const hasTrades = !!cell.summary && cell.summary.totalTrades > 0;
                const isFlawless = cell.summary?.isFlawless;
                const netPnl = cell.summary?.netPnl || 0;

                return (
                  <div
                    key={cell.dateKey}
                    onClick={() => setSelectedDateKey(cell.dateKey)}
                    className={`min-h-[92px] p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-[var(--cyan)] bg-cyan-950/20 ring-1 ring-[var(--cyan)] shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                        : hasTrades
                        ? "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-zinc-700"
                        : cell.isCurrentMonth
                        ? "border-zinc-900 bg-zinc-950/40 text-zinc-600 hover:border-zinc-800 hover:text-zinc-400"
                        : "border-transparent bg-transparent text-zinc-700 opacity-40"
                    } ${cell.isWeekend && !hasTrades ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(245,158,11,0.03)_6px,rgba(245,158,11,0.03)_12px)]" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-mono font-semibold ${
                          isSelected
                            ? "text-[var(--cyan)]"
                            : cell.isCurrentMonth
                            ? hasTrades
                              ? "text-zinc-200"
                              : "text-zinc-500"
                            : "text-zinc-700"
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {hasTrades && (
                        <span className="text-[10px] font-mono text-zinc-500">
                          {cell.summary?.totalTrades}t
                        </span>
                      )}
                    </div>

                    {hasTrades ? (
                      <div className="space-y-1 my-auto">
                        <div
                          className={`font-mono text-xs font-bold ${
                            netPnl >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {netPnl >= 0
                            ? `+${formatUSD(netPnl)}`
                            : `-${formatUSD(Math.abs(netPnl))}`}
                        </div>

                        {/* Discipline Health Pill */}
                        <div className="flex items-center gap-1">
                          {isFlawless ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium text-emerald-300 bg-emerald-950/70 border border-emerald-800/60">
                              <CheckCircle2 size={9} />
                              <span>100%</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-800/70">
                              <AlertTriangle size={9} />
                              <span>{cell.summary?.disciplineScore}%</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ) : cell.isWeekend ? (
                      <div className="text-[9px] font-mono text-zinc-600 my-auto text-center">
                        Weekend Freeze
                      </div>
                    ) : (
                      <div className="my-auto text-center text-[10px] text-zinc-700 font-mono">
                        —
                      </div>
                    )}

                    <div className="text-right">
                      {isSelected && (
                        <div className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--cyan)]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Selected Day Forensics Dossier ("The Daily Diagnostic") ─── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 md:p-6 space-y-5">
        {/* Dossier Header & Day Steppers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[var(--cyan)]">
              <CalendarIcon size={20} />
            </div>
            <div>
              <div className="text-xs text-zinc-500 font-mono">Unified Trading Day Diagnostic</div>
              <h3 className="text-lg font-bold text-zinc-100 font-sans">
                {selectedDaySummary?.dateLabel || selectedDateKey}
              </h3>
              {selectedDayAccounts.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-400">
                  <span className="text-[11px] text-zinc-500">Accounts Active:</span>
                  {selectedDayAccounts.map((a, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700"
                    >
                      {a.tag} {a.tier && `· ${a.tier}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Previous / Next Active Day Jumpers */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!prevActiveDate}
              onClick={() => prevActiveDate && handleStepDay(prevActiveDate)}
              className="px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-mono text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Prev Active Day</span>
            </button>
            <button
              type="button"
              disabled={!nextActiveDate}
              onClick={() => nextActiveDate && handleStepDay(nextActiveDate)}
              className="px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-mono text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next Active Day</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {selectedDaySummary ? (
          <div className="space-y-6">
            {/* 1. Daily Protocol Verdict Banner */}
            {selectedDaySummary.isFlawless ? (
              <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-800/60 flex items-start sm:items-center gap-3">
                <ShieldCheck size={24} className="text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <div className="text-sm font-semibold text-emerald-300 font-sans flex items-center gap-2">
                    <span>FLAWLESS PROTOCOL EXECUTION (100% DISCIPLINE)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-900/80 text-emerald-200 border border-emerald-700/60 uppercase">
                      Pass
                    </span>
                  </div>
                  <div className="text-xs text-emerald-400/80 mt-0.5">
                    All {selectedDaySummary.totalTrades} executions across all active accounts adhered strictly to approved assets, stop-loss caps, and cooldown windows.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-red-950/30 border border-red-800/60 flex items-start sm:items-center gap-3">
                <ShieldAlert size={24} className="text-red-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <div className="text-sm font-semibold text-red-300 font-sans flex items-center gap-2">
                    <span>PROTOCOL BREACH DETECTED ({selectedDaySummary.violationsCount} VIOLATIONS)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-900/80 text-red-200 border border-red-700/60 uppercase">
                      Score: {selectedDaySummary.disciplineScore}%
                    </span>
                  </div>
                  <div className="text-xs text-red-400/80 mt-0.5">
                    Rule violations on this day caused{" "}
                    <strong className="text-white">
                      -{formatUSD(selectedDaySummary.costOfViolationsUSD)}
                    </strong>{" "}
                    in avoidable trading losses.
                  </div>
                </div>
              </div>
            )}

            {/* 2. Key Daily Metrics (4-Card Grid) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/80 space-y-1">
                <div className="text-xs text-zinc-400">Day Portfolio Net P&L</div>
                <div
                  className={`text-2xl font-mono font-bold tracking-tight ${
                    selectedDaySummary.netPnl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {selectedDaySummary.netPnl >= 0
                    ? `+${formatUSD(selectedDaySummary.netPnl)}`
                    : `-${formatUSD(Math.abs(selectedDaySummary.netPnl))}`}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  Gross: {formatUSD(selectedDaySummary.grossPnl)} · Fees: -{formatUSD(selectedDaySummary.fees)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/80 space-y-1">
                <div className="text-xs text-zinc-400">Day Discipline Score</div>
                <div
                  className={`text-2xl font-mono font-bold tracking-tight ${
                    selectedDaySummary.disciplineScore >= 90
                      ? "text-emerald-400"
                      : selectedDaySummary.disciplineScore >= 75
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {selectedDaySummary.disciplineScore.toFixed(1)}%
                </div>
                <div className="text-[11px] text-zinc-500">
                  {selectedDaySummary.taggedTrades.filter((t) => t.isCompliant).length} of{" "}
                  {selectedDaySummary.totalTrades} compliant trades
                </div>
              </div>

              <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/80 space-y-1">
                <div className="text-xs text-zinc-400">Cost of Violations</div>
                <div
                  className={`text-2xl font-mono font-bold tracking-tight ${
                    selectedDaySummary.costOfViolationsUSD > 0 ? "text-red-400" : "text-zinc-200"
                  }`}
                >
                  {selectedDaySummary.costOfViolationsUSD > 0
                    ? `-${formatUSD(selectedDaySummary.costOfViolationsUSD)}`
                    : "$0.00"}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Direct rule breach net loss
                </div>
              </div>

              <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/80 space-y-1">
                <div className="text-xs text-zinc-400">Win Rate & Volume</div>
                <div className="text-2xl font-mono font-bold text-white tracking-tight">
                  {selectedDaySummary.winRate.toFixed(0)}%
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  {selectedDaySummary.winningTrades}W / {selectedDaySummary.losingTrades}L ·{" "}
                  {selectedDaySummary.totalTrades} total fills
                </div>
              </div>
            </div>

            {/* 3. Daily Protocol Verification Checklist */}
            <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-3">
              <div className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                Daily Execution Protocol Checklist (Cross-Account)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Rule 1: Approved Whitelist */}
                <div className="p-3 rounded bg-zinc-950/60 border border-zinc-800/70 flex items-start gap-2.5">
                  {selectedDaySummary.checklist.whitelistApproved ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-zinc-200">Asset Whitelist</div>
                    <div className="text-[11px] text-zinc-500">
                      {selectedDaySummary.checklist.whitelistApproved
                        ? "All fills in approved assets"
                        : "Trade on unapproved symbol"}
                    </div>
                  </div>
                </div>

                {/* Rule 2: Single-Trade Risk Cap */}
                <div className="p-3 rounded bg-zinc-950/60 border border-zinc-800/70 flex items-start gap-2.5">
                  {selectedDaySummary.checklist.riskCapRespected ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-zinc-200">Risk Limit Cap</div>
                    <div className="text-[11px] text-zinc-500">
                      {selectedDaySummary.checklist.riskCapRespected
                        ? "No trade loss exceeded cap"
                        : "Over-risk violation recorded"}
                    </div>
                  </div>
                </div>

                {/* Rule 3: 45-Min Cooldown Gate */}
                <div className="p-3 rounded bg-zinc-950/60 border border-zinc-800/70 flex items-start gap-2.5">
                  {selectedDaySummary.checklist.cooldownObserved ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-zinc-200">45-Min Cooldown</div>
                    <div className="text-[11px] text-zinc-500">
                      {selectedDaySummary.checklist.cooldownObserved
                        ? "Proper reset observed"
                        : "Entered within 45m of loss"}
                    </div>
                  </div>
                </div>

                {/* Rule 4: Weekend Freeze */}
                <div className="p-3 rounded bg-zinc-950/60 border border-zinc-800/70 flex items-start gap-2.5">
                  {selectedDaySummary.checklist.weekendFreezeRespected ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-zinc-200">Weekend Freeze</div>
                    <div className="text-[11px] text-zinc-500">
                      {selectedDaySummary.checklist.weekendFreezeRespected
                        ? "Zero weekend freeze trades"
                        : "Executed during freeze"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Chronological Executions Table for Selected Day */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-zinc-200">
                  Itemized Executions for this Day ({selectedDaySummary.taggedTrades.length} Trades across {selectedDayAccounts.length} Accounts)
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                  Mixed chronological sequence
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-sans text-xs">
                      <th className="py-2.5 px-3 w-8 font-normal">#</th>
                      <th className="py-2.5 px-3 font-normal">Time (UTC / IST)</th>
                      <th className="py-2.5 px-3 font-normal">Account</th>
                      <th className="py-2.5 px-3 font-normal">Asset</th>
                      <th className="py-2.5 px-3 font-normal">Side</th>
                      <th className="py-2.5 px-3 text-right font-normal">Quantity</th>
                      <th className="py-2.5 px-3 text-right font-normal">Price</th>
                      <th className="py-2.5 px-3 text-right font-normal">Net P&L</th>
                      <th className="py-2.5 px-3 font-normal">Discipline Audit</th>
                      <th className="py-2.5 px-3 text-center font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/20 font-mono text-xs">
                    {selectedDaySummary.taggedTrades.map((tt: TaggedTrade, idx: number) => {
                      const trade = tt.trade;
                      const isExpanded = expandedTradeId === trade.tradeId;
                      const rPnl = Number(trade.realizedPnl || 0);
                      const fee = Number(trade.fee || 0);
                      const net = rPnl - fee;
                      const isWin = net >= 0;
                      const dObj = new Date(trade.executedAt);
                      const timeUtc = dObj.toISOString().slice(11, 16) + " UTC";
                      const timeIst =
                        dObj.toLocaleTimeString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }) + " IST";

                      return (
                        <React.Fragment key={trade.tradeId || idx}>
                          <tr
                            onClick={() =>
                              setExpandedTradeId(isExpanded ? null : trade.tradeId)
                            }
                            className="hover:bg-zinc-800/30 cursor-pointer transition-colors"
                          >
                            <td className="py-2.5 px-3 text-zinc-500 text-xs">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-300 text-xs">
                              <span>{timeUtc}</span>
                              <span className="text-zinc-500 ml-1.5 text-[11px]">({timeIst})</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold border border-zinc-700">
                                  {tt.accountTag || formatAccountTag(trade.accountId)}
                                </span>
                                {tt.accountTier && (
                                  <span className="text-[11px] text-zinc-400 font-medium">
                                    {tt.accountTier}
                                  </span>
                                )}
                                {tt.accountStage && (
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-sans uppercase font-medium ${
                                      tt.accountStage === "FUNDED"
                                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                                        : tt.accountStage === "EVALUATION"
                                        ? "bg-cyan-950 text-cyan-400 border border-cyan-800/40"
                                        : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                                    }`}
                                  >
                                    {tt.accountStage}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-white font-sans">
                              {trade.asset}
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <span
                                className={`text-xs font-medium ${
                                  trade.side === "buy" || trade.positionSide === "long"
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {trade.side?.toLowerCase() === "buy" || trade.positionSide === "long" ? "Buy" : "Sell"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-zinc-200">
                              {trade.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right text-zinc-200">
                              {formatUSD(trade.price)}
                            </td>
                            <td
                              className={`py-2.5 px-3 text-right font-bold ${
                                isWin ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {isWin ? `+${formatUSD(net)}` : `-${formatUSD(Math.abs(net))}`}
                            </td>
                            <td className="py-2.5 px-3">
                              {tt.violations.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {tt.violations.map((v, vIdx) => (
                                    <span
                                      key={vIdx}
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                                        v.severity === "critical"
                                          ? "bg-red-950/80 text-red-400 border border-red-800/50"
                                          : "bg-amber-950/80 text-amber-400 border border-amber-800/50"
                                      }`}
                                      title={v.description}
                                    >
                                      <AlertTriangle size={10} />
                                      {v.label}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/30">
                                  <CheckCircle2 size={10} />
                                  Clean
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                  isWin
                                    ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/50"
                                    : "bg-red-950/70 text-red-400 border border-red-800/50"
                                }`}
                              >
                                {isWin ? "Win" : "Loss"}
                              </span>
                            </td>
                          </tr>

                          {/* Expanded Trade Detail */}
                          {isExpanded && (
                            <tr className="bg-zinc-900/40 border-b border-zinc-800">
                              <td colSpan={10} className="p-4 space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-sans">
                                  <div>
                                    <span className="text-zinc-500 block">Trade ID</span>
                                    <span className="font-mono text-zinc-300 select-all">
                                      {trade.tradeId}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block">Account</span>
                                    <span className="font-mono text-zinc-300 select-all">
                                      {tt.accountName || tt.accountTag} ({tt.accountId || trade.accountId})
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block">Notional Value</span>
                                    <span className="font-mono text-zinc-300">
                                      {formatUSD(trade.quoteQuantity)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block">Exchange</span>
                                    <span className="font-mono text-zinc-300 capitalize">
                                      {trade.exchange || "Hyperliquid"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block">Fee Paid</span>
                                    <span className="font-mono text-zinc-400">
                                      -${formatUSD(fee)}
                                    </span>
                                  </div>
                                </div>

                                {tt.violations.length > 0 ? (
                                  <div className="p-3 rounded bg-red-950/25 border border-red-900/40 space-y-1 text-xs">
                                    <div className="font-semibold text-red-400 flex items-center gap-1.5">
                                      <AlertTriangle size={13} />
                                      <span>Forensic Rule Breaches Detected ({tt.violations.length})</span>
                                    </div>
                                    {tt.violations.map((v, vI) => (
                                      <div key={vI} className="text-zinc-300 text-[11px] flex justify-between gap-2">
                                        <span>• {v.description}</span>
                                        {v.costUSD > 0 && (
                                          <span className="font-mono text-red-400 font-medium">
                                            Cost: -{formatUSD(v.costUSD)}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-900/30 flex items-center gap-2 text-xs text-emerald-400">
                                    <CheckCircle2 size={13} />
                                    <span>Zero violations: Executed within approved whitelist, sizing limits, and cooldown timer.</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-zinc-500 space-y-2">
            <CalendarIcon size={32} className="mx-auto text-zinc-600 opacity-60" />
            <div className="text-sm text-zinc-400">No trading activity on {selectedDateKey}.</div>
            <div className="text-xs text-zinc-600">
              Click any highlighted calendar date above to inspect that day&apos;s metrics and forensics.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
