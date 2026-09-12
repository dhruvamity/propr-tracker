"use client";

import React from "react";
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
  X,
  LineChart,
  ShieldCheck,
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
    title: "Risk",
    items: [
      { href: "/live", label: "Monitor", icon: Radio },
      { href: "/rules", label: "Rules & Gate", icon: ShieldCheck },
    ],
  },
  {
    title: "Trading",
    items: [
      { href: "/analytics", label: "Analytics", icon: LineChart },
      { href: "/positions", label: "Positions", icon: TrendingUp },
      { href: "/orders", label: "Orders", icon: ListOrdered },
    ],
  },
  {
    title: "Accounts",
    items: [
      { href: "/accounts", label: "Active", icon: Layers },
      { href: "/accounts?tab=archived", label: "Archived", icon: History },
    ],
  },
  {
    title: "Finance",
    items: [{ href: "/finance", label: "Finance", icon: Wallet }],
  },
  {
    title: "System",
    items: [{ href: "/system", label: "System", icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, mobileNavOpen, setMobileNavOpen } = useShell();

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] select-none">
      {/* ─── 1. Brand Header (Typographic lockup, no cyan box) ─── */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-zinc-900">
        <Link
          href="/"
          onClick={() => isMobile && setMobileNavOpen(false)}
          className="flex items-center gap-2"
        >
          {collapsed && !isMobile ? (
            <span className="font-semibold text-base text-zinc-100 pl-0.5">P</span>
          ) : (
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-wide text-zinc-100">PROPR</span>
              <span className="text-[11px] text-zinc-500 font-sans">Trading Terminal</span>
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

      {/* ─── 2. Grouped Nav Sections ─── */}
      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto font-sans">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {section.title && (!collapsed || isMobile) && (
              <div className="px-2.5 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
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
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
                    isActive
                      ? "border-l-2 border-[var(--cyan)] bg-white/[0.04] text-white font-medium pl-2 rounded-r-md"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
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

      {/* ─── 3. Desktop Collapse Footer (No status bloat) ─── */}
      {!isMobile && (
        <div className="p-2 border-t border-zinc-900">
          <button
            onClick={toggleCollapsed}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full px-2.5 py-2 rounded"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform shrink-0", collapsed && "rotate-180")} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}
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
