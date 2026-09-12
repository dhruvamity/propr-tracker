"use client";

import React, { useState } from "react";
import { Server, Radio, Database, Shield, Terminal, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
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
  message: string;
}

const RECENT_EVENTS: RecentEvent[] = [
  { time: "23:58:32", channel: "Risk Engine", message: "Drawdown check passed: Equity above breach floor" },
  { time: "23:58:28", channel: "REST Sync", message: "8 accounts synchronized" },
  { time: "23:58:24", channel: "Market", message: "SOL mark updated: $178.45" },
  { time: "23:58:20", channel: "Gateway", message: "Heartbeat 14ms" },
  { time: "23:58:16", channel: "Execution", message: "Observed fill: BTC-USDT buy 0.05" },
  { time: "23:58:14", channel: "Market", message: "ETH mark updated: $3,542.80" },
  { time: "23:58:12", channel: "Market", message: "BTC mark updated: $68,432.50" },
  { time: "23:58:10", channel: "Security", message: "Read-only session active. Zero mutations permitted." },
];

export function SystemView({ health }: SystemViewProps) {
  const [showRawStream, setShowRawStream] = useState(false);
  const isWsConnected = health.wsStatus === "CONNECTED";

  return (
    <div className="space-y-6 font-sans">
      {/* ─── 1. Health Summary (Prompt §24: Much quieter, dot + state + metric) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: REST API */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-1.5">
          <div className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <Server size={13} className="text-zinc-500" />
            <span>REST API</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span className={`w-1.5 h-1.5 rounded-full ${health.restStatus === "HEALTHY" ? "bg-emerald-400" : "bg-red-500"}`} />
            <span className={health.restStatus === "HEALTHY" ? "text-white" : "text-red-400"}>
              {health.restStatus === "HEALTHY" ? "Healthy" : "Offline"}
            </span>
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            38ms
          </div>
        </div>

        {/* Card 2: WebSocket Stream */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-1.5">
          <div className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <Radio size={13} className="text-zinc-500" />
            <span>WebSocket</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? "bg-emerald-400" : "bg-zinc-500"}`} />
            <span className="text-white">
              {isWsConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="text-xs text-zinc-500 font-sans">
            {isWsConnected ? "Realtime stream" : "Polling every 15s"}
          </div>
        </div>

        {/* Card 3: Data */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-1.5">
          <div className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <Database size={13} className="text-zinc-500" />
            <span>Data</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-white">Synced</span>
          </div>
          <div className="text-xs text-zinc-500 font-sans">
            {health.accountCount} accounts
          </div>
        </div>

        {/* Card 4: Security (Prompt §23 & §24) */}
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-1.5">
          <div className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <Shield size={13} className="text-zinc-500" />
            <span>Security</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-white">Read-only</span>
          </div>
          <div className="text-xs text-zinc-500 font-sans">
            0 mutations
          </div>
        </div>
      </div>

      {/* ─── 2. Data Flow Summary ─── */}
      <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3">
        <div className="text-xs font-semibold text-zinc-200">
          Data flow
        </div>
        <div className="flex items-center justify-center gap-4 py-3 bg-zinc-950/60 rounded-md border border-zinc-800/60">
          <div className="text-center">
            <span className="text-[var(--cyan)] font-bold text-sm block font-sans">REST API</span>
            <span className="text-[10px] text-zinc-500 font-mono">api.propr.xyz</span>
          </div>
          <ArrowRight size={14} className="text-zinc-600" />
          <div className="text-center">
            <span className="text-white font-bold text-sm block font-sans">CACHE</span>
            <span className="text-[10px] text-zinc-500 font-sans">15s ISR</span>
          </div>
          <ArrowRight size={14} className="text-zinc-600" />
          <div className="text-center">
            <span className="text-emerald-400 font-bold text-sm block font-sans">CLIENT</span>
            <span className="text-[10px] text-zinc-500 font-sans">Decimal.js</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-zinc-400 text-xs pt-1">
          <span>Last sync: <strong className="text-zinc-200 font-mono">{new Date(health.lastSyncAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST</strong></span>
          <span>Mode: <strong className="text-zinc-200 font-sans">{isWsConnected ? "WebSocket Realtime" : "REST 15s Polling"}</strong></span>
        </div>
      </div>

      {/* ─── 3. Recent Events (Prompt §25: Event stream, not admin database table) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Terminal size={14} className="text-zinc-400" />
            <span>Recent events</span>
          </h2>
          <button
            type="button"
            onClick={() => setShowRawStream(!showRawStream)}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--cyan)] hover:text-white transition-colors cursor-pointer"
          >
            <span>{showRawStream ? "Hide raw stream" : "View raw stream"}</span>
            {showRawStream ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Event Stream (Prompt §25: clean stream with subtle separators) */}
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)] text-xs">
          {RECENT_EVENTS.map((evt, idx) => (
            <div
              key={idx}
              className="flex items-baseline gap-4 px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
            >
              <span className="font-mono text-zinc-500 shrink-0 select-none">
                {evt.time}
              </span>
              <span className="font-medium text-zinc-300 w-24 shrink-0 font-sans">
                {evt.channel}
              </span>
              <span className="text-zinc-200 font-mono truncate">
                {evt.message}
              </span>
            </div>
          ))}
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
