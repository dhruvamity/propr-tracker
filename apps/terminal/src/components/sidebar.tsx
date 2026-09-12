"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  Layers,
  TrendingUp,
  ListOrdered,
  Wallet,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShell } from "./shell-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [{ href: "/", label: "Overview", icon: LayoutDashboard }],
  },
  {
    title: "RISK",
    items: [
      { href: "/live", label: "Monitor", icon: Radio },
    ],
  },
  {
    title: "TRADING",
    items: [
      { href: "/positions", label: "Positions", icon: TrendingUp },
      { href: "/orders", label: "Orders", icon: ListOrdered },
    ],
  },
  {
    title: "ACCOUNTS",
    items: [
      { href: "/accounts", label: "Active", icon: Layers },
      { href: "/accounts?tab=archived", label: "Archived", icon: History },
    ],
  },
  {
    title: "FINANCE",
    items: [{ href: "/finance", label: "Finance", icon: Wallet }],
  },
  {
    title: "SYSTEM",
    items: [{ href: "/system", label: "System", icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, mobileNavOpen, setMobileNavOpen } = useShell();

  const [relativeTime, setRelativeTime] = useState("15s ago");
  const [restHealthy, setRestHealthy] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let lastSync = Date.now() - 15000;

    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.health?.lastSyncAt) {
            lastSync = new Date(data.health.lastSyncAt).getTime();
          }
          setRestHealthy(data.health?.restStatus === "HEALTHY");
        }
      } catch {
        if (isMounted) setRestHealthy(false);
      }
    };

    void fetchHealth();
    const fetchInterval = setInterval(fetchHealth, 30000);

    const updateRelative = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - lastSync) / 1000));
      if (diffSec < 10) setRelativeTime("just now");
      else if (diffSec < 60) setRelativeTime(`${diffSec}s ago`);
      else if (diffSec < 3600) setRelativeTime(`${Math.floor(diffSec / 60)}m ago`);
      else setRelativeTime(`${Math.floor(diffSec / 3600)}h ago`);
    };

    updateRelative();
    const ticker = setInterval(updateRelative, 5000);

    return () => {
      isMounted = false;
      clearInterval(fetchInterval);
      clearInterval(ticker);
    };
  }, []);

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-primary)]">
        <Link
          href="/"
          onClick={() => isMobile && setMobileNavOpen(false)}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-6 h-6 rounded bg-[var(--cyan)] flex items-center justify-center text-[11px] font-bold text-black flex-shrink-0 group-hover:scale-105 transition-transform">
            P
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold tracking-widest text-white truncate">
                PROPR
              </span>
              <span className="text-[9px] tracking-wider text-zinc-400 uppercase font-mono">
                TRADING TERMINAL
              </span>
            </div>
          )}
        </Link>
        {isMobile && (
          <button
            onClick={() => setMobileNavOpen(false)}
            className="p-1 rounded text-zinc-400 hover:text-white"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Grouped Nav Sections */}
      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {section.title && (!collapsed || isMobile) && (
              <div className="px-2.5 py-1 text-[10px] font-mono font-semibold tracking-wider text-zinc-400">
                {section.title}
              </div>
            )}
            {section.items.map(({ href, label, icon: Icon }) => {
              const isArchivedLink = href.includes("tab=archived");
              const isActive =
                href === "/"
                  ? pathname === "/"
                  : isArchivedLink
                  ? pathname === "/accounts" && (typeof window !== "undefined" && window.location.search.includes("tab=archived"))
                  : href === "/accounts"
                  ? pathname === "/accounts" && (typeof window === "undefined" || !window.location.search.includes("tab=archived"))
                  : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => isMobile && setMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs transition-all",
                    isActive
                      ? "border-l-2 border-[var(--cyan)] bg-white/[0.05] text-white font-medium pl-2 shadow-[inset_4px_0_12px_rgba(0,229,255,0.03)]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                  )}
                  title={collapsed && !isMobile ? label : undefined}
                >
                  <Icon
                    size={15}
                    className={cn(
                      "flex-shrink-0",
                      isActive ? "text-white" : "text-zinc-400"
                    )}
                  />
                  {(!collapsed || isMobile) && (
                    <span className="truncate">{label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse Desktop Toggle */}
      {!isMobile && (
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex items-center justify-center py-2.5 border-t border-[var(--border-primary)] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02] transition-colors text-[11px] font-mono"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={14} />
          ) : (
            <div className="flex items-center gap-1.5">
              <ChevronLeft size={14} />
              <span>Collapse</span>
            </div>
          )}
        </button>
      )}

      {/* Bottom Health Indicators */}
      <div className="px-3.5 py-3 border-t border-[var(--border-primary)] bg-black/20 text-[10px] font-mono space-y-1.5">
        <div className="flex items-center gap-2" title={`REST API: ${restHealthy ? "HEALTHY" : "OFFLINE"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${restHealthy ? "bg-emerald-400" : "bg-red-500"}`} />
          {(!collapsed || isMobile) && (
            <span className="text-zinc-400">{restHealthy ? "REST API healthy" : "REST API offline"}</span>
          )}
        </div>
        <div className="flex items-center gap-2" title="Telemetry freshness">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {(!collapsed || isMobile) && (
            <span className="text-zinc-400">Data updated {relativeTime}</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col transition-all duration-300 h-screen shrink-0",
          collapsed ? "w-14" : "w-56"
        )}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-64 max-w-[80vw] h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
