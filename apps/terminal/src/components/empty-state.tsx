import React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  statusBadge?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  statusBadge,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center select-none",
        className
      )}
    >
      {/* Oversized Muted Icon Container */}
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] flex items-center justify-center shadow-lg">
          <Icon className="w-8 h-8 text-[var(--text-muted)]" strokeWidth={1.5} />
        </div>
        {/* Subtle accent halo */}
        <div className="absolute inset-0 rounded-2xl bg-[var(--cyan)]/5 blur-md -z-10" />
      </div>

      {/* Main Empty State Header */}
      <h3 className="text-sm font-mono font-semibold tracking-wider text-[var(--text-primary)] uppercase">
        {title}
      </h3>

      {/* Secondary Description */}
      <p className="mt-1.5 text-xs font-mono text-[var(--text-secondary)] max-w-sm leading-relaxed">
        {description}
      </p>

      {/* Optional Status Pill */}
      {statusBadge && (
        <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
          <span>{statusBadge}</span>
        </div>
      )}
    </div>
  );
}
