"use client";

import { RefreshCw, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useShell } from "./shell-context";
import { cn } from "@/lib/utils";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/live": "Risk",
  "/accounts": "Accounts",
  "/analytics": "Analytics",
  "/positions": "Positions",
  "/orders": "Orders",
  "/finance": "Finance",
  "/history": "History",
  "/system": "System",
};

export function TopBar() {
  const pathname = usePathname();
  const { toggleMobileNav, health, refreshHealth } = useShell();

  const [relativeTime, setRelativeTime] = useState("now");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);

  const pageTitle = ROUTE_TITLES[pathname] || "Trading Terminal";

  useEffect(() => {
    const updateRelative = () => {
      if (!health.lastSyncAt) {
        setRelativeTime("now");
        setIsStale(false);
        return;
      }
      const syncDate = new Date(health.lastSyncAt).getTime();
      const now = Date.now();
      const diffSec = Math.floor((now - syncDate) / 1000);

      setIsStale(diffSec > 60);

      if (diffSec < 5) setRelativeTime("now");
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

  // ─── DataFreshness State (Prompt §2) ───
  // OFFLINE: ● Offline
  // STALE:   ● Stale · 2m ago
  // LIVE WS: ● Live · 4s ago
  // POLLING: Updated 4s ago (NO dot for ordinary healthy polling)
  let statusDot: React.ReactNode = null;
  let freshnessText = `Updated ${relativeTime}`;

  if (health.restStatus === "ERROR") {
    statusDot = <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />;
    freshnessText = "Offline";
  } else if (isStale) {
    statusDot = <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />;
    freshnessText = `Stale · ${relativeTime}`;
  } else if (health.wsStatus === "CONNECTED") {
    statusDot = <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />;
    freshnessText = `Live · ${relativeTime}`;
  }

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] select-none">
      {/* Left: Clean Page Title without generic subtitle filler (Prompt §1 & §28) */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileNav}
          className="p-1.5 rounded md:hidden text-zinc-400 hover:text-white hover:bg-zinc-800"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <h1 className="text-sm md:text-base font-semibold text-white tracking-wide font-sans">
          {pageTitle}
        </h1>
      </div>

      {/* Right: Freshness state + refresh button (Prompt §2) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-sans text-xs text-zinc-400">
          {statusDot}
          <span className="text-zinc-300">{freshnessText}</span>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={cn(
            "w-7 h-7 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors",
            isRefreshing && "animate-spin"
          )}
          title="Refresh data"
          aria-label="Refresh data"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </header>
  );
}
