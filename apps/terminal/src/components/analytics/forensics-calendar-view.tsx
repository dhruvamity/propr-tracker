"use client";

import React, { useState, useMemo } from "react";
import type { AccountSnapshot } from "@/lib/types";
import { isFunded, isEvaluation, isAccountFailed } from "@propr/data-model";
import { formatAccountTag } from "@/lib/utils";
import {
  groupMultiAccountTradesByDay,
  type DailyForensicsSummary,
} from "@/lib/forensics";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import Link from "next/link";
import { ForensicsCalendarGrid } from "./forensics-calendar-grid";
import { ForensicsDayDossier } from "./forensics-day-dossier";

interface ForensicsCalendarViewProps {
  accounts: AccountSnapshot[];
}

type AccountFilterScope = "ALL" | "FUNDED" | "EVALUATION" | "ARCHIVED";

export function ForensicsCalendarView({ accounts }: ForensicsCalendarViewProps) {
  // Account scope filter: defaults to ALL (mixes all entire past & active accounts)
  const [scopeFilter, setScopeFilter] = useState<AccountFilterScope>("ALL");
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  // Filter accounts based on selected scope
  const filteredAccounts = useMemo(() => {
    if (scopeFilter === "FUNDED") {
      return accounts.filter((a) => isFunded(a.stage));
    }
    if (scopeFilter === "EVALUATION") {
      return accounts.filter((a) => isEvaluation(a.stage));
    }
    if (scopeFilter === "ARCHIVED") {
      return accounts.filter((a) => isAccountFailed(a.stage));
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
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <Link href="/" className="hover:text-zinc-200 transition-colors">
              Terminal
            </Link>
            <span>/</span>
            <Link href="/analytics" className="hover:text-zinc-200 transition-colors">
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
            <span className="text-zinc-400 px-2 py-1 font-mono text-[11px] flex items-center gap-1">
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

      {/* ─── Month Navigation & High-Level Summary Grid ─── */}
      <ForensicsCalendarGrid
        monthName={monthName}
        handlePrevMonth={handlePrevMonth}
        handleNextMonth={handleNextMonth}
        handleJumpToLatest={handleJumpToLatest}
        activeAccountsCount={activeAccountsCount}
        totalPooledTrades={totalPooledTrades}
        monthSummary={monthSummary}
        calendarDays={calendarDays}
        selectedDateKey={selectedDateKey}
        setSelectedDateKey={setSelectedDateKey}
      />

      {/* ─── Selected Day Forensics Dossier ("The Daily Diagnostic") ─── */}
      <ForensicsDayDossier
        selectedDaySummary={selectedDaySummary || undefined}
        selectedDateKey={selectedDateKey}
        handlePrevDay={() => prevActiveDate && handleStepDay(prevActiveDate)}
        handleNextDay={() => nextActiveDate && handleStepDay(nextActiveDate)}
        selectedDayAccounts={selectedDayAccounts}
        expandedTradeId={expandedTradeId}
        setExpandedTradeId={setExpandedTradeId}
      />
    </div>
  );
}
