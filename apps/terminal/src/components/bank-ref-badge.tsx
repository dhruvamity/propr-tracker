"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface BankRefBadgeProps {
  reference: string;
}

export function formatBankRef(ref: string): string {
  if (!ref || ref === "-") return "-";
  const parts = ref.split("/");
  if (parts.length >= 3) {
    const prefix = parts[0];
    let suffix = parts[parts.length - 1];
    const dateMatch = suffix.match(/^(\d{2}-\d{2}-\d{4})/);
    if (dateMatch) {
      suffix = dateMatch[1];
    }
    return `${prefix}/.../${suffix}`;
  }
  if (ref.length > 20) {
    return `${ref.slice(0, 6)}...${ref.slice(-10)}`;
  }
  return ref;
}

export function BankRefBadge({ reference }: BankRefBadgeProps) {
  const [copied, setCopied] = useState(false);

  if (!reference || reference === "-") {
    return <span className="text-[var(--text-muted)] font-mono text-xs">-</span>;
  }

  const truncated = formatBankRef(reference);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy reference to clipboard", err);
    }
  };

  return (
    <div className="relative inline-flex items-center group">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-cyan-700/60 hover:text-cyan-300 hover:bg-zinc-800/80 transition-all cursor-pointer select-none"
        title={reference}
        aria-label={`Bank reference: ${reference}`}
      >
        <span>{truncated}</span>
        {copied ? (
          <Check size={11} className="text-[var(--green)] shrink-0 animate-in fade-in" />
        ) : (
          <Copy size={11} className="text-zinc-400 group-hover:text-cyan-400 shrink-0 transition-colors" />
        )}
      </button>

      {/* Floating Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-50">
        <div className="px-2.5 py-1.5 rounded bg-zinc-950/95 border border-zinc-700/80 shadow-2xl backdrop-blur-sm text-[11px] font-mono whitespace-nowrap">
          <div className="text-zinc-200 font-medium">
            {copied ? (
              <span className="text-[var(--green)] flex items-center gap-1">
                <Check size={11} /> Copied to clipboard!
              </span>
            ) : (
              reference
            )}
          </div>
          {!copied && (
            <div className="text-[11px] text-zinc-400 mt-0.5 text-center">
              Click to copy full reference
            </div>
          )}
        </div>
        <div className="w-1.5 h-1.5 bg-zinc-950 border-r border-b border-zinc-700/80 rotate-45 -mt-1" />
      </div>
    </div>
  );
}
