import { fetchDashboardData } from "@/lib/propr-api";
import { TrendingUp, ShieldCheck } from "lucide-react";
import { formatUSD, formatShortId, formatAccountTag } from "@/lib/utils";

export const revalidate = 15;

export default async function PositionsPage() {
  const { allPositions, accounts } = await fetchDashboardData();
  const activeCount = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-white tracking-wide">
            Active Positions
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Market exposures across active accounts
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          {allPositions.length} Open
        </span>
      </div>

      {allPositions.length === 0 ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <TrendingUp size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-semibold text-white">
              No Open Positions
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm">
              {activeCount} active accounts are flat. No market exposure currently at risk.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse" />
            <span>Telemetry active · Listening for fills</span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 text-[11px] uppercase">
                <th className="py-2.5 px-3">Asset</th>
                <th className="py-2.5 px-3">Side</th>
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3 text-right">Size</th>
                <th className="py-2.5 px-3 text-right">Entry Price</th>
                <th className="py-2.5 px-3 text-right">Mark Price</th>
                <th className="py-2.5 px-3 text-right">Liq Price</th>
                <th className="py-2.5 px-3 text-right">Margin</th>
                <th className="py-2.5 px-3 text-right">Unrealized PnL</th>
                <th className="py-2.5 px-3 text-right">ROE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[12px]">
              {allPositions.map((pos) => {
                const uPnlNum = Number(pos.unrealizedPnl || 0);
                const isPos = uPnlNum >= 0;

                return (
                  <tr
                    key={pos.positionId}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-white">{pos.asset}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pos.positionSide === "long"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : "bg-red-950/60 text-red-400 border border-red-800/40"
                        }`}
                      >
                        {pos.positionSide ? pos.positionSide.toUpperCase() : "LONG"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300">
                      {formatAccountTag(pos.accountId)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-200">
                      {pos.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      {formatUSD(pos.entryPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-white font-medium">
                      {formatUSD(pos.markPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-400">
                      {pos.liquidationPrice ? formatUSD(pos.liquidationPrice) : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-400">
                      {formatUSD(pos.marginUsed)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                      {isPos ? `+${formatUSD(uPnlNum)}` : `-${formatUSD(Math.abs(uPnlNum))}`}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                      {pos.returnOnEquity ? `${pos.returnOnEquity}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
