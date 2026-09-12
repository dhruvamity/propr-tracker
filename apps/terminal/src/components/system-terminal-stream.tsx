"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Play, Pause, Trash2, ArrowDownCircle, Wifi, ShieldAlert } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "INFO" | "MARK" | "HEARTBEAT" | "AUTH" | "RISK" | "REST" | "ORDER";
  channel: string;
  message: string;
  data?: Record<string, unknown>;
}

const INITIAL_LOGS: LogEntry[] = [
  {
    id: "log-1",
    timestamp: "23:58:10.104",
    type: "INFO",
    channel: "GATEWAY",
    message: "Initializing WebSocket client connection to wss://api.propr.xyz/ws",
  },
  {
    id: "log-2",
    timestamp: "23:58:10.142",
    type: "AUTH",
    channel: "AUTH",
    message: "Handshake established. Sent header X-Builder-Code: verified.",
  },
  {
    id: "log-3",
    timestamp: "23:58:10.198",
    type: "INFO",
    channel: "GATEWAY",
    message: "Session authenticated. Subscribed to topics: ['marks.all', 'account.delta', 'fills.stream']",
  },
  {
    id: "log-4",
    timestamp: "23:58:12.305",
    type: "MARK",
    channel: "MARK_PRICE",
    message: "mark.updated",
    data: { symbol: "xyz:BTC-USDT", markPrice: "68,432.50", indexPrice: "68,430.10", fundingRate: "0.000100" },
  },
  {
    id: "log-5",
    timestamp: "23:58:14.882",
    type: "MARK",
    channel: "MARK_PRICE",
    message: "mark.updated",
    data: { symbol: "xyz:ETH-USDT", markPrice: "3,542.80", indexPrice: "3,541.25", fundingRate: "0.000085" },
  },
  {
    id: "log-6",
    timestamp: "23:58:16.120",
    type: "ORDER",
    channel: "UPSTREAM_FILL",
    message: "Observed order.filled event",
    data: { orderId: "ord-88392", asset: "xyz:BTC-USDT", side: "BUY", fillPrice: "68,430.00", quantity: "0.05", status: "FILLED" },
  },
  {
    id: "log-7",
    timestamp: "23:58:18.420",
    type: "RISK",
    channel: "RISK_ENGINE",
    message: "Invariants checked: Decimal.js exact precision active. 0 floating-point drift detected.",
  },
  {
    id: "log-8",
    timestamp: "23:58:20.012",
    type: "HEARTBEAT",
    channel: "PING_PONG",
    message: '{"op":"ping"} -> {"op":"pong","rtt_ms":14,"server_time":1789150000}',
  },
  {
    id: "log-9",
    timestamp: "23:58:24.118",
    type: "REST",
    channel: "REST_SYNC",
    message: "GET /v1/challenge-attempts 200 OK (latency: 38ms, cache: hit)",
  },
  {
    id: "log-10",
    timestamp: "23:58:28.940",
    type: "MARK",
    channel: "MARK_PRICE",
    message: "mark.updated",
    data: { symbol: "xyz:SOL-USDT", markPrice: "178.45", indexPrice: "178.38", fundingRate: "0.000120" },
  },
  {
    id: "log-11",
    timestamp: "23:58:32.405",
    type: "RISK",
    channel: "RISK_ENGINE",
    message: "Drawdown limit check passed: Equity above breach floor ($9,700.00). Buffer: $473.67.",
  },
];

const STREAM_TEMPLATES = [
  {
    type: "MARK" as const,
    channel: "MARK_PRICE",
    message: "mark.updated",
    getData: () => {
      const symbols = [
        { sym: "xyz:BTC-USDT", base: 68430, spread: 5 },
        { sym: "xyz:ETH-USDT", base: 3540, spread: 1.5 },
        { sym: "xyz:SOL-USDT", base: 178.2, spread: 0.4 },
      ];
      const s = symbols[Math.floor(Math.random() * symbols.length)];
      const mark = (s.base + (Math.random() * 4 - 2)).toFixed(2);
      const index = (Number(mark) - (Math.random() * 0.8 - 0.4)).toFixed(2);
      return { symbol: s.sym, markPrice: mark, indexPrice: index, fundingRate: "0.000100" };
    },
  },
  {
    type: "ORDER" as const,
    channel: "UPSTREAM_FILL",
    message: "Observed order.filled event",
    getData: () => {
      const assets = ["xyz:BTC-USDT", "xyz:ETH-USDT", "xyz:SOL-USDT"];
      const asset = assets[Math.floor(Math.random() * assets.length)];
      return {
        orderId: `ord-${Math.floor(Math.random() * 90000 + 10000)}`,
        asset,
        side: Math.random() > 0.5 ? "BUY" : "SELL",
        fillPrice: asset.includes("BTC") ? "68,432.00" : asset.includes("ETH") ? "3,541.50" : "178.30",
        quantity: asset.includes("BTC") ? "0.02" : "0.50",
        status: "FILLED",
      };
    },
  },
  {
    type: "HEARTBEAT" as const,
    channel: "PING_PONG",
    message: () => `{"op":"ping"} -> {"op":"pong","rtt_ms":${Math.floor(Math.random() * 8 + 11)},"ts":${Date.now()}}`,
  },
  {
    type: "RISK" as const,
    channel: "RISK_ENGINE",
    message: () => "Intraday risk check completed: 0 breach triggers. All margin rules satisfied.",
  },
  {
    type: "REST" as const,
    channel: "REST_SYNC",
    message: () => `Incremental background sync OK. Next ISR revalidation in 15s. (HTTP 200, latency: ${Math.floor(Math.random() * 25 + 25)}ms)`,
  },
];

function JsonHighlight({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  return (
    <span className="font-mono text-xs bg-zinc-950/90 px-2 py-0.5 rounded border border-zinc-800/80 inline-block ml-2 select-text">
      <span className="text-zinc-500">{"{"}</span>
      {entries.map(([key, val], idx) => {
        let valColor = "text-zinc-200";
        if (typeof val === "number" || (!isNaN(Number(val)) && !isNaN(parseFloat(String(val))))) {
          valColor = "text-amber-300";
        } else if (typeof val === "boolean") {
          valColor = "text-purple-400";
        } else if (String(val).startsWith("+") || String(val) === "FILLED" || String(val) === "BUY") {
          valColor = "text-emerald-400";
        } else if (String(val).startsWith("-") || String(val) === "SELL") {
          valColor = "text-red-400";
        } else if (key.includes("symbol") || key.includes("asset")) {
          valColor = "text-[var(--cyan)]";
        }

        return (
          <span key={key}>
            <span className="text-zinc-400 font-normal">"{key}"</span>
            <span className="text-zinc-500">: </span>
            <span className={`${valColor} font-medium`}>
              {typeof val === "string" ? `"${val}"` : String(val)}
            </span>
            {idx < entries.length - 1 && <span className="text-zinc-500">, </span>}
          </span>
        );
      })}
      <span className="text-zinc-500">{"}"}</span>
    </span>
  );
}

function renderMessage(message: string) {
  if (message.includes("mark.updated")) {
    return <span className="text-[var(--cyan)] font-medium">{message}</span>;
  }
  if (message.includes("Observed order.filled event") || message.includes("order.filled")) {
    return <span className="text-emerald-400 font-semibold">{message}</span>;
  }
  if (message.includes("breach") || message.includes("CRITICAL") || message.includes("Breach")) {
    return <span className="text-red-400 font-semibold">{message}</span>;
  }
  if (message.includes("Drawdown limit") || message.includes("Invariants checked")) {
    return <span className="text-purple-300 font-medium">{message}</span>;
  }
  if (message.includes("GET") || message.includes("200 OK")) {
    return <span className="text-blue-300 font-mono">{message}</span>;
  }
  if (message.includes("Handshake") || message.includes("ping")) {
    return <span className="text-zinc-400">{message}</span>;
  }
  return <span className="text-zinc-200">{message}</span>;
}

export function SystemTerminalStream() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [isStreaming, setIsStreaming] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const streamEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;

      const template = STREAM_TEMPLATES[Math.floor(Math.random() * STREAM_TEMPLATES.length)];
      const newEntry: LogEntry = {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: timeStr,
        type: template.type,
        channel: template.channel,
        message: typeof template.message === "function" ? template.message() : template.message,
        data: template.getData ? template.getData() : undefined,
      };

      setLogs((prev) => [...prev.slice(-90), newEntry]);
    }, 3200);

    return () => clearInterval(interval);
  }, [isStreaming]);

  useEffect(() => {
    if (autoScroll && streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((l) => {
    if (filter === "ALL") return true;
    return l.type === filter;
  });

  const getBadgeColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "MARK":
        return "bg-cyan-950/70 text-[var(--cyan)] border-cyan-800/50";
      case "ORDER":
        return "bg-emerald-950/70 text-emerald-400 border-emerald-800/50";
      case "HEARTBEAT":
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
      case "RISK":
        return "bg-purple-950/70 text-purple-400 border-purple-800/50";
      case "AUTH":
        return "bg-amber-950/70 text-amber-400 border-amber-800/50";
      case "REST":
        return "bg-blue-950/70 text-blue-400 border-blue-800/50";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-black shadow-2xl overflow-hidden font-mono text-xs">
      {/* Terminal Titlebar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
          </div>
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs tracking-wider uppercase">
            <Terminal size={14} className="text-zinc-400" />
            <span>propr-ws-gateway / event-stream.log</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            <Wifi size={11} className="text-emerald-400 animate-pulse" />
            <span>wss://api.propr.xyz/ws (20s heartbeat)</span>
          </div>
        </div>

        {/* Controls & Filter */}
        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 text-xs">
            {(["ALL", "MARK", "ORDER", "RISK", "HEARTBEAT", "REST"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filter === cat
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stream Pause/Play */}
          <button
            type="button"
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold transition-all ${
              isStreaming
                ? "bg-amber-950/40 text-amber-300 border-amber-800/40 hover:bg-amber-900/40"
                : "bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/40"
            }`}
          >
            {isStreaming ? (
              <>
                <Pause size={11} />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play size={11} />
                <span>RESUME</span>
              </>
            )}
          </button>

          {/* Autoscroll toggle */}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded border text-xs transition-colors ${
              autoScroll
                ? "bg-zinc-800 text-white border-zinc-700"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
            }`}
            title={autoScroll ? "Auto-scroll: ON" : "Auto-scroll: OFF"}
          >
            <ArrowDownCircle size={13} />
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={() => setLogs([])}
            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
            title="Clear Console"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Stream Output Viewport (13px font, 1.6 line-height, expanded height) */}
      <div className="h-[520px] md:h-[560px] overflow-y-auto p-3 space-y-1.5 bg-black/95 text-[13px] leading-[1.6] select-text">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-400 text-xs">
            No events match the selected category.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2.5 hover:bg-zinc-900/50 px-2 py-0.5 rounded transition-colors"
            >
              <span className="text-zinc-500 shrink-0 select-none text-xs">[{log.timestamp}]</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 ${getBadgeColor(
                  log.type
                )}`}
              >
                {log.channel}
              </span>
              <div className="break-all flex-1">
                {renderMessage(log.message)}
                {log.data && <JsonHighlight data={log.data} />}
              </div>
            </div>
          ))
        )}
        <div ref={streamEndRef} />
      </div>

      {/* Terminal Footer Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-t border-zinc-900 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? "bg-[var(--cyan)]" : "bg-amber-500"}`} />
            STATUS: <strong className={isStreaming ? "text-[var(--cyan)]" : "text-amber-400"}>{isStreaming ? "POLLING" : "PAUSED"}</strong>
          </span>
          <span>FALLBACK: ISR 15s</span>
          <span>BUFFERED: {logs.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldAlert size={12} className="text-zinc-400" />
          <span>READ-ONLY INVARIANT ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
