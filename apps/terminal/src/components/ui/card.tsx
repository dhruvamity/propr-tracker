import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: "lg" | "xl";
  spacing?: "none" | "1" | "1.5" | "2" | "3" | "4";
  variant?: "surface" | "elevated" | "secondary" | "subtle";
  children: React.ReactNode;
  className?: string;
}

const SPACING_MAP = {
  none: "",
  "1": "space-y-1",
  "1.5": "space-y-1.5",
  "2": "space-y-2",
  "3": "space-y-3",
  "4": "space-y-4",
};

const VARIANT_MAP = {
  surface: "border border-[var(--border-primary)] bg-[var(--bg-surface)]",
  elevated: "border border-[var(--border-primary)] bg-[var(--bg-elevated)]",
  secondary: "border border-[var(--border-subtle)] bg-[var(--bg-secondary)]",
  subtle: "border border-zinc-800/80 bg-zinc-900/50",
};

export function Card({
  rounded = "lg",
  spacing = "2",
  variant = "surface",
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "p-4",
        rounded === "xl" ? "rounded-xl" : "rounded-lg",
        VARIANT_MAP[variant],
        SPACING_MAP[spacing],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
