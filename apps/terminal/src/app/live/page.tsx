import { fetchDashboardData } from "@/lib/propr-api";
import { ShieldCheck, Activity } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { RiskCard } from "@/components/risk-card";
import { formatUSD, formatAccountTag } from "@/lib/utils";

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
      {/* ─── 1. Header (Prompt §22: Risk · 2 active accounts · Sorted by nearest limit) ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm md:text-base font-semibold text-zinc-100 font-sans">
            Risk
          </h1>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            {liveAccounts.length} active accounts · Sorted by nearest limit
          </p>
        </div>
      </div>

      {/* ─── 2. Risk Cards (Prompt §23: Unified card design) ─── */}
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
          {rankedAccounts.map((acc, idx) => (
            <RiskCard key={acc.accountId} account={acc} rank={idx + 1} />
          ))}
        </div>
      )}

      {/* ─── 3. Open Positions (Prompt §1: Clean terminology) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200 font-sans">
            Open positions
          </h2>
          <span className="text-xs font-sans text-zinc-400">
            {allPositions.length} open position{allPositions.length === 1 ? "" : "s"}
          </span>
        </div>

        {allPositions.length === 0 ? (
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                  <Activity size={18} />
                </div>
                <div>
                  <div className="font-semibold text-zinc-200">
                    Flat · Zero open positions
                  </div>
                  <p className="text-zinc-400 mt-0.5">
                    No active positions across accounts. Capital held in margin balance.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 font-sans text-zinc-400">
                <span className="px-2.5 py-1 rounded bg-zinc-900/60 border border-zinc-800">
                  Exposure: <strong className="font-mono text-zinc-200">$0.00</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-zinc-900/60 border border-zinc-800">
                  Liquidation: <strong className="text-emerald-400 font-medium">None</strong>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allPositions.map((pos) => {
              const uPnlNum = Number(pos.unrealizedPnl || 0);
              const isPos = uPnlNum >= 0;
              const mark = Number(pos.markPrice || 0);
              const liq = Number(pos.liquidationPrice || 0);
              const liqDistance = liq > 0 ? Math.abs(mark - liq) : 0;

              return (
                <div
                  key={pos.positionId}
                  className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-100 text-sm font-sans">{pos.asset}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-sans font-semibold ${
                          pos.positionSide === "long"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : "bg-red-950/60 text-red-400 border border-red-800/40"
                        }`}
                      >
                        {pos.positionSide.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-zinc-400 font-mono text-xs">
                      {formatAccountTag(pos.accountId)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-400 font-sans block text-[11px]">Size</span>
                      <span className="font-mono text-zinc-200 font-medium">{pos.quantity}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 font-sans block text-[11px]">Entry</span>
                      <span className="font-mono text-zinc-300">{formatUSD(pos.entryPrice)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 font-sans block text-[11px]">Mark</span>
                      <span className="font-mono text-zinc-100 font-medium">{formatUSD(pos.markPrice)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 font-sans block text-[11px]">Unrealized P&L</span>
                      <span className={`font-mono font-medium ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                        {isPos ? `+${formatUSD(uPnlNum)}` : `-${formatUSD(Math.abs(uPnlNum))}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs font-sans text-zinc-400">
                    <span>
                      Margin: <span className="font-mono text-zinc-200 font-medium">{formatUSD(pos.marginUsed)}</span>
                    </span>
                    <span>
                      Liquidation:{" "}
                      <span className="font-mono text-amber-400 font-medium">
                        {pos.liquidationPrice ? formatUSD(pos.liquidationPrice) : "—"}
                      </span>
                      {liqDistance > 0 && (
                        <span className="text-zinc-400 font-sans ml-1">({formatUSD(liqDistance)} room)</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 4. Markets (Prompt §1: Clean terminology) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200 font-sans">
            Markets
          </h2>
          <span className="text-xs font-sans text-zinc-400">
            Perpetual contract specs & 8h funding
          </span>
        </div>

        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 font-sans text-xs">
                <th className="py-2.5 px-3 text-left font-normal">Market</th>
                <th className="py-2.5 px-3 text-right font-normal">Mark Price</th>
                <th className="py-2.5 px-3 text-right font-normal">24h Change</th>
                <th className="py-2.5 px-3 text-right font-normal">8h Funding</th>
                <th className="py-2.5 px-3 text-right font-normal">Max Leverage</th>
                <th className="py-2.5 px-3 text-right font-normal">Tick Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">
              {MARKET_SPECS.map((spec) => (
                <tr key={spec.symbol} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 font-sans text-zinc-100 font-medium">
                    {spec.symbol}
                    <span className="text-zinc-400 ml-1.5 font-normal">{spec.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-zinc-100">{spec.markPrice}</td>
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
                  <td className="py-2.5 px-3 text-right text-zinc-300">
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
