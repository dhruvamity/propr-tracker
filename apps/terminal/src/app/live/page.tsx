import { fetchDashboardData } from "@/lib/propr-api";
import { ShieldCheck, Activity, Radio, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { formatUSD, formatPercent, formatShortId, formatAccountTag } from "@/lib/utils";

export const revalidate = 15;

const MARKET_SPECS = [
  {
    symbol: "BTC",
    name: "Bitcoin Perpetual",
    markPrice: "$68,432.50",
    change24h: "+2.45%",
    isPositive: true,
    maxLeverage: "10x ($100k cap)",
    tickSize: "0.10",
    funding8h: "+0.0100%",
  },
  {
    symbol: "ETH",
    name: "Ethereum Perpetual",
    markPrice: "$3,542.80",
    change24h: "+1.82%",
    isPositive: true,
    maxLeverage: "10x ($100k cap)",
    tickSize: "0.01",
    funding8h: "+0.0085%",
  },
  {
    symbol: "SOL",
    name: "Solana Perpetual",
    markPrice: "$178.45",
    change24h: "+4.12%",
    isPositive: true,
    maxLeverage: "2x ($20k cap)",
    tickSize: "0.01",
    funding8h: "+0.0120%",
  },
  {
    symbol: "SUI",
    name: "Sui Perpetual",
    markPrice: "$1.84",
    change24h: "-0.65%",
    isPositive: false,
    maxLeverage: "2x ($10k cap)",
    tickSize: "0.001",
    funding8h: "-0.0025%",
  },
];

export default async function LiveMonitorPage() {
  const data = await fetchDashboardData();
  const { accounts, allPositions } = data;

  const liveAccounts = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  );

  // Risk Ranking: Sort by active breach proximity (lowest effective failure room first)
  const rankedAccounts = [...liveAccounts].sort((a, b) => {
    const dailyRoomA = Number(a.dailyLossRemaining || 0);
    const ddBufferA = Number(a.drawdownRemaining || 0);
    const dailyLimitA = Number(a.dailyLossLimitAmount || 0);
    const dailyUsedA = Number(a.dailyLossUsedAmount || 0);
    const dailyBurnA = dailyLimitA > 0 ? (dailyUsedA / dailyLimitA) * 100 : 0;
    const isDailyA = dailyBurnA >= 70 || (dailyRoomA > 0 && dailyRoomA < ddBufferA);
    const effA = isDailyA ? dailyRoomA : ddBufferA;

    const dailyRoomB = Number(b.dailyLossRemaining || 0);
    const ddBufferB = Number(b.drawdownRemaining || 0);
    const dailyLimitB = Number(b.dailyLossLimitAmount || 0);
    const dailyUsedB = Number(b.dailyLossUsedAmount || 0);
    const dailyBurnB = dailyLimitB > 0 ? (dailyUsedB / dailyLimitB) * 100 : 0;
    const isDailyB = dailyBurnB >= 70 || (dailyRoomB > 0 && dailyRoomB < ddBufferB);
    const effB = isDailyB ? dailyRoomB : ddBufferB;

    return effA - effB;
  });

  return (
    <div className="space-y-6">
      {/* ─── 1. Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm md:text-base font-semibold text-white tracking-wide flex items-center gap-2">
            <span>Risk Radar</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE RADAR
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time breach monitor ranked by binding failure threshold
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            {liveAccounts.length} active evaluations monitored
          </span>
        </div>
      </div>

      {/* ─── 2. Binding-Limit Risk Cards (Rule of One) ─────────── */}
      {rankedAccounts.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-8">
          <EmptyState
            icon={ShieldCheck}
            title="No Active Accounts"
            description="Active evaluation and funded accounts will appear ranked by nearest failure limit."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rankedAccounts.map((acc, idx) => {
            const ddBuffer = Number(acc.drawdownRemaining || 0);
            const dailyRoom = Number(acc.dailyLossRemaining || 0);
            const dailyLimit = Number(acc.dailyLossLimitAmount || 0);
            const dailyUsed = Number(acc.dailyLossUsedAmount || 0);
            const dailyBurn = dailyLimit > 0 ? Math.min(100, Math.max(0, (dailyUsed / dailyLimit) * 100)) : 0;
            const ddConsumed = Number(acc.drawdownLimitConsumedPercent || 0);

            const isDailyConstrained = dailyBurn >= 70 || (dailyRoom > 0 && dailyRoom < ddBuffer);
            const bindingRoom = isDailyConstrained ? dailyRoom : ddBuffer;
            const bindingLimitName = isDailyConstrained ? "daily-loss floor" : "drawdown floor";
            const pctUsed = isDailyConstrained ? dailyBurn : ddConsumed;
            const consumedAmount = isDailyConstrained ? dailyUsed : Number(acc.drawdownUsedAmount || 0);
            const totalBudget = isDailyConstrained ? dailyLimit : Number(acc.maxDrawdownAmount || 0);

            // Semantic Color & Status Logic
            let statusText = "SAFE";
            let statusBadgeClass = "bg-emerald-950/60 text-emerald-400 border-emerald-800/50";
            let barColor = "bg-emerald-500";

            if (acc.stage === "BREACHED" || acc.stage === "FAILED" || pctUsed >= 100) {
              statusText = "BREACHED";
              statusBadgeClass = "bg-red-950/80 text-red-400 border-red-800";
              barColor = "bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.7)]";
            } else if (pctUsed >= 90) {
              statusText = "CRITICAL";
              statusBadgeClass = "bg-red-950/80 text-red-400 border-red-800";
              barColor = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]";
            } else if (pctUsed >= 75) {
              statusText = "CRITICAL";
              statusBadgeClass = "bg-orange-950/80 text-orange-400 border-orange-800";
              barColor = "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]";
            } else if (pctUsed >= 50) {
              statusText = "CAUTION";
              statusBadgeClass = "bg-amber-950/60 text-amber-400 border-amber-800/50";
              barColor = "bg-amber-500";
            }

            return (
              <div
                key={acc.accountId}
                className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-4"
              >
                {/* Zone 1: Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono font-bold text-zinc-400 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-white text-sm">
                      {acc.challengeName || "Starter Turbo"}
                    </span>
                    <span className="text-zinc-400 font-mono text-xs">
                      {formatAccountTag(acc.accountId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 uppercase">
                      {acc.stage}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${statusBadgeClass}`}>
                      {statusText}
                    </span>
                  </div>
                </div>

                {/* Zone 2: Hero Stat — Binding Limit Failure Room (24px+) */}
                <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
                    Binding Failure Room ({bindingLimitName})
                  </span>
                  <div className="flex items-baseline gap-2 font-mono">
                    <span className={`text-2xl font-bold tracking-tight ${
                      pctUsed >= 75 ? "text-red-400" : pctUsed >= 50 ? "text-amber-400" : "text-white"
                    }`}>
                      {formatUSD(bindingRoom)}
                    </span>
                    <span className="text-xs text-zinc-400 font-normal">
                      remaining before breach
                    </span>
                  </div>
                </div>

                {/* Zone 3: Single Consumed Loss Budget Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">
                      Consumed Loss Budget
                    </span>
                    <span className="text-zinc-200 font-semibold">
                      {formatUSD(consumedAmount)} of {formatUSD(totalBudget)}{" "}
                      <span className="text-zinc-400 font-normal">({pctUsed.toFixed(0)}% used)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(100, Math.max(2, pctUsed))}%` }}
                    />
                  </div>
                </div>

                {/* Zone 4: Key Financial Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Equity</span>
                    <span className="font-semibold text-white">{formatUSD(acc.equity || acc.balance)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Daily Floor</span>
                    <span className="text-zinc-300 font-medium">
                      {acc.dailyLossFloor ? formatUSD(acc.dailyLossFloor) : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Drawdown Room</span>
                    <span className="text-zinc-300 font-medium">{formatUSD(ddBuffer)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Profit Target</span>
                    <span className="text-emerald-400 font-semibold">
                      +{formatPercent(acc.profitTargetPct, 2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 3. Active Position Exposure ───────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-2">
            <Activity size={14} className="text-zinc-400" />
            <span>Position Exposure</span>
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            {allPositions.length} open position{allPositions.length === 1 ? "" : "s"}
          </span>
        </div>

        {allPositions.length === 0 ? (
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                  <Activity size={20} className="text-zinc-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold text-white">
                      Portfolio Flat · Zero Open Positions
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-zinc-400 border border-zinc-800">
                      0.00x LEVERAGE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    No active positions across accounts. Capital resting safely in margin balance.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs text-zinc-400">
                <span className="px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-800">
                  Exposure: <strong className="text-white">$0.00</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-800">
                  Liquidation Risk: <strong className="text-emerald-400">NONE</strong>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allPositions.map((pos) => {
              const uPnlNum = Number(pos.unrealizedPnl || 0);
              const isPos = uPnlNum >= 0;
              const entry = Number(pos.entryPrice || 0);
              const mark = Number(pos.markPrice || 0);
              const liq = Number(pos.liquidationPrice || 0);
              const liqDistance = liq > 0 ? Math.abs(mark - liq) : 0;

              return (
                <div
                  key={pos.positionId}
                  className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 font-mono space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{pos.asset}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pos.positionSide === "long"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : "bg-red-950/60 text-red-400 border border-red-800/40"
                        }`}
                      >
                        {pos.positionSide.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-zinc-400 text-xs">
                      {formatAccountTag(pos.accountId)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Size</span>
                      <span className="text-zinc-200 font-medium">{pos.quantity}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Entry Price</span>
                      <span className="text-zinc-300">{formatUSD(pos.entryPrice)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Mark Price</span>
                      <span className="text-white font-semibold">{formatUSD(pos.markPrice)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Unrealized P&L</span>
                      <span className={`font-semibold ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                        {isPos ? `+${formatUSD(uPnlNum)}` : `-${formatUSD(Math.abs(uPnlNum))}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
                    <span>
                      Margin: <strong className="text-zinc-200">{formatUSD(pos.marginUsed)}</strong>
                    </span>
                    <span>
                      Liq Price:{" "}
                      <strong className="text-amber-400">
                        {pos.liquidationPrice ? formatUSD(pos.liquidationPrice) : "—"}
                      </strong>
                      {liqDistance > 0 && (
                        <span className="text-zinc-500 ml-1">({formatUSD(liqDistance)} room)</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 4. Live Market Reference Feed ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            <Radio size={14} className="text-emerald-400 animate-pulse" />
            <span>Market Tick Feed</span>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            Perpetual Contract Specs & 8h Funding
          </span>
        </div>

        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 text-[11px] uppercase">
                <th className="py-2.5 px-3 text-left">Market</th>
                <th className="py-2.5 px-3 text-right">Mark Price</th>
                <th className="py-2.5 px-3 text-right">24h Change</th>
                <th className="py-2.5 px-3 text-right">8h Funding</th>
                <th className="py-2.5 px-3 text-right">Max Leverage</th>
                <th className="py-2.5 px-3 text-right">Tick Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
              {MARKET_SPECS.map((spec) => (
                <tr key={spec.symbol} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 text-white font-medium">
                    {spec.symbol}
                    <span className="text-zinc-400 ml-1.5 font-normal">{spec.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-white">{spec.markPrice}</td>
                  <td className={`py-2.5 px-3 text-right font-semibold ${
                    spec.isPositive ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {spec.change24h}
                  </td>
                  <td className={`py-2.5 px-3 text-right ${
                    spec.funding8h.startsWith("+") ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {spec.funding8h}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-300 font-medium">
                    {spec.maxLeverage}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-400">
                    {spec.tickSize}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
