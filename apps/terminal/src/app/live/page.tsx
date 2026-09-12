import { fetchDashboardData } from "@/lib/propr-api";
import { ShieldCheck, Activity } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { RiskCard } from "@/components/risk-card";
import { formatUSD, formatAccountTag } from "@/lib/utils";

export const revalidate = 15;

const MARKET_SPECS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    markPrice: "$68,432.50",
    change24h: "+2.45%",
    isPositive: true,
    maxLeverage: "10x",
    tickSize: "0.10",
    funding8h: "+0.0100%",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    markPrice: "$3,542.80",
    change24h: "+1.82%",
    isPositive: true,
    maxLeverage: "10x",
    tickSize: "0.01",
    funding8h: "+0.0085%",
  },
  {
    symbol: "SOL",
    name: "Solana",
    markPrice: "$178.45",
    change24h: "+4.12%",
    isPositive: true,
    maxLeverage: "2x",
    tickSize: "0.01",
    funding8h: "+0.0120%",
  },
  {
    symbol: "SUI",
    name: "Sui",
    markPrice: "$1.84",
    change24h: "-0.65%",
    isPositive: false,
    maxLeverage: "2x",
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
      {/* ─── 1. Header (Prompt §9 & §10: No duplicate Risk header, quiet count line) ─── */}
      <div className="flex items-center justify-between text-xs font-sans">
        <span className="text-zinc-400">
          {liveAccounts.length} active
        </span>
        <span className="text-zinc-500">
          Nearest limit first
        </span>
      </div>

      {/* ─── 2. Risk Cards (Prompt §10 & §23) ─── */}
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

      {/* ─── 3. Open Positions (Prompt §12: Position size prominent) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200 font-sans">
            Open positions
          </h2>
          <span className="text-xs font-sans text-zinc-500">
            {allPositions.length}
          </span>
        </div>

        {allPositions.length === 0 ? (
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                  <Activity size={16} />
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

              return (
                <div
                  key={pos.positionId}
                  className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 space-y-3"
                >
                  {/* Position Header: Asset / Side and Account Tag */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-sans">
                      <span className="font-semibold text-zinc-100 text-sm">{pos.asset}</span>
                      <span className="text-zinc-500">/</span>
                      <span
                        className={`text-xs font-semibold uppercase ${
                          pos.positionSide === "long" ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {pos.positionSide}
                      </span>
                    </div>
                    <span className="text-zinc-400 font-mono text-xs">
                      {formatAccountTag(pos.accountId)}
                    </span>
                  </div>

                  {/* Hero Position Size (Prompt §12) */}
                  <div>
                    <div className="text-2xl font-mono font-bold text-white tracking-tight">
                      {pos.quantity} {pos.asset}
                    </div>
                  </div>

                  {/* Supporting Rows */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800/80 text-xs font-sans">
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Entry</span>
                      <span className="font-mono text-zinc-300">{formatUSD(pos.entryPrice)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Mark</span>
                      <span className="font-mono text-zinc-100 font-medium">{formatUSD(pos.markPrice)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">uPnL</span>
                      <span className={`font-mono font-medium ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                        {isPos ? `+${formatUSD(uPnlNum)}` : `-${formatUSD(Math.abs(uPnlNum))}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Liq.</span>
                      <span className="font-mono text-amber-400">
                        {pos.liquidationPrice ? formatUSD(pos.liquidationPrice) : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 4. Markets (Prompt §13 & §29: No duplicate descriptor) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200 font-sans">
            Markets
          </h2>
        </div>

        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="divide-y divide-[var(--border-subtle)] text-xs font-sans">
            {MARKET_SPECS.map((spec) => (
              <div
                key={spec.symbol}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-100 font-sans">{spec.symbol}</span>
                  <span className="text-zinc-400 text-xs">{spec.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-mono font-semibold text-zinc-100">{spec.markPrice}</span>
                  <span
                    className={`font-mono font-semibold w-16 text-right ${
                      spec.isPositive ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {spec.change24h}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
