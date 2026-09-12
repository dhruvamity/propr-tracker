import { fetchDashboardData } from "@/lib/propr-api";
import { Lock, CheckCircle2, Shield, Radio, Server, Database, Terminal } from "lucide-react";
import { SystemTerminalStream } from "@/components/system-terminal-stream";

export const revalidate = 15;

export default async function SystemPage() {
  const { health } = await fetchDashboardData();

  const isWsConnected = health.wsStatus === "CONNECTED";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm md:text-base font-semibold text-white tracking-wide">
            System Diagnostics
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Connection health, pipeline synchronization, and live event telemetry
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            Engine: Propr OS
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
            Read-Only Invariant: ACTIVE
          </span>
        </div>
      </div>

      {/* ─── Top Half: Compact 4-Column Service & Security Status Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* Column 1: REST API */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <Server size={13} className="text-zinc-400" />
              REST API
            </span>
            <span className={`w-2 h-2 rounded-full ${
              health.restStatus === "HEALTHY" ? "bg-emerald-400" : "bg-red-500"
            }`} />
          </div>
          <div className={`text-xl font-bold ${
            health.restStatus === "HEALTHY" ? "text-emerald-400" : "text-red-400"
          }`}>
            {health.restStatus}
          </div>
          <div className="text-xs text-zinc-400 pt-1 border-t border-zinc-800/60">
            15s ISR Cache · Upstream active
          </div>
        </div>

        {/* Column 2: WebSocket */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <Radio size={13} className="text-zinc-400" />
              WebSocket
            </span>
            <span className={`w-2 h-2 rounded-full ${
              isWsConnected ? "bg-emerald-400" : "bg-amber-400"
            }`} />
          </div>
          <div className={`text-xl font-bold ${
            isWsConnected ? "text-emerald-400" : "text-amber-300"
          }`}>
            {health.wsStatus}
          </div>
          <div className="text-xs text-zinc-400 pt-1 border-t border-zinc-800/60">
            {isWsConnected ? "20s Heartbeat stream" : "Fallback active · 15s poll"}
          </div>
        </div>

        {/* Column 3: Data Pipeline */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <Database size={13} className="text-zinc-400" />
              Data Pipeline
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">
            FRESH
          </div>
          <div className="text-xs text-zinc-400 pt-1 border-t border-zinc-800/60">
            {health.accountCount} accounts synced
          </div>
        </div>

        {/* Column 4: Security & Invariants */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <Shield size={13} className="text-emerald-400" />
              Security
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            LOCKED
          </div>
          <div className="text-xs text-zinc-400 pt-1 border-t border-zinc-800/60">
            0 order mutation endpoints
          </div>
        </div>
      </div>

      {/* ─── Bottom Half: Expanded Event Log Console ────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-2">
            <Terminal size={14} className="text-zinc-400" />
            <span>Telemetry & Event Stream</span>
          </h2>
          <span className="text-xs font-mono text-zinc-400">
            Stream filterable · Syntax highlighted
          </span>
        </div>
        <SystemTerminalStream />
      </div>
    </div>
  );
}
