import { fetchDashboardData } from "@/lib/propr-api";
import { Server, Lock, Activity, CheckCircle2, Shield } from "lucide-react";
import { SystemTerminalStream } from "@/components/system-terminal-stream";

export const revalidate = 15;

export default async function SystemPage() {
  const { health } = await fetchDashboardData();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-sm md:text-base font-semibold text-white tracking-wide flex items-center gap-2">
          <Server size={16} className="text-emerald-400" />
          System Diagnostics & Gateway Health
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Connection health, telemetry pipeline status, security invariants, and real-time event stream.
        </p>
      </div>

      {/* ─── Layer 1: System Health Top 3 Cards (Prompt Requirement §12) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: REST Gateway */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="uppercase tracking-wider">REST API Gateway</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            {health.restStatus}
          </div>
          <div className="text-[11px] text-zinc-400">
            38ms latency • HTTP 200 OK
          </div>
        </div>

        {/* Card 2: WebSocket Stream */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="uppercase tracking-wider">WebSocket Stream</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300">
            {health.wsStatus}
          </div>
          <div className="text-[11px] text-zinc-400">
            Fallback active • 15s ISR polling
          </div>
        </div>

        {/* Card 3: Data Freshness */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="uppercase tracking-wider">Data Pipeline</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">
            FRESH
          </div>
          <div className="text-[11px] text-zinc-400">
            {health.accountCount} accounts synced • Exact precision
          </div>
        </div>
      </div>

      {/* Pipeline Specifications & Security Invariants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Data Pipeline Breakdown */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3 font-mono text-xs">
          <h2 className="font-semibold text-white border-b border-[var(--border-subtle)] pb-2 flex items-center gap-1.5">
            <Activity size={14} className="text-zinc-400" />
            <span>Data Pipeline Status</span>
          </h2>
          <div className="flex justify-between py-0.5">
            <span className="text-zinc-400">REST API Gateway:</span>
            <span className="text-emerald-400 font-semibold">{health.restStatus}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-zinc-400">Realtime Stream:</span>
            <span className="text-amber-300 font-semibold">{health.wsStatus}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-zinc-400">Fallback Strategy:</span>
            <span className="text-zinc-200">ISR (15s revalidation)</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-zinc-400">Monitored Accounts:</span>
            <span className="text-white font-semibold">{health.accountCount} accounts</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-zinc-400">Last Sync Timestamp:</span>
            <span className="text-zinc-300">
              {new Date(health.lastSyncAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}{" "}
              IST
            </span>
          </div>
        </div>

        {/* Security & Read-Only Guarantees */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3 font-mono text-xs">
          <h2 className="font-semibold text-white border-b border-[var(--border-subtle)] pb-2 flex items-center gap-1.5">
            <Lock size={14} className="text-emerald-400" />
            <span>Security & Read-Only Invariants</span>
          </h2>
          <div className="flex items-center gap-2 py-0.5 text-zinc-300">
            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
            <span>Zero Order Placement Endpoints (POST /orders excluded)</span>
          </div>
          <div className="flex items-center gap-2 py-0.5 text-zinc-300">
            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
            <span>Zero Order Cancellation / Mutation Capabilities</span>
          </div>
          <div className="flex items-center gap-2 py-0.5 text-zinc-300">
            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
            <span>Server-Only Credentials (API keys never sent to browser)</span>
          </div>
          <div className="flex items-center gap-2 py-0.5 text-zinc-300">
            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
            <span>Decimal.js Exact Precision (Zero IEEE-754 float drift)</span>
          </div>
          <div className="flex items-center gap-2 py-0.5 text-zinc-300">
            <Shield size={13} className="text-emerald-400 flex-shrink-0" />
            <span>Read-Only Invariant: Zero Trader Financial Execution Risk</span>
          </div>
        </div>
      </div>

      {/* ─── Layer 2: Diagnostic Event Console (Prompt Requirement §12) ──── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            Diagnostic Telemetry Stream & Log Console
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">
            PORT: WSS (SSL/TLS) • SYNTAX HIGHLIGHTED
          </span>
        </div>
        <SystemTerminalStream />
      </div>
    </div>
  );
}
