import React from "react";
import { cn } from "@/lib/utils";

interface MetricValueProps {
  value: React.ReactNode;
  tone?: "default" | "positive" | "negative" | "warning" | "cyan" | "muted";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const TONE_MAP = {
  default: "text-white",
  positive: "text-[var(--green)]",
  negative: "text-[var(--red)]",
  warning: "text-[var(--amber)]",
  cyan: "text-[var(--cyan)]",
  muted: "text-[var(--text-secondary)]",
};

const SIZE_MAP = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
};

export function MetricValue({
  value,
  tone = "default",
  size = "2xl",
  className,
}: MetricValueProps) {
  return (
    <div
      className={cn(
        "font-mono font-bold tracking-tight",
        SIZE_MAP[size],
        TONE_MAP[tone],
        className
      )}
    >
      {value}
    </div>
  );
}
