import { fetchDashboardData } from "@/lib/propr-api";
import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { formatUSD } from "@/lib/utils";

export const revalidate = 15;

export default async function PositionsPage() {
  const { allPositions, accounts, allOrders } = await fetchDashboardData();
  const activeCount = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  ).length;

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Page Header (Prompt §8) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm md:text-base font-semibold text-white tracking-wide flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" />
            Active Trading Positions
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time market exposures across evaluation and funded accounts.
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          {allPositions.length} POSITIONS
        </span>
      </div>

      {allPositions.length === 0 ? (
        /* Vertically Centered Compact Empty State (Prompt §8 & §10) */
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <div className="w-full max-w-md p-6 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)]">
            <EmptyState
              icon={TrendingUp}
              title="No Open Positions"
              description={`Your ${activeCount} active account${
                activeCount === 1 ? "" : "s"
              } currently ${
                activeCount === 1 ? "has" : "have"
              } no market exposure.`}
              statusBadge="Position stream active"
              metrics={{
                activeAccounts: activeCount,
                openPositions: 0,
                openOrders: allOrders.length,
                lastChecked: "Just now",
              }}
            />
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
                <th className="py-2.5 px-3 text-right">Margin / Mode</th>
                <th className="py-2.5 px-3 text-right">Unrealized PnL</th>
                <th className="py-2.5 px-3 text-right">ROE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[12px]">
              {allPositions.map((pos) => (
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
                      {pos.positionSide.toUpperCase()} {pos.leverage}x
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400">
                    {pos.accountId.replace(/^urn:prp-account:/, "").slice(0, 8)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-white">
                    {pos.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-300">
                    ${pos.entryPrice}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-100 font-semibold">
                    ${pos.markPrice}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-400">
                    {formatUSD(pos.marginUsed)}{" "}
                    <span className="text-[10px] uppercase text-zinc-500">
                      ({pos.marginMode})
                    </span>
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-bold ${
                      Number(pos.unrealizedPnl) >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatUSD(pos.unrealizedPnl)}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-semibold ${
                      Number(pos.returnOnEquity) >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {pos.returnOnEquity}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
