import React from "react";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "green"
  | "red"
  | "amber"
  | "cyan"
  | "zinc"
  | "neutral"
  | "buy"
  | "sell"
  | "long"
  | "short";

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const TONE_STYLES: Record<StatusTone, { text: string; dot: string }> = {
  green: {
    text: "text-[var(--green)]",
    dot: "bg-[var(--green)]",
  },
  red: {
    text: "text-[var(--red)]",
    dot: "bg-[var(--red)]",
  },
  amber: {
    text: "text-[var(--amber)]",
    dot: "bg-[var(--amber)]",
  },
  cyan: {
    text: "text-[var(--cyan)]",
    dot: "bg-[var(--cyan)]",
  },
  zinc: {
    text: "text-[var(--text-secondary)]",
    dot: "bg-[var(--text-secondary)]",
  },
  neutral: {
    text: "text-[var(--text-muted)]",
    dot: "bg-[var(--text-muted)]",
  },
  buy: {
    text: "text-[var(--green)]",
    dot: "bg-[var(--green)]",
  },
  sell: {
    text: "text-[var(--red)]",
    dot: "bg-[var(--red)]",
  },
  long: {
    text: "text-[var(--green)]",
    dot: "bg-[var(--green)]",
  },
  short: {
    text: "text-[var(--red)]",
    dot: "bg-[var(--red)]",
  },
};

export function StatusBadge({
  label,
  tone = "neutral",
  dot = true,
  size = "sm",
  className,
}: StatusBadgeProps) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-sans font-medium whitespace-nowrap",
        size === "sm" ? "text-[11px]" : "text-xs",
        styles.text,
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "rounded-full shrink-0",
            size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
            styles.dot
          )}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
