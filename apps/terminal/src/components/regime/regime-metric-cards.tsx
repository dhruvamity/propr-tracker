"use client";

import React from "react";
import { Activity, TrendingUp, ShieldAlert, Clock, HelpCircle } from "lucide-react";
import { Reading, Condition, CONDITION_CONFIG } from "./regime-types";
import { Card } from "@/components/ui/card";
import { MetricValue } from "@/components/ui/metric-value";
import { cn } from "@/lib/utils";

interface RegimeMetricCardsProps {
  primary: Reading | null;
  chartRange: "24h" | "48h";
  stats: {
    deadPct: number;
    trendPct: number;
    chopPct: number;
    grindPct: number;
    streakText: string;
  };
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center ml-1.5 align-middle cursor-help select-none">
      <HelpCircle size={12} className="text-[var(--text-secondary)] group-hover:text-white transition-colors" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-primary)] text-xs text-[var(--text-secondary)] font-sans font-normal opacity-0 group-hover:opacity-100 transition-opacity shadow-xl z-50 leading-relaxed">
        {text}
      </span>
    </span>
  );
}

export function RegimeMetricCards({
  primary,
  chartRange,
  stats,
}: RegimeMetricCardsProps) {
  const activeCondition: Condition = primary?.label ?? "DEAD";
  const activeMeta = CONDITION_CONFIG[activeCondition];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Volatility Pulse */}
      <Card spacing="1.5">
        <div className="text-xs text-[var(--text-secondary)] font-medium flex items-center justify-between font-sans">
          <div className="flex items-center gap-1.5">
            <Activity size={13} className="text-[var(--text-secondary)]" />
            <span>Volatility Pulse</span>
          </div>
          <Tooltip text="Current 60-minute True Range compared to weekly norms. ≥50% indicates active range expansion." />
        </div>
        <div className="flex items-baseline justify-between font-mono">
          <MetricValue
            value={primary ? `${Math.round(primary.activity)}%` : "—"}
            tone="default"
            size="2xl"
          />
          <span className="text-xs text-[var(--text-secondary)]">
            {(primary?.activity ?? 0) >= 50 ? "Active range" : "Depressed"}
          </span>
        </div>
        {/* Visual Gauge */}
        <div className="relative w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-[var(--green)] transition-all duration-300"
            style={{ width: `${Math.min(100, primary?.activity ?? 0)}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/70"
            style={{ left: "50%" }}
            title="50% Median Cutoff"
          />
        </div>
      </Card>

      {/* Card 2: Direction Strength */}
      <Card spacing="1.5">
        <div className="text-xs text-[var(--text-secondary)] font-medium flex items-center justify-between font-sans">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={13} className="text-[var(--text-secondary)]" />
            <span>Direction Strength</span>
          </div>
          <Tooltip text="Directional efficiency: net price move divided by total absolute move over 12 bars. ≥50% indicates clean directional flow." />
        </div>
        <div className="flex items-baseline justify-between font-mono">
          <MetricValue
            value={primary ? `${Math.round(primary.persistence)}%` : "—"}
            tone="default"
            size="2xl"
          />
          <span className="text-xs text-[var(--text-secondary)]">
            {(primary?.persistence ?? 0) >= 50 ? "Clean trend" : "Whippy"}
          </span>
        </div>
        {/* Visual Gauge */}
        <div className="relative w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-[var(--cyan)] transition-all duration-300"
            style={{ width: `${Math.min(100, primary?.persistence ?? 0)}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/70"
            style={{ left: "50%" }}
            title="50% Direction Cutoff"
          />
        </div>
      </Card>

      {/* Card 3: Dormant Ratio */}
      <Card spacing="1.5">
        <div className="text-xs text-[var(--text-secondary)] font-medium flex items-center justify-between font-sans">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={13} className="text-[var(--text-secondary)]" />
            <span>{chartRange.toUpperCase()} Dormant Ratio</span>
          </div>
          <Tooltip text={`Percentage of time Bitcoin spent in DEAD (flatline) mode over the last ${chartRange}.`} />
        </div>
        <div className="flex items-baseline justify-between font-mono">
          <MetricValue
            value={`${stats.deadPct}%`}
            tone="muted"
            size="2xl"
          />
          <span className="text-xs text-[var(--text-secondary)]">Flatlined</span>
        </div>
        <div className="text-[11px] font-mono text-[var(--text-secondary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
          <span>Trend: <strong className="text-[var(--green)]">{stats.trendPct}%</strong></span>
          <span>Chop: <strong className="text-[var(--amber)]">{stats.chopPct}%</strong></span>
          <span>Drift: <strong className="text-[var(--cyan)]">{stats.grindPct}%</strong></span>
        </div>
      </Card>

      {/* Card 4: Current Streak */}
      <Card spacing="1.5">
        <div className="text-xs text-[var(--text-secondary)] font-medium flex items-center justify-between font-sans">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-[var(--text-secondary)]" />
            <span>Current Streak</span>
          </div>
          <Tooltip text="Continuous uninterrupted duration in current condition." />
        </div>
        <div className="flex items-baseline justify-between font-mono">
          <MetricValue
            value={stats.streakText.split("for")[1]?.trim() ?? "—"}
            tone="default"
            size="2xl"
          />
          <span className={cn("text-xs font-semibold", activeMeta.textColor)}>
            {activeMeta.name}
          </span>
        </div>
        <div className="text-[11px] font-sans text-[var(--text-secondary)] pt-1 border-t border-[var(--border-subtle)]">
          Updated on every 5m closed bar
        </div>
      </Card>
    </div>
  );
}
