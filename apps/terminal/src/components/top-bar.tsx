"use client";

import { RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

export function TopBar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-[13px] font-semibold tracking-[0.2em] text-[var(--text-primary)]">
          PROPR
        </h1>
        <span className="text-[var(--text-muted)] text-[11px]">//</span>
        <span className="text-[11px] tracking-[0.15em] text-[var(--text-secondary)]">
          ACCOUNT TERMINAL
        </span>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Live Status */}
        <div className="flex items-center gap-2">
          <div className="live-dot" />
          <span className="text-[10px] tracking-wider text-[var(--green)] font-medium hidden md:inline">
            LIVE
          </span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-wider text-[var(--text-muted)] hidden md:inline">
            LAST SYNC
          </span>
          <span className="mono text-[11px] text-[var(--text-secondary)]">
            {time || "--:--:--"} IST
          </span>
        </div>

        {/* Health Indicators */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
            <span className="text-[9px] tracking-wider text-[var(--text-muted)]">REST</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
            <span className="text-[9px] tracking-wider text-[var(--text-muted)]">WS</span>
          </div>
        </div>

        {/* Refresh */}
        <button
          onClick={() => window.location.reload()}
          className="p-1.5 rounded hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          title="Refresh Data"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </header>
  );
}
