"use client";

import { RefreshCw, Menu, FileDown } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
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
  "/system": "System",
  "/rules": "Rules",
  "/forensics": "Forensics Calendar",
  "/analytics/forensics": "Forensics Calendar",
};

export function TopBar() {
  const pathname = usePathname();
  const { toggleMobileNav, health, refreshHealth } = useShell();

  const [relativeTime, setRelativeTime] = useState("now");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [isMac] = useState(() => {
    if (typeof navigator !== "undefined") {
      return /Mac|iPhone|iPad|iPod/.test(navigator.platform || "");
    }
    return true;
  });

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

      if (diffSec < 5) setRelativeTime("<1s ago");
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

  // Instant refresh handler (bypasses in-memory & HTTP cache via /api/refresh)
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      await refreshHealth();
      window.location.reload();
    } catch {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshHealth]);

  // Instant Markdown Export handler
  const handleExportMarkdown = useCallback(() => {
    const link = document.createElement("a");
    link.href = "/api/export-markdown";
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Keyboard shortcut listener: Command+K (refresh) & Command+E (export)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;

      // Command + K or Ctrl + K: Instant Refresh
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        void handleRefresh();
        return;
      }

      // Command + E or Ctrl + E: Export Full Markdown
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        handleExportMarkdown();
        return;
      }

      // Plain 'r' key when not focused on an input
      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        void handleRefresh();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRefresh, handleExportMarkdown]);

  // ─── DataFreshness State (Prompt §2) ───
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
    freshnessText = `Live`;
  }
  // Normal state: no dot, just "Updated Xs ago" — dot only for semantic states

  const kMod = isMac ? "⌘" : "Ctrl+";

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] select-none">
      {/* Left: Clean Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileNav}
          className="p-1.5 rounded md:hidden text-zinc-400 hover:text-white hover:bg-zinc-800"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <h1 className="text-sm md:text-base font-semibold text-white font-sans">
          {pageTitle}
        </h1>
      </div>

      {/* Right: Freshness state + Instant Refresh (⌘K) + Export .md (⌘E) */}
      <div className="flex items-center gap-2.5">
        {isRefreshing ? (
          <span className="text-xs text-[var(--cyan)] font-sans animate-pulse flex items-center gap-1.5">
            <RefreshCw size={12} className="animate-spin" />
            <span>Syncing latest data...</span>
          </span>
        ) : (
          <div className="flex items-center gap-1.5 font-sans text-xs text-zinc-400">
            {statusDot}
            <span className="text-zinc-300">{freshnessText}</span>
          </div>
        )}

        {/* Instant Refresh Button with ⌘K Badge */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={cn(
            "h-7 px-2 rounded flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors border border-transparent hover:border-zinc-700/50 cursor-pointer",
            isRefreshing && "text-zinc-200"
          )}
          title={`Fetch latest data (${kMod}K)`}
          aria-label={`Fetch latest data (${kMod}K)`}
        >
          <RefreshCw size={13} className={cn(isRefreshing && "animate-spin text-[var(--cyan)]")} />
          <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">{kMod}K</span>
        </button>

        {/* Complete Markdown Export Button with ⌘E Badge */}
        <a
          href="/api/export-markdown"
          download
          className="h-7 px-2.5 rounded flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors border border-zinc-800 hover:border-zinc-700 text-xs font-sans font-medium"
          title={`Export complete system dossier (.md) [${kMod}E]`}
        >
          <FileDown size={13} className="text-zinc-400" />
          <span className="hidden sm:inline">Export .md</span>
          <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">{kMod}E</span>
        </a>
      </div>
    </header>
  );
}
