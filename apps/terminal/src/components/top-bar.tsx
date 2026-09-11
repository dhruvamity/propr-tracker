"use client";

import { RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

interface HealthData {
  restStatus: "HEALTHY" | "ERROR" | "UNKNOWN";
  wsStatus: "CONNECTED" | "DISCONNECTED" | "ERROR";
  lastSyncAt: string;
}

export function TopBar() {
  const [health, setHealth] = useState<HealthData>({
    restStatus: "HEALTHY",
    wsStatus: "DISCONNECTED",
    lastSyncAt: "",
  });
  const [relativeTime, setRelativeTime] = useState("Just now");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.health) {
            setHealth(data.health);
          }
        }
      } catch {
        if (isMounted) {
          setHealth((h) => ({ ...h, restStatus: "ERROR" }));
        }
      }
    };

    void fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const updateRelative = () => {
      if (!health.lastSyncAt) {
        setRelativeTime("Just now");
        setIsStale(false);
        return;
      }
      const syncDate = new Date(health.lastSyncAt).getTime();
      const now = Date.now();
      const diffSec = Math.floor((now - syncDate) / 1000);

      setIsStale(diffSec > 60);

      if (diffSec < 10) setRelativeTime("Just now");
      else if (diffSec < 60) setRelativeTime(`${diffSec}s ago`);
      else if (diffSec < 3600) setRelativeTime(`${Math.floor(diffSec / 60)}m ago`);
      else setRelativeTime(new Date(syncDate).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }) + " IST");
    };

    updateRelative();
    const ticker = setInterval(updateRelative, 5000);
    return () => clearInterval(ticker);
  }, [health.lastSyncAt]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-[13px] font-semibold tracking-[0.2em] text-[var(--text-primary)]">
          PROPR
        </h1>
        <span className="text-[var(--text-muted)] text-[11px]">{"//"}</span>
        <span className="text-[11px] tracking-[0.15em] text-[var(--text-secondary)]">
          ACCOUNT TERMINAL
        </span>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Sync Status Badge */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isStale ? "bg-[var(--amber)]" : health.restStatus === "HEALTHY" ? "bg-[var(--green)] animate-pulse" : "bg-[var(--red)]"}`} />
          <span className={`text-[10px] tracking-wider font-mono font-medium hidden md:inline ${isStale ? "text-[var(--amber)]" : health.restStatus === "HEALTHY" ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            {isStale ? "STALE" : health.restStatus === "HEALTHY" ? "LIVE" : "ERROR"}
          </span>
        </div>

        {/* Real Last Sync Timestamp */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-wider text-[var(--text-muted)] hidden md:inline font-mono">
            LAST SYNC
          </span>
          <span className="font-mono text-[11px] text-[var(--text-secondary)]">
            {relativeTime}
          </span>
        </div>

        {/* Health Badges */}
        <div className="hidden md:flex items-center gap-3 font-mono">
          <div className="flex items-center gap-1.5" title={`REST API: ${health.restStatus}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${health.restStatus === "HEALTHY" ? "bg-[var(--green)]" : "bg-[var(--red)]"}`} />
            <span className="text-[9px] tracking-wider text-[var(--text-muted)]">REST</span>
          </div>
          <div className="flex items-center gap-1.5" title={`WebSocket: ${health.wsStatus}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${health.wsStatus === "CONNECTED" ? "bg-[var(--green)]" : "bg-[var(--amber)]"}`} />
            <span className="text-[9px] tracking-wider text-[var(--text-muted)]">WS</span>
          </div>
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-1.5 rounded hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] ${isRefreshing ? "animate-spin" : ""}`}
          title="Refresh Data"
          aria-label="Refresh Data"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </header>
  );
}
