"use client";

import { RefreshCw, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useShell } from "./shell-context";

interface HealthData {
  restStatus: "HEALTHY" | "ERROR" | "UNKNOWN";
  wsStatus: "CONNECTED" | "DISCONNECTED" | "ERROR";
  lastSyncAt: string;
}

const ROUTE_HEADERS: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Overview",
    subtitle: "Portfolio status & capital allocation",
  },
  "/live": {
    title: "Live Risk",
    subtitle: "Breach proximity monitor",
  },
  "/accounts": {
    title: "Accounts",
    subtitle: "Active evaluations & history",
  },
  "/positions": {
    title: "Positions",
    subtitle: "Open perpetual exposures",
  },
  "/orders": {
    title: "Orders",
    subtitle: "Resting limit & stop orders",
  },
  "/finance": {
    title: "Finance",
    subtitle: "Capital ledger & cash flow",
  },
  "/history": {
    title: "History",
    subtitle: "Closed accounts & archives",
  },
  "/system": {
    title: "System",
    subtitle: "Telemetry & gateway health",
  },
};

export function TopBar() {
  const pathname = usePathname();
  const { toggleMobileNav } = useShell();

  const [health, setHealth] = useState<HealthData>({
    restStatus: "HEALTHY",
    wsStatus: "DISCONNECTED",
    lastSyncAt: "",
  });
  const [relativeTime, setRelativeTime] = useState("Just now");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);

  // Derive route title & subtitle
  const headerInfo =
    ROUTE_HEADERS[pathname] || {
      title: "Trading Terminal",
      subtitle: "Personal risk monitor",
    };

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
      else
        setRelativeTime(
          new Date(syncDate).toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour12: false,
          }) + " IST"
        );
    };

    updateRelative();
    const ticker = setInterval(updateRelative, 5000);
    return () => clearInterval(ticker);
  }, [health.lastSyncAt]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  // Determine Semantic 4-State Status Badge (Prompt Requirement §2)
  let statusBadge: {
    label: string;
    dotClass: string;
    textClass: string;
    containerClass: string;
  };

  if (health.restStatus === "ERROR") {
    statusBadge = {
      label: "OFFLINE",
      dotClass: "bg-red-500",
      textClass: "text-red-400",
      containerClass: "bg-red-950/40 border-red-800/50",
    };
  } else if (isStale) {
    statusBadge = {
      label: "STALE",
      dotClass: "bg-amber-500 animate-pulse",
      textClass: "text-amber-400",
      containerClass: "bg-amber-950/40 border-amber-800/50",
    };
  } else if (health.restStatus === "HEALTHY" && health.wsStatus === "CONNECTED") {
    statusBadge = {
      label: "LIVE",
      dotClass: "bg-emerald-400 animate-pulse",
      textClass: "text-emerald-400",
      containerClass: "bg-emerald-950/40 border-emerald-800/50",
    };
  } else {
    // REST healthy + WS disconnected (Polling mode)
    statusBadge = {
      label: "POLLING · 15s",
      dotClass: "bg-[var(--cyan)]",
      textClass: "text-[var(--cyan)]",
      containerClass: "bg-cyan-950/40 border-cyan-800/50",
    };
  }

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] select-none">
      {/* Contextual Left: Title & Subtitle + Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileNav}
          className="p-1.5 rounded md:hidden text-zinc-400 hover:text-white hover:bg-zinc-800"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <div>
          <h1 className="text-sm md:text-base font-semibold text-white tracking-wide">
            {headerInfo.title}
          </h1>
          <p className="text-[11px] text-zinc-400 hidden sm:block">
            {headerInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Semantic Connection State, Relative Sync & Refresh */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Semantic Status Badge */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-mono font-medium ${statusBadge.containerClass}`}
        >
          <div className={`w-2 h-2 rounded-full ${statusBadge.dotClass}`} />
          <span className={`${statusBadge.textClass} text-[11px]`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Relative Sync Timing */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-zinc-400">
          <span>Updated</span>
          <span className="text-zinc-200">{relativeTime}</span>
        </div>

        {/* REST / WS Mini Telemetry Dots (REST ●   WS ○) */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono select-none">
          <div className="flex items-center gap-1.5" title={`REST API: ${health.restStatus}`}>
            <span className="text-zinc-400">REST</span>
            <span className={health.restStatus === "HEALTHY" ? "text-emerald-400 text-xs leading-none" : "text-red-400 text-xs leading-none"}>
              ●
            </span>
          </div>
          <div className="flex items-center gap-1.5" title={`WebSocket: ${health.wsStatus}`}>
            <span className="text-zinc-400">WS</span>
            <span className={health.wsStatus === "CONNECTED" ? "text-emerald-400 text-xs leading-none" : "text-zinc-500 text-xs leading-none font-bold"}>
              {health.wsStatus === "CONNECTED" ? "●" : "○"}
            </span>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white ${
            isRefreshing ? "animate-spin" : ""
          }`}
          title="Refresh Data"
          aria-label="Refresh Data"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </header>
  );
}
