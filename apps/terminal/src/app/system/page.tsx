import { fetchDashboardData } from "@/lib/propr-api";
import { Lock, CheckCircle2, Shield } from "lucide-react";
import { SystemTerminalStream } from "@/components/system-terminal-stream";

export const revalidate = 15;

export default async function SystemPage() {
  const { health } = await fetchDashboardData();

  const isWsConnected = health.wsStatus === "CONNECTED";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-sm md:text-base font-semibold text-white tracking-wide">
          System Health
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Connection health and data pipeline status
        </p>
      </div>

      {/* Health Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* REST API */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="uppercase tracking-wider">REST API</span>
            <span className={`w-2 h-2 rounded-full ${
              health.restStatus === "HEALTHY" ? "bg-emerald-400" : "bg-red-500"
            }`} />
          </div>
          <div className={`text-xl font-bold ${
            health.restStatus === "HEALTHY" ? "text-emerald-400" : "text-red-400"
          }`}>
            {health.restStatus}
          </div>
        </div>

        {/* WebSocket */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="uppercase tracking-wider">WebSocket</span>
            <span className={`w-2 h-2 rounded-full ${
              isWsConnected ? "bg-emerald-400" : "bg-amber-400"
            }`} />
          </div>
          <div className={`text-xl font-bold ${
            isWsConnected ? "text-emerald-400" : "text-amber-300"
          }`}>
            {health.wsStatus}
          </div>
          <div className="text-[11px] text-zinc-500">
            {isWsConnected ? "Streaming" : "Fallback active • 15s ISR polling"}
          </div>
        </div>

        {/* Data Pipeline */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="uppercase tracking-wider">Data Pipeline</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">
            FRESH
          </div>
          <div className="text-[11px] text-zinc-500">
            {health.accountCount} accounts synced
          </div>
        </div>
      </div>

      {/* Pipeline + Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pipeline */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3 font-mono text-xs">
          <h2 className="font-semibold text-white border-b border-[var(--border-subtle)] pb-2">
            Pipeline
          </h2>
          {/* Flow visual */}
          <div className="text-center py-2 text-zinc-400">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[var(--cyan)] font-semibold">REST</span>
              <span className="text-zinc-600">→</span>
              <span className="text-zinc-300 font-semibold">CACHE</span>
              <span className="text-zinc-600">→</span>
              <span className="text-white font-semibold">UI</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">↓ 15s polling</div>
          </div>
          <div className="space-y-1 pt-1 border-t border-[var(--border-subtle)]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Accounts</span>
              <span className="text-white font-semibold">{health.accountCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Last sync</span>
              <span className="text-zinc-300">
                {new Date(health.lastSyncAt).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}{" "}IST
              </span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3 font-mono text-xs">
          <h2 className="font-semibold text-white border-b border-[var(--border-subtle)] pb-2 flex items-center gap-1.5">
            <Lock size={14} className="text-zinc-400" />
            Security
          </h2>
          <div className="flex items-center gap-2 py-0.5 text-zinc-300">
            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
            <span>Zero order placement endpoints</span>
          </div>
          <div className="flex items-center gap-2 py-0.5 text-zinc-300">
            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
            <span>Zero mutation capabilities</span>
          </div>
          <div className="flex items-center gap-2 py-0.5 text-zinc-300">
            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
            <span>Server-only credentials</span>
          </div>
          <div className="flex items-center gap-2 py-0.5 text-zinc-300">
            <Shield size={13} className="text-emerald-400 flex-shrink-0" />
            <span>Read-only invariant</span>
          </div>
        </div>
      </div>

      {/* Event Log */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
          Event Log
        </h2>
        <SystemTerminalStream />
      </div>
    </div>
  );
}
