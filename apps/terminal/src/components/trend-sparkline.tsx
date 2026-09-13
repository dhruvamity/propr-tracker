import React from "react";
import { formatUSD } from "@/lib/utils";

export interface SparklineTrade {
  realizedPnl?: string;
  fee?: string;
  executedAt?: string;
  asset?: string;
  symbol?: string;
}

interface TrendSparklineProps {
  trades?: SparklineTrade[];
  width?: number;
  height?: number;
  showInsight?: boolean;
}

export function TrendSparkline({
  trades = [],
  width = 110,
  height = 24,
  showInsight = true,
}: TrendSparklineProps) {
  // Sort trades chronologically ascending
  const sorted = [...trades].sort(
    (a, b) =>
      new Date(a.executedAt || 0).getTime() -
      new Date(b.executedAt || 0).getTime()
  );

  // Filter to active closed trades with PnL or fee
  const activeTrades = sorted.filter(
    (t) => Number(t.realizedPnl || 0) !== 0 || Number(t.fee || 0) > 0
  );

  if (activeTrades.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
        <span>No trades today</span>
      </div>
    );
  }

  // Calculate cumulative PnL progression
  let cumulative = 0;
  const points: { x: number; y: number; cumPnl: number; tradePnl: number; asset: string; fee: number }[] = [
    { x: 0, y: 0, cumPnl: 0, tradePnl: 0, asset: "START", fee: 0 },
  ];

  let maxSingleLoss = 0;
  let winCount = 0;
  let lossCount = 0;

  for (const t of activeTrades) {
    const rpnl = Number(t.realizedPnl || 0);
    const fee = Number(t.fee || 0);
    const netTrade = rpnl - fee;
    cumulative += netTrade;

    if (netTrade < 0) {
      lossCount++;
      const absLoss = Math.abs(netTrade);
      if (absLoss > maxSingleLoss) {
        maxSingleLoss = absLoss;
      }
    } else if (netTrade > 0) {
      winCount++;
    }

    points.push({
      x: 0,
      y: 0,
      cumPnl: cumulative,
      tradePnl: netTrade,
      asset: t.asset || t.symbol || "Trade",
      fee,
    });
  }

  // Normalize points to SVG coordinates
  const cumValues = points.map((p) => p.cumPnl);
  const minVal = Math.min(...cumValues);
  const maxVal = Math.max(...cumValues);
  const range = maxVal - minVal || 1;
  const paddingY = 4;
  const effectiveHeight = height - paddingY * 2;

  const n = points.length;
  const stepX = (width - 8) / (n - 1 || 1);

  points.forEach((p, i) => {
    p.x = 4 + i * stepX;
    // Invert Y: higher cumPnl is at top (lower Y)
    p.y = paddingY + (1 - (p.cumPnl - minVal) / range) * effectiveHeight;
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;

  const isNetNegative = cumulative < 0;
  const strokeColor = isNetNegative ? "#ef4444" : "#10b981"; // alert red : muted emerald
  const fillColor = isNetNegative ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)";

  // Standardized clean trade insight without conversational filler
  let insightText = "";
  if (lossCount > 0) {
    insightText = `${lossCount} trades · Max loss: -${formatUSD(maxSingleLoss)}`;
  } else if (winCount > 0) {
    insightText = `${winCount} wins · +${formatUSD(cumulative)}`;
  } else {
    insightText = "0 trades";
  }

  const tooltipSummary = activeTrades
    .map((t, idx) => {
      const net = Number(t.realizedPnl || 0) - Number(t.fee || 0);
      return `#${idx + 1}: ${net >= 0 ? "+" : ""}${formatUSD(net)} (${t.asset || "trade"})`;
    })
    .join(" → ");

  return (
    <div className="flex flex-col gap-1" title={`Trade PnL Trajectory: ${tooltipSummary}`}>
      <div className="flex items-center gap-2">
        <svg
          width={width}
          height={height}
          className="overflow-visible select-none shrink-0"
        >
          <title>{`Trade PnL Trajectory: ${tooltipSummary}`}</title>
          {/* Subtle baseline at 0 */}
          {minVal < 0 && maxVal > 0 && (
            <line
              x1={4}
              y1={paddingY + (1 - (0 - minVal) / range) * effectiveHeight}
              x2={width - 4}
              y2={paddingY + (1 - (0 - minVal) / range) * effectiveHeight}
              stroke="#3f3f46"
              strokeWidth="0.8"
              strokeDasharray="2,2"
            />
          )}

          {/* Area under curve */}
          <path d={areaD} fill={fillColor} />

          {/* Line curve */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots on each trade */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === points.length - 1 ? 2.5 : 1.8}
              fill={i === points.length - 1 ? strokeColor : "#71717a"}
              stroke="#09090b"
              strokeWidth="1"
            />
          ))}
        </svg>

        {showInsight && (
          <span
            className={`text-[10px] font-mono leading-none ${
              isNetNegative ? "text-red-400 font-medium" : "text-emerald-400"
            }`}
            title={`Trajectory: ${tooltipSummary}`}
          >
            {insightText}
          </span>
        )}
      </div>
    </div>
  );
}
