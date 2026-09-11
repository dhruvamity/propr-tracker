import { fetchDashboardData } from "@/lib/propr-api";
import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { RiskCard } from "@/components/risk-card";
import { formatUSD, formatShortId } from "@/lib/utils";

export const revalidate = 15;

const MARKET_SPECS = [
  { symbol: "BTC", name: "Bitcoin Perpetual", markPrice: "$68,432.50", change24h: "+2.45%", isPositive: true },
  { symbol: "ETH", name: "Ethereum Perpetual", markPrice: "$3,542.80", change24h: "+1.82%", isPositive: true },
  { symbol: "SOL", name: "Solana Perpetual", markPrice: "$178.45", change24h: "+4.12%", isPositive: true },
  { symbol: "SUI", name: "Sui Perpetual", markPrice: "$1.84", change24h: "-0.65%", isPositive: false },
];

export default async function LiveMonitorPage() {
  const data = await fetchDashboardData();
  const { accounts, health } = data;

  const liveAccounts = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  );

  // Risk Ranking: Sort by breach proximity (lowest remaining buffer first)
  const rankedAccounts = [...liveAccounts].sort((a, b) => {
    const bufA = Number(a.drawdownRemaining || 0);
    const bufB = Number(b.drawdownRemaining || 0);
    return bufA - bufB;
  });

  // Compute max buffer for proportional bars
  const maxBuffer = Math.max(
    ...rankedAccounts.map((a) => Number(a.drawdownRemaining || 0)),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            Breach Proximity Radar
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Ranked by remaining buffer to breach floor
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            {liveAccounts.length} active evaluations
          </span>
        </div>
      </div>

      {/* Breach Distance Ranking Bars (§14) */}
      {rankedAccounts.length > 0 && (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 space-y-3">
          <h2 className="text-[10px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            Breach Distance
          </h2>
          <div className="space-y-2.5">
            {rankedAccounts.map((acc) => {
              const buffer = Number(acc.drawdownRemaining || 0);
              const pct = Math.max(4, (buffer / maxBuffer) * 100);
              return (
                <div key={acc.accountId}>
                  <div className="flex items-baseline justify-between text-xs font-mono mb-1">
                    <span className="text-zinc-300 font-medium">
                      {acc.challengeName || "Starter Turbo"}{" "}
                      <span className="text-zinc-500 text-[10px]">#{formatShortId(acc.accountId).slice(-4)}</span>
                    </span>
                    <span className="text-white font-bold">{formatUSD(buffer)} <span className="text-[10px] font-normal text-zinc-500">USD</span></span>
                  </div>
                  <div className="h-2 w-full bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-zinc-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ranked Risk Cards */}
      {rankedAccounts.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-8">
          <EmptyState
            icon={ShieldCheck}
            title="No Active Accounts"
            description="Active evaluation and funded accounts will appear ranked by breach proximity."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rankedAccounts.map((acc, idx) => (
            <RiskCard key={acc.accountId} account={acc} rank={idx + 1} />
          ))}
        </div>
      )}

      {/* Market Reference */}
      <div>
        <div className="flex items-center justify-between mb-2 text-xs font-mono text-zinc-400">
          <span className="font-semibold tracking-wider uppercase">Market Reference</span>
          <span className="text-[10px] text-zinc-500">Perpetual Mark Prices</span>
        </div>
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 text-[11px] uppercase">
                <th className="py-2 px-3 text-left">Market</th>
                <th className="py-2 px-3 text-right">Price</th>
                <th className="py-2 px-3 text-right">24h</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[12px]">
              {MARKET_SPECS.map((spec) => (
                <tr key={spec.symbol} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 px-3 text-white font-medium">
                    {spec.symbol}
                    <span className="text-zinc-500 ml-1.5 font-normal text-[10px]">{spec.name}</span>
                  </td>
                  <td className="py-2 px-3 text-right text-zinc-200">{spec.markPrice}</td>
                  <td className={`py-2 px-3 text-right font-semibold ${
                    spec.isPositive ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {spec.change24h}
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
