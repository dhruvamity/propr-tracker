"use client";

import { RefreshCw, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useShell } from "./shell-context";
import { cn } from "@/lib/utils";

const ROUTE_HEADERS: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Overview",
    subtitle: "Cash, risk, and exposure",
  },
  "/live": {
    title: "Risk",
    subtitle: "2 active accounts · Sorted by nearest limit",
  },
  "/accounts": {
    title: "Accounts",
    subtitle: "Active evaluations and archive",
  },
  "/analytics": {
    title: "Analytics",
    subtitle: "Account performance and trade analytics",
  },
  "/positions": {
    title: "Positions",
    subtitle: "Open perpetual exposures",
  },
  "/orders": {
    title: "Orders",
    subtitle: "Resting limit and stop orders",
  },
  "/finance": {
    title: "Finance",
    subtitle: "Capital ledger and cash flow",
  },
  "/history": {
    title: "History",
    subtitle: "Closed accounts",
  },
  "/system": {
    title: "System",
    subtitle: "Gateway health and sync status",
  },
};

export function TopBar() {
  const pathname = usePathname();
  const { toggleMobileNav, health, refreshHealth } = useShell();

  const [relativeTime, setRelativeTime] = useState("just now");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);

  // Derive route title & subtitle
  const headerInfo =
    ROUTE_HEADERS[pathname] || {
      title: "Trading Terminal",
      subtitle: "Personal risk monitor",
    };

  useEffect(() => {
    const updateRelative = () => {
      if (!health.lastSyncAt) {
        setRelativeTime("just now");
        setIsStale(false);
        return;
      }
      const syncDate = new Date(health.lastSyncAt).getTime();
      const now = Date.now();
      const diffSec = Math.floor((now - syncDate) / 1000);

      setIsStale(diffSec > 60);

      if (diffSec < 10) setRelativeTime("just now");
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshHealth();
    window.location.reload();
  };

  // ─── DataFreshness State (Prompt §2: No bordered pill, dot + text only) ───
  // LIVE:    ● Live · 2s ago
  // POLLING: ● Updated 15s ago
  // STALE:   ● Stale · 2m ago
  // OFFLINE: ● Offline
  let dotColor = "bg-emerald-400";
  let freshnessText = `Updated ${relativeTime}`;

  if (health.restStatus === "ERROR") {
    dotColor = "bg-red-500";
    freshnessText = "Offline";
  } else if (isStale) {
    dotColor = "bg-amber-400 animate-pulse";
    freshnessText = `Stale · ${relativeTime}`;
  } else if (health.wsStatus === "CONNECTED") {
    dotColor = "bg-emerald-400 animate-pulse";
    freshnessText = `Live · ${relativeTime}`;
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
          <p className="text-xs text-zinc-400 hidden sm:block">
            {headerInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Freshness state (dot + text) + plain 32px refresh button */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-sans text-xs text-zinc-400">
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
          <span className="text-zinc-300">{freshnessText}</span>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={cn(
            "w-8 h-8 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors",
            isRefreshing && "animate-spin"
          )}
          title="Refresh data"
          aria-label="Refresh data"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </header>
  );
}
