"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Interval,
  Candle,
  Baseline,
  Reading,
  HistoryPoint,
  CONDITION_CONFIG,
} from "./regime-types";
import {
  keyFor,
  rankPercentile,
  percentile,
  extractMetricsHistory,
  labelFor,
  appendCandle,
} from "./regime-calc";
import { RegimeDecisionBanner } from "./regime-decision-banner";
import { RegimeMetricCards } from "./regime-metric-cards";
import { RegimeChart } from "./regime-chart";
import { RegimeSessionTable } from "./regime-session-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Radio } from "lucide-react";

interface RegimeViewProps {
  initialBaseline: Baseline;
}

const INTERVALS: Interval[] = ["5m", "15m", "1h"];

function openLog(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB unavailable"));
    }
    const request = indexedDB.open("btc-regime-log", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("calls", { keyPath: "timestamp" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveCall(record: Record<string, unknown>) {
  try {
    const db = await openLog();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("calls", "readwrite");
      tx.objectStore("calls").put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* Best effort */
  }
}

async function postToServer(record: Record<string, unknown>) {
  try {
    await fetch("/api/regime-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
  } catch {
    /* Best effort */
  }
}

async function getAllCalls(): Promise<Record<string, unknown>[]> {
  try {
    const db = await openLog();
    const rows = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
      const request = db.transaction("calls").objectStore("calls").getAll();
      request.onsuccess = () => resolve(request.result as Record<string, unknown>[]);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return rows;
  } catch {
    return [];
  }
}

async function exportJSON() {
  const rows = await getAllCalls();
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "btc-regime-calls.json";
  a.click();
  URL.revokeObjectURL(url);
}

async function exportCSV() {
  const rows = await getAllCalls();
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const lines = [
    keys.join(","),
    ...rows.map((r) =>
      keys
        .map((k) => {
          const v = r[k];
          return typeof v === "string" && v.includes(",") ? `"${v}"` : String(v ?? "");
        })
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "btc-regime-calls.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadServerLog() {
  const a = document.createElement("a");
  a.href = "/api/regime-log";
  a.download = "regime-log.jsonl";
  a.click();
}

export function RegimeView({ initialBaseline }: RegimeViewProps) {
  const [baseline] = useState<Baseline>(initialBaseline);
  const [candles, setCandles] = useState<Record<Interval, Candle[]>>({
    "5m": [],
    "15m": [],
    "1h": [],
  });
  const [status, setStatus] = useState<"loading" | "live" | "stale" | "error">("loading");
  const [statusMessage, setStatusMessage] = useState(
    "Seeding 7-day historical candle window from Binance..."
  );
  const [chartRange, setChartRange] = useState<"24h" | "48h">("24h");

  const lastMessage = useRef(0);
  const lastLogged = useRef(0);

  // 1. Seed historical candles via Binance Futures REST
  useEffect(() => {
    let cancelled = false;

    async function fetchInterval(interval: Interval): Promise<Candle[]> {
      const now = Date.now();
      if (interval === "5m") {
        try {
          const res1 = await fetch(
            `https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=5m&limit=1008`
          );
          if (!res1.ok) throw new Error("Batch 1 failed");
          const rows1: (number | string)[][] = await res1.json();
          const firstTime = rows1.length ? Number(rows1[0][0]) : 0;
          let rows2: (number | string)[][] = [];
          if (firstTime > 0) {
            try {
              const res2 = await fetch(
                `https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=5m&limit=1008&endTime=${
                  firstTime - 1
                }`
              );
              if (res2.ok) rows2 = await res2.json();
            } catch {
              /* ignore batch 2 error, fallback to rows1 */
            }
          }
          const combined = [...rows2, ...rows1];
          return combined
            .filter((row: (number | string)[]) => Number(row[6]) <= now)
            .map((row: (number | string)[]) => ({
              t: +row[0],
              o: +row[1],
              h: +row[2],
              l: +row[3],
              c: +row[4],
              v: +row[5],
              q: +row[7],
              n: +row[8],
              x: true,
            }));
        } catch {
          const res = await fetch(
            `https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=5m&limit=1000`
          );
          const rows: (number | string)[][] = await res.json();
          return rows
            .filter((row: (number | string)[]) => Number(row[6]) <= now)
            .map((row: (number | string)[]) => ({
              t: +row[0],
              o: +row[1],
              h: +row[2],
              l: +row[3],
              c: +row[4],
              v: +row[5],
              q: +row[7],
              n: +row[8],
              x: true,
            }));
        }
      }

      const limit = interval === "15m" ? 672 : 168;
      const res = await fetch(
        `https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`
      );
      if (!res.ok) throw new Error(`History request failed for ${interval}`);
      const rows: (number | string)[][] = await res.json();
      return rows
        .filter((row: (number | string)[]) => Number(row[6]) <= now)
        .map((row: (number | string)[]) => ({
          t: +row[0],
          o: +row[1],
          h: +row[2],
          l: +row[3],
          c: +row[4],
          v: +row[5],
          q: +row[7],
          n: +row[8],
          x: true,
        }));
    }

    Promise.all(
      INTERVALS.map(async (interval) => {
        const closed = await fetchInterval(interval);
        if (!cancelled) {
          setCandles((prev) => ({ ...prev, [interval]: closed }));
        }
      })
    )
      .then(() => {
        if (!cancelled) {
          setStatusMessage("Rolling 7-day adaptive baseline loaded. Connecting WebSocket stream...");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatusMessage("Binance REST seed connection failed. Check network access.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Binance Futures Combined WebSocket Stream
  useEffect(() => {
    const streams = INTERVALS.map((x) => `btcusdt@kline_${x}`).join("/");
    let socket: WebSocket | undefined;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout>;

    const connect = () => {
      socket = new WebSocket(`wss://fstream.binance.com/stream?streams=${streams}`);
      socket.onopen = () => {
        retry = 0;
        lastMessage.current = Date.now();
        setStatus("live");
        setStatusMessage("Binance Futures live feed connected. Evaluating strictly on closed bars.");
      };
      socket.onmessage = (event) => {
        const k = JSON.parse(event.data)?.data?.k;
        if (!k) return;
        lastMessage.current = Date.now();
        if (k.x && INTERVALS.includes(k.i as Interval)) {
          const limit = k.i === "5m" ? 2016 : k.i === "15m" ? 672 : 168;
          setCandles((prev) => ({
            ...prev,
            [k.i as Interval]: appendCandle(
              prev[k.i as Interval],
              {
                t: +k.t,
                o: +k.o,
                h: +k.h,
                l: +k.l,
                c: +k.c,
                v: +k.v,
                n: +k.n,
                q: +k.q,
                x: true,
              },
              limit
            ),
          }));
        }
      };
      socket.onclose = () => {
        setStatus("stale");
        setStatusMessage("WebSocket disconnected. Reconnecting...");
        retry = Math.min(retry + 1, 6);
        timer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** retry));
      };
      socket.onerror = () => socket?.close();
    };

    try {
      connect();
    } catch {
      setStatus("error");
      setStatusMessage("Browser WebSocket connection unavailable.");
    }

    const watchdog = setInterval(() => {
      if (lastMessage.current && Date.now() - lastMessage.current > 90_000) {
        setStatus("stale");
        setStatusMessage("No tick received for 90 seconds. Reconnecting feed...");
      }
    }, 15_000);

    return () => {
      clearTimeout(timer);
      clearInterval(watchdog);
      socket?.close();
    };
  }, []);

  // 3. Current Multi-Timeframe Readings
  const readings = useMemo(() => {
    return Object.fromEntries(
      INTERVALS.map((interval) => {
        const spec = baseline.timeframes[interval];
        const candleList = candles[interval];
        if (!spec || !candleList.length) return [interval, null];

        const metricsList = extractMetricsHistory(candleList, spec.lookback);
        if (!metricsList.length) return [interval, null];

        const latest = metricsList.at(-1)!;
        let activity: number;
        let persistence: number;

        if (metricsList.length >= 30) {
          const rollLimit = interval === "5m" ? 2016 : interval === "15m" ? 672 : 168;
          const start = Math.max(0, metricsList.length - rollLimit);
          const subRanges = metricsList.slice(start).map((m) => m.range);
          const subPers = metricsList.slice(start).map((m) => m.persistence);
          activity = rankPercentile(latest.range, subRanges);
          persistence = rankPercentile(latest.persistence, subPers);
        } else {
          const b = spec.hourBaselines[keyFor(new Date(candleList.at(-1)!.t))];
          activity = percentile(latest.range, b?.range ?? []);
          persistence = percentile(latest.persistence, b?.persistence ?? []);
        }

        return [
          interval,
          {
            ...latest,
            activity,
            persistence,
            label: labelFor(activity, persistence, baseline.regimeSpec),
          },
        ];
      })
    ) as Record<Interval, Reading | null>;
  }, [baseline, candles]);

  const primary = readings["5m"];

  // 4. Record closed calls to IndexedDB & Server log
  useEffect(() => {
    const last = candles["5m"].at(-1);
    if (!last || !primary || last.t === lastLogged.current) return;
    lastLogged.current = last.t;
    const record = {
      timestamp: last.t,
      at: new Date(last.t).toISOString(),
      label: primary.label,
      activity: primary.activity,
      persistence: primary.persistence,
      rangeBp: primary.range,
      changePct: primary.change,
      context15m: readings["15m"]?.label ?? "WAIT",
      context1h: readings["1h"]?.label ?? "WAIT",
    };
    saveCall(record);
    postToServer(record);
  }, [candles, primary, readings]);

  // 5. Full 5m History Series for Chart Timeline
  const historySeries: HistoryPoint[] = useMemo(() => {
    const list = candles["5m"];
    const spec = baseline.timeframes["5m"];
    if (!spec || list.length < 13) return [];

    const metricsList = extractMetricsHistory(list, 12);
    const allRanges = metricsList.map((m) => m.range);
    const allPers = metricsList.map((m) => m.persistence);

    const points: HistoryPoint[] = [];
    const rollWindow = 2016; // 7-day rolling window

    for (let k = 0; k < metricsList.length; k++) {
      const candleIdx = k + 12;
      const candle = list[candleIdx];
      const winStart = Math.max(0, k - rollWindow + 1);
      const subRanges = allRanges.slice(winStart, k + 1);
      const subPers = allPers.slice(winStart, k + 1);

      let activity: number;
      let persistence: number;

      if (subRanges.length >= 30) {
        activity = rankPercentile(metricsList[k].range, subRanges);
        persistence = rankPercentile(metricsList[k].persistence, subPers);
      } else {
        const key = keyFor(new Date(candle.t));
        const b = spec.hourBaselines[key];
        activity = percentile(metricsList[k].range, b?.range ?? []);
        persistence = percentile(metricsList[k].persistence, b?.persistence ?? []);
      }

      const label = labelFor(activity, persistence, baseline.regimeSpec);
      const d = new Date(candle.t);
      const istLabel = d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      points.push({
        t: candle.t,
        price: candle.c,
        activity,
        persistence,
        label,
        istLabel,
      });
    }
    return points;
  }, [candles, baseline]);

  // 6. Summary Stats & Streak
  const stats = useMemo(() => {
    const count = chartRange === "24h" ? 288 : 576;
    const points = historySeries.slice(-count);
    if (!points.length) {
      return {
        deadPct: 0,
        trendPct: 0,
        chopPct: 0,
        grindPct: 0,
        streakText: "—",
      };
    }
    const total = points.length;
    let dead = 0;
    let trend = 0;
    let chop = 0;
    let grind = 0;
    points.forEach((p) => {
      if (p.label === "DEAD") dead++;
      else if (p.label === "TREND") trend++;
      else if (p.label === "CHOP") chop++;
      else if (p.label === "GRIND") grind++;
    });

    const lastLabel = points.at(-1)!.label;
    let streakCount = 0;
    for (let i = points.length - 1; i >= 0; i--) {
      if (points[i].label === lastLabel) streakCount++;
      else break;
    }
    const mins = streakCount * 5;
    const hours = Math.floor(mins / 60);
    const remMin = mins % 60;
    const streakStr = hours > 0 ? `${hours}h ${remMin}m` : `${remMin}m`;

    return {
      deadPct: Math.round((dead / total) * 100),
      trendPct: Math.round((trend / total) * 100),
      chopPct: Math.round((chop / total) * 100),
      grindPct: Math.round((grind / total) * 100),
      streakText: `${CONDITION_CONFIG[lastLabel].name} for ${streakStr}`,
    };
  }, [historySeries, chartRange]);

  const lastTimestamp = candles["5m"].at(-1)?.t;
  const istDateStr = lastTimestamp
    ? new Date(lastTimestamp).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) + " IST"
    : "Awaiting sync";

  const hasNoData = status === "error" && !candles["5m"].length;

  return (
    <div className="space-y-6 font-sans">
      {/* ─── 1. Top Control & Telemetry Strip ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white font-mono tracking-tight">BTCUSDT</span>
          <StatusBadge
            label={status === "live" ? "Live stream" : status.toUpperCase()}
            tone={status === "live" ? "buy" : status === "error" ? "red" : "amber"}
          />
          <span className="text-xs font-mono text-[var(--text-secondary)]">{istDateStr}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-sans text-[var(--text-secondary)] hidden md:inline">
            Rolling 7-day adaptive window
          </span>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => exportJSON()}
              className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white transition-colors"
              aria-label="Export regime calls as JSON"
            >
              JSON
            </button>
            <button
              type="button"
              onClick={() => exportCSV()}
              className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white transition-colors"
              aria-label="Export regime calls as CSV"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={downloadServerLog}
              className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white transition-colors"
              aria-label="Download server JSONL log"
            >
              Log
            </button>
          </div>
        </div>
      </div>

      {hasNoData ? (
        <EmptyState
          icon={Radio}
          title="Market Data Offline"
          description="Unable to connect to Binance Futures feed. Please verify your internet connection or network firewall."
        />
      ) : (
        <>
          {/* ─── 2. Core Decision Banner & Timeframe Matrix ─── */}
          <RegimeDecisionBanner
            primary={primary}
            readings={readings}
            streakText={stats.streakText}
          />

          {/* ─── 3. Four Core Metric Cards ─── */}
          <RegimeMetricCards
            primary={primary}
            chartRange={chartRange}
            stats={stats}
          />

          {/* ─── 4. Historical Timeline SVG Chart ─── */}
          <RegimeChart
            historySeries={historySeries}
            chartRange={chartRange}
            onRangeChange={setChartRange}
          />

          {/* ─── 5. Intraday Session Performance Table ─── */}
          <RegimeSessionTable baseline={baseline} />
        </>
      )}

      {/* ─── 6. Footer Telemetry ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)] font-mono">
        <span>{statusMessage}</span>
        <span className="text-[11px] text-[var(--text-muted)]">
          Calibration: Adaptive percentile rank against rolling 7-day volume
        </span>
      </div>
    </div>
  );
}
