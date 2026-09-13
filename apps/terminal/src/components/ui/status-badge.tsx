import React from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "green" | "red" | "amber" | "cyan" | "zinc" | "neutral";

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const TONE_STYLES: Record<StatusTone, { text: string; dot: string }> = {
  green: {
    text: "text-emerald-400",
    dot: "bg-emerald-500",
  },
  red: {
    text: "text-red-400",
    dot: "bg-red-500",
  },
  amber: {
    text: "text-amber-400",
    dot: "bg-amber-500",
  },
  cyan: {
    text: "text-cyan-400",
    dot: "bg-cyan-500",
  },
  zinc: {
    text: "text-zinc-300",
    dot: "bg-zinc-400",
  },
  neutral: {
    text: "text-zinc-400",
    dot: "bg-zinc-500",
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
