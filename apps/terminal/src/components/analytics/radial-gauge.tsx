"use client";

import React from "react";

interface RadialGaugeProps {
  value: number; // Current value (e.g. 2.00 or 0.72)
  max: number; // Max value (e.g. 9 or 3)
  color?: string; // Hex or CSS color
  size?: number; // Diameter
}

export function RadialGauge({
  value,
  max,
  color = "#10b981",
  size = 56,
}: RadialGaugeProps) {
  const percentage = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  // Needle angle from -110 deg to +110 deg (220 deg sweep)
  const angle = -110 + (percentage / 100) * 220;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible">
        {/* Track arc (220 degrees) */}
        <path
          d="M 22 78 A 40 40 0 1 1 78 78"
          fill="none"
          stroke="#27272a"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Filled active arc */}
        <path
          d="M 22 78 A 40 40 0 1 1 78 78"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="153.9"
          strokeDashoffset={153.9 - (153.9 * percentage) / 100}
          className="transition-all duration-500 ease-out"
        />
        {/* Center pivot */}
        <circle cx="50" cy="50" r="4" fill="#a1a1aa" />
        {/* Needle */}
        <g transform={`rotate(${angle} 50 50)`} className="transition-transform duration-500 ease-out">
          <line x1="50" y1="50" x2="50" y2="20" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

interface WinRateArcProps {
  wins: number;
  losses: number;
  size?: number;
}

export function WinRateArc({ wins, losses, size = 52 }: WinRateArcProps) {
  const total = wins + losses;
  const winPct = total > 0 ? (wins / total) * 100 : 50;

  return (
    <div className="relative flex flex-col items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 65" className="overflow-visible">
        {/* Full semicircle track (Losses background in red) */}
        <path
          d="M 12 55 A 38 38 0 0 1 88 55"
          fill="none"
          stroke="#ef4444"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Wins portion in green */}
        <path
          d="M 12 55 A 38 38 0 0 1 88 55"
          fill="none"
          stroke="#10b981"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="119.4"
          strokeDashoffset={119.4 - (119.4 * winPct) / 100}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium -mt-1">
        <span className="text-emerald-400">{wins}</span>
        <span className="text-red-400">{losses}</span>
      </div>
    </div>
  );
}
