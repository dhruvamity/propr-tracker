import React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  statusBadge?: string;
  className?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  metrics?: {
    activeAccounts?: number;
    openPositions?: number;
    openOrders?: number;
    lastChecked?: string;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  statusBadge,
  className,
  action,
  children,
  metrics,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 text-center select-none max-w-lg mx-auto",
        className
      )}
    >
      {/* Icon */}
      <div className="relative mb-3">
        <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shadow-md">
          <Icon className="w-6 h-6 text-[var(--text-secondary)]" strokeWidth={1.5} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-white">
        {title}
      </h3>

      {/* Description */}
      <p className="mt-1.5 text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
        {description}
      </p>

      {/* Metrics strip if provided (Prompt §8) */}
      {metrics && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] w-full">
          {metrics.activeAccounts !== undefined && (
            <div>
              <span>Active accounts </span>
              <strong className="text-white">{metrics.activeAccounts}</strong>
            </div>
          )}
          {metrics.openPositions !== undefined && (
            <div>
              <span>• Open positions </span>
              <strong className="text-white">{metrics.openPositions}</strong>
            </div>
          )}
          {metrics.openOrders !== undefined && (
            <div>
              <span>• Open orders </span>
              <strong className="text-white">{metrics.openOrders}</strong>
            </div>
          )}
          {metrics.lastChecked && (
            <div>
              <span>• Checked </span>
              <strong className="text-[var(--text-secondary)]">{metrics.lastChecked}</strong>
            </div>
          )}
        </div>
      )}

      {/* Optional Status Indicator */}
      {statusBadge && (
        <div className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
          <span>{statusBadge}</span>
        </div>
      )}

      {/* Optional Action / Links */}
      {action && <div className="mt-3.5">{action}</div>}

      {/* Optional Children */}
      {children && <div className="mt-3.5 w-full">{children}</div>}
    </div>
  );
}
