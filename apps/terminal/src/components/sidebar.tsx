"use client";

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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "OVERVIEW", icon: LayoutDashboard },
  { href: "/live", label: "LIVE", icon: Radio },
  { href: "/accounts", label: "ACCOUNTS", icon: Layers },
  { href: "/positions", label: "POSITIONS", icon: TrendingUp },
  { href: "/orders", label: "ORDERS", icon: ListOrdered },
  { href: "/finance", label: "FINANCE", icon: Wallet },
  { href: "/history", label: "HISTORY", icon: History },
  { href: "/system", label: "SYSTEM", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r transition-all duration-300",
        "bg-[var(--bg-secondary)] border-[var(--border-primary)]",
        collapsed ? "w-14" : "w-52"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-[var(--border-primary)]">
        <div className="w-6 h-6 rounded bg-[var(--cyan)] flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0">
          P
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold tracking-widest text-[var(--text-primary)] truncate">
              PROPR
            </span>
            <span className="text-[9px] tracking-wider text-[var(--text-muted)]">
              TERMINAL
            </span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium tracking-wider transition-all",
                "hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
                isActive
                  ? "bg-cyan-950/40 text-[var(--cyan)] border-r-2 border-[var(--cyan)] shadow-[inset_0_0_12px_rgba(0,229,255,0.06)] font-semibold"
                  : "text-[var(--text-secondary)]"
              )}
            >
              <Icon size={14} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-3 border-t border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Connection Status */}
      <div className="px-3 py-3 border-t border-[var(--border-primary)]">
        <div className="flex items-center gap-2">
          <div className="live-dot" />
          {!collapsed && (
            <span className="text-[9px] tracking-wider text-[var(--text-muted)]">
              PROPR API
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
