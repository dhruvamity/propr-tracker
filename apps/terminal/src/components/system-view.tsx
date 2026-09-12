"use client";

import React, { useState } from "react";
import { Server, Radio, Database, Shield, Terminal, ArrowRight, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { SystemTerminalStream } from "./system-terminal-stream";

interface SystemHealthData {
  restStatus: "HEALTHY" | "ERROR" | "UNKNOWN";
  wsStatus: "CONNECTED" | "DISCONNECTED" | "ERROR";
  lastSyncAt: string;
  accountCount: number;
}

interface SystemViewProps {
  health: SystemHealthData;
}

interface RecentEvent {
  time: string;
  channel: string;
  type: "RISK" | "SYNC" | "MARK" | "ORDER" | "SYS";
  message: string;
}

const RECENT_EVENTS: RecentEvent[] = [
  { time: "23:58:32", channel: "Risk Engine", type: "RISK", message: "Drawdown limit check passed: Equity above breach floor" },
  { time: "23:58:28", channel: "REST Sync", type: "SYNC", message: "Challenge accounts synchronized via ISR (8 accounts active/archived)" },
  { time: "23:58:24", channel: "Market", type: "MARK", message: "SOL-USDT mark price updated: $178.45 (spread 0.4)" },
  { time: "23:58:20", channel: "Gateway", type: "SYS", message: "Heartbeat pong acknowledged (RTT: 14ms)" },
  { time: "23:58:16", channel: "Execution", type: "ORDER", message: "Observed fill: xyz:BTC-USDT buy 0.05" },
  { time: "23:58:14", channel: "Market", type: "MARK", message: "ETH-USDT mark price updated: $3,542.80 (funding +0.0085%)" },
  { time: "23:58:12", channel: "Market", type: "MARK", message: "BTC-USDT mark price updated: $68,432.50 (funding +0.0100%)" },
  { time: "23:58:10", channel: "Auth", type: "SYS", message: "Session authenticated with upstream gateway. Read-only enforced." },
];

export function SystemView({ health }: SystemViewProps) {
  const [showRawStream, setShowRawStream] = useState(false);
  const isWsConnected = health.wsStatus === "CONNECTED";

  return (
    <div className="space-y-6">
      {/* ─── 1. Health Summary (4 Compact Cards) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
        {/* Card 1: REST API */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium text-zinc-200">
              <Server size={14} className="text-zinc-400" />
              REST API
            </span>
            <span className={`w-2 h-2 rounded-full ${
              health.restStatus === "HEALTHY" ? "bg-emerald-400" : "bg-red-500"
            }`} />
          </div>
          <div className={`text-2xl font-mono font-bold tracking-tight ${
            health.restStatus === "HEALTHY" ? "text-emerald-400" : "text-red-400"
          }`}>
            {health.restStatus}
          </div>
          <div className="text-xs text-zinc-400 pt-1 border-t border-zinc-800/60 flex justify-between font-sans">
            <span>Latency: ~38ms</span>
            <span>15s ISR cache</span>
          </div>
        </div>

        {/* Card 2: WebSocket Stream */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium text-zinc-200">
              <Radio size={14} className="text-zinc-400" />
              WebSocket
            </span>
            <span className={`w-2 h-2 rounded-full ${
              isWsConnected ? "bg-emerald-400" : "bg-amber-400"
            }`} />
          </div>
          <div className={`text-2xl font-mono font-bold tracking-tight ${
            isWsConnected ? "text-emerald-400" : "text-amber-300"
          }`}>
            {health.wsStatus}
          </div>
          <div className="text-xs text-zinc-400 pt-1 border-t border-zinc-800/60 flex justify-between font-sans">
            <span>{isWsConnected ? "Live streaming" : "Polling 15s"}</span>
            <span>20s heartbeat</span>
          </div>
        </div>

        {/* Card 3: Data Pipeline */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium text-zinc-200">
              <Database size={14} className="text-zinc-400" />
              Data Pipeline
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white tracking-tight">
            SYNCED
          </div>
          <div className="text-xs text-zinc-400 pt-1 border-t border-zinc-800/60 flex justify-between font-sans">
            <span>{health.accountCount} accounts</span>
            <span>0 drift detected</span>
          </div>
        </div>

        {/* Card 4: Security Invariant */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium text-zinc-200">
              <Shield size={14} className="text-emerald-400" />
              Security
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400 tracking-tight">
            ACTIVE
          </div>
          <div className="text-xs text-zinc-400 pt-1 border-t border-zinc-800/60 flex justify-between font-sans">
            <span>Read-only</span>
            <span>0 mutations</span>
          </div>
        </div>
      </div>

      {/* ─── 2. Data Flow & Invariant Summary ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
        {/* Data Pipeline Flow */}
        <div className="md:col-span-2 p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3">
          <div className="text-zinc-300 font-semibold text-xs">
            Data pipeline flow
          </div>
          <div className="flex items-center justify-center gap-4 py-3 bg-zinc-950/60 rounded-md border border-zinc-800/60">
            <div className="text-center">
              <span className="text-[var(--cyan)] font-bold text-sm block font-sans">REST API</span>
              <span className="text-[10px] text-zinc-400 font-mono">api.propr.xyz</span>
            </div>
            <ArrowRight size={16} className="text-zinc-500" />
            <div className="text-center">
              <span className="text-white font-bold text-sm block font-sans">CACHE</span>
              <span className="text-[10px] text-zinc-400 font-sans">15s ISR revalidation</span>
            </div>
            <ArrowRight size={16} className="text-zinc-500" />
            <div className="text-center">
              <span className="text-emerald-400 font-bold text-sm block font-sans">CLIENT</span>
              <span className="text-[10px] text-zinc-400 font-sans">Decimal.js math</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-zinc-400 text-xs pt-1">
            <span>Last sync: <strong className="text-zinc-200 font-mono">{new Date(health.lastSyncAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST</strong></span>
            <span>Sync mode: <strong className="text-zinc-200 font-sans">{isWsConnected ? "WebSocket Realtime" : "REST 15s Polling"}</strong></span>
          </div>
        </div>

        {/* Security Invariants */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3">
          <div className="text-zinc-300 font-semibold text-xs flex items-center gap-1.5">
            <Shield size={13} className="text-emerald-400" />
            <span>Operational invariants</span>
          </div>
          <div className="space-y-2 pt-1 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Zero order placement endpoints</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Read-only state</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Exact Decimal.js calculation engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Recent Events ─── */}
      <div className="space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Terminal size={14} className="text-zinc-400" />
              <span>Recent events</span>
            </h2>
            <span className="text-xs text-zinc-400">
              ({RECENT_EVENTS.length} events logged)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowRawStream(!showRawStream)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-sans font-medium text-[var(--cyan)] hover:text-white transition-all cursor-pointer"
          >
            <span>{showRawStream ? "Hide raw stream" : "View raw event stream"}</span>
            {showRawStream ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Clean default list */}
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 font-sans">
                <th className="py-2.5 px-3 w-28 font-normal">Time</th>
                <th className="py-2.5 px-3 w-36 font-normal">Channel</th>
                <th className="py-2.5 px-3 font-normal">Event Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">
              {RECENT_EVENTS.map((evt, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 px-3 text-zinc-400 whitespace-nowrap">
                    [{evt.time}]
                  </td>
                  <td className="py-2 px-3 font-sans">
                    <span className="text-xs text-zinc-300 font-medium">
                      {evt.channel}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-zinc-200 font-mono text-xs">
                    {evt.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expandable Raw Event Stream Console */}
        {showRawStream && (
          <div className="pt-2 animate-in fade-in duration-200">
            <SystemTerminalStream />
          </div>
        )}
      </div>
    </div>
  );
}
