"use client";

import React, { useMemo, useState } from "react";
import { HistoryPoint, Condition, CONDITION_CONFIG } from "./regime-types";
import { cn, formatUSD } from "@/lib/utils";

interface RegimeChartProps {
  historySeries: HistoryPoint[];
  chartRange: "24h" | "48h";
  onRangeChange: (range: "24h" | "48h") => void;
  className?: string;
}

export function RegimeChart({
  historySeries,
  chartRange,
  onRangeChange,
  className,
}: RegimeChartProps) {
  const [filterMode, setFilterMode] = useState<"all" | "dead" | "trend">("all");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chartPoints = useMemo(() => {
    const count = chartRange === "24h" ? 288 : 576;
    return historySeries.slice(-count);
  }, [historySeries, chartRange]);

  const conditionBands = useMemo(() => {
    if (!chartPoints.length) return [];
    const bands: { start: number; end: number; label: Condition }[] = [];
    let current = { start: 0, end: 0, label: chartPoints[0].label };

    for (let i = 1; i < chartPoints.length; i++) {
      if (chartPoints[i].label === current.label) {
        current.end = i;
      } else {
        bands.push(current);
        current = { start: i, end: i, label: chartPoints[i].label };
      }
    }
    bands.push(current);
    return bands;
  }, [chartPoints]);

  const svgWidth = 980;
  const svgHeight = 240;
  const padLeft = 72;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 26;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const { minPrice, maxPrice, pricePath } = useMemo(() => {
    if (!chartPoints.length) return { minPrice: 0, maxPrice: 0, pricePath: "" };
    const prices = chartPoints.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const spread = max - min || 1;
    const pMin = min - spread * 0.05;
    const pMax = max + spread * 0.05;

    const getX = (idx: number) => padLeft + (idx / Math.max(1, chartPoints.length - 1)) * plotW;
    const getY = (price: number) => padTop + plotH - ((price - pMin) / (pMax - pMin)) * plotH;

    const points = chartPoints.map(
      (p, idx) => `${getX(idx).toFixed(1)},${getY(p.price).toFixed(1)}`
    );
    return { minPrice: pMin, maxPrice: pMax, pricePath: "M " + points.join(" L ") };
  }, [chartPoints, plotW, plotH, padLeft, padTop]);

  const activeHover =
    hoverIndex !== null && chartPoints[hoverIndex]
      ? chartPoints[hoverIndex]
      : chartPoints.at(-1) ?? null;
  const activeHoverIdx = hoverIndex !== null ? hoverIndex : chartPoints.length - 1;
  const activeHoverX =
    chartPoints.length > 1
      ? padLeft + (activeHoverIdx / (chartPoints.length - 1)) * plotW
      : padLeft;
  const activeHoverY =
    activeHover && maxPrice > minPrice
      ? padTop + plotH - ((activeHover.price - minPrice) / (maxPrice - minPrice)) * plotH
      : padTop;

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-4 font-sans",
        className
      )}
    >
      {/* Header Controls: Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">
            {chartRange.toUpperCase()} Market Condition Timeline
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Calibrated against rolling 7-day volume: highlights momentum vs dormant flatlines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 24h / 48h Range Toggle */}
          <div className="flex items-center p-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => onRangeChange("24h")}
              className={cn(
                "px-2.5 py-1 rounded transition-colors font-mono",
                chartRange === "24h"
                  ? "bg-zinc-800 text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              24H
            </button>
            <button
              type="button"
              onClick={() => onRangeChange("48h")}
              className={cn(
                "px-2.5 py-1 rounded transition-colors font-mono",
                chartRange === "48h"
                  ? "bg-zinc-800 text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              48H
            </button>
          </div>

          {/* Filter Mode: All / Dead / Trend */}
          <div className="flex items-center p-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs">
            {(["all", "dead", "trend"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={cn(
                  "px-2.5 py-1 rounded transition-colors uppercase font-medium",
                  filterMode === mode
                    ? "bg-zinc-800 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {mode === "all" ? "All" : mode === "dead" ? "Dead only" : "Trend only"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Hover HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded bg-zinc-900/60 border border-zinc-800/80 text-xs font-mono">
        <div>
          <span className="text-[11px] text-zinc-400 block font-sans">Candle (IST)</span>
          <span className="text-zinc-200 font-semibold mt-0.5 block">
            {activeHover?.istLabel ?? "—"}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-zinc-400 block font-sans">Price</span>
          <span className="text-white font-bold mt-0.5 block">
            {activeHover ? formatUSD(activeHover.price) : "—"}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-zinc-400 block font-sans">Condition</span>
          <span
            className={cn(
              "font-semibold mt-0.5 block",
              activeHover ? CONDITION_CONFIG[activeHover.label].textColor : "text-zinc-400"
            )}
          >
            {activeHover ? CONDITION_CONFIG[activeHover.label].name : "—"}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-zinc-400 block font-sans">Volatility Pulse</span>
          <span className="text-zinc-200 mt-0.5 block">
            {activeHover ? `${Math.round(activeHover.activity)}%` : "—"}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-zinc-400 block font-sans">Direction Strength</span>
          <span className="text-zinc-200 mt-0.5 block">
            {activeHover ? `${Math.round(activeHover.persistence)}%` : "—"}
          </span>
        </div>
      </div>

      {/* SVG Canvas Frame */}
      <div className="relative w-full overflow-hidden rounded border border-zinc-800/80 bg-zinc-950/80">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto block select-none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            const idx = Math.round(((relX - padLeft) / plotW) * (chartPoints.length - 1));
            if (idx >= 0 && idx < chartPoints.length) setHoverIndex(idx);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Condition Background Bands */}
          {conditionBands.map((band, i) => {
            const xStart = padLeft + (band.start / Math.max(1, chartPoints.length - 1)) * plotW;
            const xEnd = padLeft + (band.end / Math.max(1, chartPoints.length - 1)) * plotW;
            const bandWidth = Math.max(1.5, xEnd - xStart);
            const conf = CONDITION_CONFIG[band.label];

            const isHidden =
              (filterMode === "dead" && band.label !== "DEAD") ||
              (filterMode === "trend" && band.label !== "TREND");

            if (isHidden) return null;

            return (
              <g key={i}>
                <rect
                  x={xStart}
                  y={padTop}
                  width={bandWidth}
                  height={plotH}
                  fill={conf.bgTint}
                />
                {bandWidth > 58 && (
                  <text
                    x={xStart + 6}
                    y={padTop + 14}
                    fill={conf.color}
                    fontSize="10"
                    fontFamily="var(--font-mono), monospace"
                    fontWeight="600"
                    letterSpacing="0.04em"
                  >
                    {conf.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* Gridlines & Y-Axis Price Labels */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = padTop + plotH * (1 - ratio);
            const price = minPrice + (maxPrice - minPrice) * ratio;
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotW}
                  y2={y}
                  stroke="#1e1e32"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  fill="#a1a1aa"
                  fontSize="11"
                  fontFamily="var(--font-mono), monospace"
                  textAnchor="end"
                >
                  {formatUSD(price)}
                </text>
              </g>
            );
          })}

          {/* Price Path Line */}
          {pricePath && (
            <path
              d={pricePath}
              fill="none"
              stroke="#f4f4f8"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          )}

          {/* Hover Crosshair & Dot */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={activeHoverX}
                y1={padTop}
                x2={activeHoverX}
                y2={padTop + plotH}
                stroke="#a1a1aa"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={activeHoverX}
                cy={activeHoverY}
                r="4.5"
                fill="#ffffff"
                stroke="#07070c"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Continuous State Tape Ribbon */}
          {chartPoints.map((p, idx) => {
            const x = padLeft + (idx / Math.max(1, chartPoints.length - 1)) * plotW;
            const barWidth = Math.max(1.5, plotW / chartPoints.length);
            return (
              <rect
                key={idx}
                x={x}
                y={padTop + plotH + 8}
                width={barWidth}
                height="7"
                fill={CONDITION_CONFIG[p.label].color}
              />
            );
          })}

          <text
            x={padLeft - 10}
            y={padTop + plotH + 15}
            fill="#a1a1aa"
            fontSize="10"
            fontFamily="var(--font-mono), monospace"
            textAnchor="end"
          >
            TAPE
          </text>
        </svg>
      </div>
    </div>
  );
}
