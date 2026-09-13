"use client";

import React from "react";
import { Radio, HelpCircle } from "lucide-react";
import { Condition, Reading, CONDITION_CONFIG, Interval } from "./regime-types";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

interface RegimeDecisionBannerProps {
  primary: Reading | null;
  readings: Record<Interval, Reading | null>;
  streakText: string;
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

export function RegimeDecisionBanner({
  primary,
  readings,
  streakText,
}: RegimeDecisionBannerProps) {
  const activeCondition: Condition = primary?.label ?? "DEAD";
  const activeMeta = CONDITION_CONFIG[activeCondition];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Decision Banner (2 Columns) */}
      <div className="lg:col-span-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium font-sans">
              <Radio size={14} className="text-[var(--text-secondary)]" />
              <span>Current Market State</span>
              <Tooltip text="Evaluates 5-minute volatility and directional persistence against the rolling 7-day market distribution." />
            </div>
            <StatusBadge
              label={activeMeta.tag}
              tone={activeMeta.badgeTone}
            />
          </div>

          <div className="mt-2">
            <h2 className={cn("text-2xl sm:text-3xl font-bold font-sans tracking-tight", activeMeta.textColor)}>
              {activeMeta.name}
            </h2>
            <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed font-sans max-w-xl">
              {activeMeta.action}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono">
          <span>Streak: <strong className="text-white">{streakText}</strong></span>
          <span>Evaluated on 5m closed bar</span>
        </div>
      </div>

      {/* Timeframe Confirmation Matrix (1 Column) */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
            <span>Timeframe Alignment</span>
            <Tooltip text="Checks whether intermediate (15m) and structural (1h) timeframes agree with the 5m direction. Alignment across all 3 timeframes yields optimal continuation setups." />
          </h3>
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-xs font-sans text-[var(--text-secondary)]">5m Execution</span>
            <StatusBadge
              label={primary?.label ?? "Syncing"}
              tone={primary ? CONDITION_CONFIG[primary.label].badgeTone : "neutral"}
            />
          </div>
          <div className="flex items-center justify-between p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-xs font-sans text-[var(--text-secondary)]">15m Trend</span>
            <StatusBadge
              label={readings["15m"]?.label ?? "Syncing"}
              tone={readings["15m"] ? CONDITION_CONFIG[readings["15m"]!.label].badgeTone : "neutral"}
            />
          </div>
          <div className="flex items-center justify-between p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-xs font-sans text-[var(--text-secondary)]">1h Macro</span>
            <StatusBadge
              label={readings["1h"]?.label ?? "Syncing"}
              tone={readings["1h"] ? CONDITION_CONFIG[readings["1h"]!.label].badgeTone : "neutral"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
