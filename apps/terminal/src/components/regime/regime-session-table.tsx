"use client";

import React from "react";
import { Baseline } from "./regime-types";
import {
  TableContainer,
  TableHeaderRow,
  TableHeaderCell,
  TableBody,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface RegimeSessionTableProps {
  baseline: Baseline;
}

export function RegimeSessionTable({ baseline }: RegimeSessionTableProps) {
  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-white">
          Intraday Session Performance (Historical Reference)
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Discrete 15m trend continuation entries with 1.2× ATR risk and 2R profit target.
        </p>
      </div>

      <TableContainer>
        <thead>
          <TableHeaderRow>
            <TableHeaderCell align="left">Session Window</TableHeaderCell>
            <TableHeaderCell align="right">Samples (N)</TableHeaderCell>
            <TableHeaderCell align="right">Median Return (R)</TableHeaderCell>
            <TableHeaderCell align="right">2R Target Hit Rate</TableHeaderCell>
          </TableHeaderRow>
        </thead>
        <TableBody>
          {baseline.sessions.slice(0, 5).map((row) => (
            <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
              <td className="py-2.5 px-3 font-sans text-white">
                <span>{row.name}</span>
                {row.samples < 15 && (
                  <span className="text-[var(--text-muted)] text-[11px] ml-1.5 font-mono">
                    (small sample)
                  </span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-[var(--text-secondary)]">
                {row.samples}
              </td>
              <td
                className={cn(
                  "py-2.5 px-3 text-right font-mono font-semibold",
                  row.medianOutcomeR >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                )}
              >
                {row.medianOutcomeR >= 0
                  ? `+${row.medianOutcomeR.toFixed(2)} R`
                  : `${row.medianOutcomeR.toFixed(2)} R`}
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-white font-medium">
                {(row.hit2R * 100).toFixed(0)}%
              </td>
            </tr>
          ))}
        </TableBody>
      </TableContainer>

      <p className="text-[11px] text-[var(--text-secondary)] font-sans">
        * Note: Sample size per session bucket is modest (n &lt; 15). Rankings serve as historical reference rather than standalone trade triggers.
      </p>
    </div>
  );
}
