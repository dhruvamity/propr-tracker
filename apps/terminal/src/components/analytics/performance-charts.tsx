"use client";

import React from "react";
import { formatUSD } from "@/lib/utils";

export interface DailyPnlItem {
  date: string;
  pnl: number;
  tradesCount: number;
}

interface DailyPnlChartProps {
  dailyData: DailyPnlItem[];
  height?: number;
}

export function DailyPnlChart({ dailyData, height = 176 }: DailyPnlChartProps) {
  if (dailyData.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-zinc-500 font-sans">
        No daily trade history available for this account.
      </div>
    );
  }

  const maxAbs = Math.max(10, ...dailyData.map((d) => Math.abs(d.pnl)));

  return (
    <div className="space-y-2">
      <div style={{ height }} className="flex items-end gap-3 pt-6 pb-2 px-2 border-b border-zinc-800">
        {dailyData.map((item, idx) => {
          const isPos = item.pnl >= 0;
          const heightPct = Math.max(8, (Math.abs(item.pnl) / maxAbs) * 100);

          return (
            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              {/* Tooltip */}
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-[11px] font-mono whitespace-nowrap z-10">
                <span className={isPos ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                  {isPos ? `+${formatUSD(item.pnl)}` : `-${formatUSD(Math.abs(item.pnl))}`}
                </span>
                <span className="text-zinc-500 ml-1">({item.tradesCount}t)</span>
              </div>

              {/* Bar */}
              <div
                className={`w-full max-w-[36px] rounded-t transition-all duration-300 ${
                  isPos ? "bg-emerald-500 hover:bg-emerald-400" : "bg-red-500 hover:bg-red-400"
                }`}
                style={{ height: `${heightPct}%` }}
              />

              {/* Date Label */}
              <div className="text-[11px] font-sans text-zinc-400 mt-1.5 truncate">
                {item.date}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DurationAndWeekdayProps {
  weekdayPnl: { day: string; pnl: number }[];
  durationBuckets: { range: string; count: number }[];
}

export function DurationAndWeekdayCharts({
  weekdayPnl,
  durationBuckets,
}: DurationAndWeekdayProps) {
  const maxDayAbs = Math.max(10, ...weekdayPnl.map((d) => Math.abs(d.pnl)));
  const maxDur = Math.max(1, ...durationBuckets.map((d) => d.count));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Trade Duration */}
      <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3 font-sans">
        <h3 className="text-xs font-semibold text-zinc-200">
          Trade Duration
        </h3>
        <div className="h-32 flex items-end gap-2 pt-4 border-b border-zinc-800">
          {durationBuckets.map((bucket, idx) => {
            const hPct = Math.max(4, (bucket.count / maxDur) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div className="absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[10px] font-mono text-zinc-300">
                  {bucket.count}
                </div>
                <div
                  className="w-full max-w-[28px] rounded-t bg-emerald-500/80 hover:bg-emerald-400 transition-all"
                  style={{ height: `${hPct}%` }}
                />
                <span className="text-[10px] text-zinc-400 mt-1 truncate">{bucket.range}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* P&L by Day of Week */}
      <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3 font-sans">
        <h3 className="text-xs font-semibold text-zinc-200">
          P&L by Day of Week
        </h3>
        <div className="h-32 flex items-end gap-2 pt-4 border-b border-zinc-800">
          {weekdayPnl.map((day, idx) => {
            const isPos = day.pnl >= 0;
            const hPct = Math.max(4, (Math.abs(day.pnl) / maxDayAbs) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div className="absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[10px] font-mono text-zinc-300 whitespace-nowrap">
                  {isPos ? `+${formatUSD(day.pnl)}` : `-${formatUSD(Math.abs(day.pnl))}`}
                </div>
                <div
                  className={`w-full max-w-[28px] rounded-t transition-all ${
                    isPos ? "bg-emerald-500/80 hover:bg-emerald-400" : "bg-red-500/80 hover:bg-red-400"
                  }`}
                  style={{ height: `${hPct}%` }}
                />
                <span className="text-[10px] text-zinc-400 mt-1 truncate">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
