"use client";

import React from "react";
import { formatUSD } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from "lucide-react";
import type { DailyForensicsSummary } from "@/lib/forensics";

export interface CalendarCell {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  summary?: DailyForensicsSummary;
}

export interface ForensicsCalendarGridProps {
  monthName: string;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  handleJumpToLatest: () => void;
  activeAccountsCount: number;
  totalPooledTrades: number;
  monthSummary: {
    activeDays: number;
    flawlessDays: number;
    monthDiscipline: string;
    totalMonthViolationCost: number;
    totalMonthNetPnl: number;
  };
  calendarDays: CalendarCell[];
  selectedDateKey: string;
  setSelectedDateKey: (key: string) => void;
}

export function ForensicsCalendarGrid({
  monthName,
  handlePrevMonth,
  handleNextMonth,
  handleJumpToLatest,
  activeAccountsCount,
  totalPooledTrades,
  monthSummary,
  calendarDays,
  selectedDateKey,
  setSelectedDateKey,
}: ForensicsCalendarGridProps) {
  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Previous month"
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
            aria-label="Next month"
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
            <div className="text-zinc-400 text-[11px]">Accounts Active</div>
            <div className="font-mono font-bold text-zinc-200 text-sm flex items-center gap-1">
              <Layers size={13} className="text-cyan-400" />
              <span>{activeAccountsCount} accounts ({totalPooledTrades} fills)</span>
            </div>
          </div>
          <div>
            <div className="text-zinc-400 text-[11px]">Active Days</div>
            <div className="font-mono font-bold text-zinc-200 text-sm">
              {monthSummary.activeDays} days
            </div>
          </div>
          <div>
            <div className="text-zinc-400 text-[11px]">Flawless Days</div>
            <div className="font-mono font-bold text-emerald-400 text-sm flex items-center gap-1">
              <CheckCircle2 size={13} />
              <span>{monthSummary.flawlessDays} / {monthSummary.activeDays}</span>
            </div>
          </div>
          <div>
            <div className="text-zinc-400 text-[11px]">Discipline Score</div>
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
            <div className="text-zinc-400 text-[11px]">Violation Cost</div>
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
            <div className="text-zinc-400 text-[11px]">Portfolio Net P&L</div>
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
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center text-xs font-semibold text-zinc-400">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
              <div
                key={day}
                className={`py-1.5 rounded bg-zinc-900/40 border border-zinc-800/60 ${
                  idx >= 5 ? "text-amber-400/80 bg-amber-950/10" : ""
                }`}
              >
                <span>{day}</span>
                {idx >= 5 && (
                  <span className="block text-[11px] font-sans text-amber-400">
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
                      ? "border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200"
                      : "border-transparent bg-transparent text-zinc-400 opacity-40"
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
                            : "text-zinc-400"
                          : "text-zinc-400/50"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {hasTrades && (
                      <span className="text-[11px] font-mono text-zinc-400">
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
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-sans font-medium text-emerald-300 bg-emerald-950/70 border border-emerald-800/60">
                            <CheckCircle2 size={11} />
                            <span>100%</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-sans font-medium text-amber-300 bg-amber-950/80 border border-amber-800/70">
                            <AlertTriangle size={11} />
                            <span>{cell.summary?.disciplineScore}%</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ) : cell.isWeekend ? (
                    <div className="text-[11px] font-sans text-zinc-400 my-auto text-center">
                      Weekend Freeze
                    </div>
                  ) : (
                    <div className="my-auto text-center text-xs text-zinc-400 font-mono">
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
  );
}
