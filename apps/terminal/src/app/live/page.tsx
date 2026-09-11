import { fetchDashboardData } from "@/lib/propr-api";
import { Radio, Scale, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { RiskCard } from "@/components/risk-card";

export const revalidate = 15;

const MARKET_SPECS = [
  {
    symbol: "xyz:BTC-USDT",
    name: "Bitcoin Perpetual",
    markPrice: "$68,432.50",
    change24h: "+2.45%",
    isPositive: true,
    maxLeverage: "100x",
    tickSize: "0.10",
    funding8h: "+0.0100%",
  },
  {
    symbol: "xyz:ETH-USDT",
    name: "Ethereum Perpetual",
    markPrice: "$3,542.80",
    change24h: "+1.82%",
    isPositive: true,
    maxLeverage: "100x",
    tickSize: "0.01",
    funding8h: "+0.0085%",
  },
  {
    symbol: "xyz:SOL-USDT",
    name: "Solana Perpetual",
    markPrice: "$178.45",
    change24h: "+4.12%",
    isPositive: true,
    maxLeverage: "50x",
    tickSize: "0.01",
    funding8h: "+0.0120%",
  },
  {
    symbol: "xyz:SUI-USDT",
    name: "Sui Perpetual",
    markPrice: "$1.84",
    change24h: "-0.65%",
    isPositive: false,
    maxLeverage: "25x",
    tickSize: "0.0001",
    funding8h: "+0.0050%",
  },
];

export default async function LiveMonitorPage() {
  const data = await fetchDashboardData();
  const { accounts } = data;

  const liveAccounts = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  );

  // Risk Ranking: Sort by breach proximity (lowest remaining buffer first) (Prompt Requirement §15)
  const rankedAccounts = [...liveAccounts].sort((a, b) => {
    const bufA = Number(a.drawdownRemaining || 0);
    const bufB = Number(b.drawdownRemaining || 0);
    return bufA - bufB;
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm md:text-base font-semibold text-white tracking-wide flex items-center gap-2">
            <Radio size={16} className="text-emerald-400 animate-pulse" />
            Live Risk Radar (Breach Proximity Ranking)
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Accounts ordered by vulnerability to liquidation floors and daily limits.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            {liveAccounts.length} Active Accounts
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            REALTIME RADAR
          </span>
        </div>
      </div>

      {/* Ranked Risk Radar Grid (Prompt §4, §15) */}
      {rankedAccounts.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-12">
          <EmptyState
            icon={Radio}
            title="No Active Accounts"
            description="Active evaluation and funded accounts will appear ranked by breach proximity here."
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rankedAccounts.map((acc, idx) => (
              <RiskCard key={acc.accountId} account={acc} rank={idx + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Propr Perpetual Markets Reference Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-2">
            <Scale size={14} className="text-zinc-400" />
            Perpetual Markets Reference Matrix
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">
            MAX LEVERAGE & FUNDING RATES
          </span>
        </div>

        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 text-[11px] uppercase">
                <th className="py-2.5 px-3 text-left">Market</th>
                <th className="py-2.5 px-3 text-right">Mark Price</th>
                <th className="py-2.5 px-3 text-right">24h Change</th>
                <th className="py-2.5 px-3 text-right">Max Leverage</th>
                <th className="py-2.5 px-3 text-right">Tick Size</th>
                <th className="py-2.5 px-3 text-right">8h Funding</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[12px]">
              {MARKET_SPECS.map((spec) => (
                <tr key={spec.symbol} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 text-left font-semibold text-white">
                    {spec.name}
                    <span className="text-[10px] text-zinc-500 block font-normal">
                      {spec.symbol}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-zinc-200">
                    {spec.markPrice}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-semibold ${
                      spec.isPositive ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {spec.change24h}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-300 font-medium">
                    {spec.maxLeverage}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-400">
                    {spec.tickSize}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-300">
                    {spec.funding8h}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                      <ShieldCheck size={11} />
                      Active
                    </span>
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
