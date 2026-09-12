"use client";

import React, { useState, useMemo } from "react";
import { formatUSD } from "@/lib/utils";

export interface DataPoint {
  timestamp: string;
  equity: number;
  drawdownPct?: number;
  label: string;
}

interface EquityCurveChartProps {
  dataPoints: DataPoint[];
  startingBalance: number;
  breachFloor: number;
  dailyLossFloor: number;
  height?: number;
}

export function EquityCurveChart({
  dataPoints,
  startingBalance,
  breachFloor,
  dailyLossFloor,
  height = 320,
}: EquityCurveChartProps) {
  const [chartMode, setChartMode] = useState<"EQUITY" | "DRAWDOWN">("EQUITY");
  const [timeFilter, setTimeFilter] = useState<"24H" | "7D" | "30D" | "ALL">("ALL");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Filter data by time range
  const filteredData = useMemo(() => {
    if (dataPoints.length <= 1) return dataPoints;
    const now = Date.now();
    let cutoff = 0;
    if (timeFilter === "24H") cutoff = now - 24 * 60 * 60 * 1000;
    else if (timeFilter === "7D") cutoff = now - 7 * 24 * 60 * 60 * 1000;
    else if (timeFilter === "30D") cutoff = now - 30 * 24 * 60 * 60 * 1000;

    if (cutoff === 0) return dataPoints;
    const res = dataPoints.filter((pt) => new Date(pt.timestamp).getTime() >= cutoff);
    return res.length > 0 ? res : dataPoints;
  }, [dataPoints, timeFilter]);

  // Compute bounds
  const { minVal, maxVal, points } = useMemo(() => {
    if (filteredData.length === 0) {
      return { minVal: breachFloor, maxVal: startingBalance * 1.05, points: [] };
    }

    const values = filteredData.map((d) => (chartMode === "EQUITY" ? d.equity : d.drawdownPct || 0));
    let min = Math.min(...values, chartMode === "EQUITY" ? breachFloor * 0.99 : 0);
    let max = Math.max(...values, chartMode === "EQUITY" ? startingBalance * 1.02 : 3);

    // Give 5% breathing room
    const range = max - min || 100;
    min -= range * 0.05;
    max += range * 0.05;

    return { minVal: min, maxVal: max, points: filteredData };
  }, [filteredData, chartMode, breachFloor, startingBalance]);

  const width = 600;
  const padding = { top: 20, right: 30, bottom: 30, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Coordinate scales
  const getX = (idx: number) => {
    if (points.length <= 1) return padding.left + chartW / 2;
    return padding.left + (idx / (points.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    const norm = (val - minVal) / (maxVal - minVal || 1);
    return padding.top + (1 - norm) * chartH;
  };

  // Generate SVG path for line and area
  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, pt, idx) => {
      const x = getX(idx);
      const y = getY(chartMode === "EQUITY" ? pt.equity : pt.drawdownPct || 0);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, "");
  }, [points, chartMode, minVal, maxVal]);

  const areaD = useMemo(() => {
    if (points.length === 0) return "";
    const firstX = getX(0);
    const lastX = getX(points.length - 1);
    const bottomY = padding.top + chartH;
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [pathD, points]);

  // Horizontal reference line positions
  const breachFloorY = chartMode === "EQUITY" ? getY(breachFloor) : null;
  const dailyLossFloorY = chartMode === "EQUITY" ? getY(dailyLossFloor) : null;

  // Y-axis grid levels (5 ticks)
  const yTicks = useMemo(() => {
    const count = 5;
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      const val = minVal + (i / count) * (maxVal - minVal);
      ticks.push(val);
    }
    return ticks;
  }, [minVal, maxVal]);

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  return (
    <div className="p-5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-4">
      {/* Chart Header: Mode switch + Timeframe filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Mode: Equity vs Drawdown */}
        <div className="flex items-center p-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-sans">
          <button
            type="button"
            onClick={() => setChartMode("EQUITY")}
            className={`px-3 py-1 rounded transition-colors ${
              chartMode === "EQUITY"
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Equity
          </button>
          <button
            type="button"
            onClick={() => setChartMode("DRAWDOWN")}
            className={`px-3 py-1 rounded transition-colors ${
              chartMode === "DRAWDOWN"
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Drawdown
          </button>
        </div>

        {/* Time filters */}
        <div className="flex items-center gap-1 text-xs font-sans text-zinc-400">
          {(["24H", "7D", "30D", "ALL"] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeFilter(range)}
              className={`px-2 py-0.5 rounded transition-colors ${
                timeFilter === range
                  ? "text-white font-semibold bg-zinc-800"
                  : "hover:text-zinc-200"
              }`}
            >
              {range === "ALL" ? "All Time" : range}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative w-full overflow-hidden" style={{ height }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y-axis labels */}
          {yTicks.map((val, idx) => {
            const y = getY(val);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#181828"
                  strokeDasharray="2 2"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="10"
                  className="font-mono"
                >
                  {chartMode === "EQUITY" ? `$${Math.round(val).toLocaleString()}` : `${val.toFixed(1)}%`}
                </text>
              </g>
            );
          })}

          {/* Reference Line: Max Drawdown floor (Red Dashed) */}
          {breachFloorY !== null && breachFloorY >= padding.top && breachFloorY <= padding.top + chartH && (
            <g>
              <line
                x1={padding.left}
                y1={breachFloorY}
                x2={width - padding.right}
                y2={breachFloorY}
                stroke="#ef4444"
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />
            </g>
          )}

          {/* Reference Line: Daily Loss limit floor (Amber/Orange Dashed) */}
          {dailyLossFloorY !== null &&
            dailyLossFloorY >= padding.top &&
            dailyLossFloorY <= padding.top + chartH && (
              <g>
                <line
                  x1={padding.left}
                  y1={dailyLossFloorY}
                  x2={width - padding.right}
                  y2={dailyLossFloorY}
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              </g>
            )}

          {/* Filled Area below curve */}
          {areaD && <path d={areaD} fill="url(#equityGradient)" />}

          {/* Equity Line Curve */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* X-axis date labels */}
          {points.map((pt, idx) => {
            if (idx % Math.ceil(points.length / 5) !== 0 && idx !== points.length - 1) return null;
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={height - 8}
                textAnchor="middle"
                fill="#71717a"
                fontSize="10"
                className="font-mono"
              >
                {pt.label}
              </text>
            );
          })}

          {/* Hover Tracker crosshair & interaction areas */}
          {points.map((pt, idx) => {
            const x = getX(idx);
            const y = getY(chartMode === "EQUITY" ? pt.equity : pt.drawdownPct || 0);
            return (
              <rect
                key={idx}
                x={x - (chartW / (points.length || 1)) / 2}
                y={padding.top}
                width={chartW / (points.length || 1)}
                height={chartH}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}

          {/* Active Hover Point Circle */}
          {hoveredIdx !== null && (
            <g>
              <line
                x1={getX(hoveredIdx)}
                y1={padding.top}
                x2={getX(hoveredIdx)}
                y2={padding.top + chartH}
                stroke="#3f3f46"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredIdx)}
                cy={getY(
                  chartMode === "EQUITY"
                    ? points[hoveredIdx].equity
                    : points[hoveredIdx].drawdownPct || 0
                )}
                r="4"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

        {/* Tooltip Overlay */}
        {activePoint && (
          <div className="absolute top-2 left-16 bg-zinc-950/90 border border-zinc-800 rounded px-2.5 py-1 text-xs font-sans pointer-events-none shadow-lg">
            <span className="text-zinc-400">{activePoint.label}</span>
            <span className="mx-1.5 text-zinc-600">·</span>
            <span className="font-mono font-bold text-white">
              {chartMode === "EQUITY" ? formatUSD(activePoint.equity) : `${(activePoint.drawdownPct || 0).toFixed(2)}% DD`}
            </span>
          </div>
        )}
      </div>

      {/* Chart Legend (Screenshot 1: — Equity, - - Max Drawdown 3%, - - Daily Loss 3%) */}
      <div className="flex flex-wrap items-center justify-center gap-5 pt-2 border-t border-[var(--border-subtle)] text-xs font-sans text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#10b981] inline-block rounded" />
          <span>Equity</span>
        </div>
        {chartMode === "EQUITY" && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-b border-dashed border-red-500 inline-block" />
              <span>Max Drawdown 3% ({formatUSD(breachFloor)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-b border-dashed border-amber-500 inline-block" />
              <span>Daily Loss 3% ({formatUSD(dailyLossFloor)})</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
