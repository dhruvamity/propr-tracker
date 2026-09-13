import React from "react";
import { cn } from "@/lib/utils";

export function TableContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto",
        className
      )}
    >
      <table className="w-full text-left text-xs">{children}</table>
    </div>
  );
}

export function TableHeaderRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 font-sans",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  children,
  align = "left",
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "py-2.5 px-3 font-normal",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tbody
      className={cn(
        "divide-y divide-[var(--border-subtle)] font-mono text-xs",
        className
      )}
    >
      {children}
    </tbody>
  );
}
