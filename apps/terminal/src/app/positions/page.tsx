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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm md:text-base font-semibold text-white tracking-wide">
            Active Positions
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Market exposures across active accounts
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          {allPositions.length}
        </span>
      </div>

      {allPositions.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5">
            <EmptyState
              icon={TrendingUp}
              title="Flat — No Open Positions"
              description={`${activeCount} active accounts currently hold zero open market exposure.`}
              metrics={{
                activeAccounts: activeCount,
                openPositions: 0,
                openOrders: allOrders.length,
                lastChecked: "Just now",
              }}
            />
          </div>

          {/* Actionable Rulebook Trading Gates */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                Active Account Risk & Sizing Gates
              </h2>
              <span className="text-[11px] font-mono text-zinc-500">
                Rulebook limits based on live buffer
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts
                .filter((a) => a.stage === "EVALUATION" || a.stage === "FUNDED")
                .map((acc) => {
                  const buffer = Number(acc.drawdownRemaining || 0);
                  const maxRisk5Pct = buffer * 0.05;
                  const dailyRoom = Number(acc.dailyLossRemaining || 0);

                  return (
                    <div
                      key={acc.accountId}
                      className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                        <span className="font-semibold text-white">
                          {acc.challengeName || "Evaluation"}
                        </span>
                        <span className="text-zinc-500">
                          {acc.accountId.replace(/^urn:prp-account:/, "").slice(0, 8)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <div className="text-zinc-500">Buffer to floor</div>
                          <div className="text-sm font-bold text-white mt-0.5">
                            {formatUSD(buffer)}
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-500">Max risk / trade (5%)</div>
                          <div className="text-sm font-bold text-emerald-400 mt-0.5">
                            {formatUSD(maxRisk5Pct)}
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-500">Daily room left</div>
                          <div className={`text-sm font-bold mt-0.5 ${dailyRoom < 50 ? "text-amber-400" : "text-zinc-200"}`}>
                            {formatUSD(dailyRoom)}
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-500">Open positions</div>
                          <div className="text-sm font-bold text-zinc-200 mt-0.5">
                            0 / 2 slots
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Leverage & Contract Constraints Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                Perpetual Contract Constraints
              </h2>
              <span className="text-[11px] font-mono text-zinc-500">
                Rulebook specifications
              </span>
            </div>
            <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Contract</th>
                    <th className="py-2.5 px-3">Max Leverage</th>
                    <th className="py-2.5 px-3">Margin Mode</th>
                    <th className="py-2.5 px-3">Stop Loss Requirement</th>
                    <th className="py-2.5 px-3 text-right">Fee Rate (Maker / Taker)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[12px]">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">BTC-PERP</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-semibold">20x max</td>
                    <td className="py-2.5 px-3 text-zinc-300">Cross / Isolated</td>
                    <td className="py-2.5 px-3 text-zinc-400">Mandatory at entry</td>
                    <td className="py-2.5 px-3 text-right text-zinc-300">0.015% / 0.045%</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">ETH-PERP</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-semibold">20x max</td>
                    <td className="py-2.5 px-3 text-zinc-300">Cross / Isolated</td>
                    <td className="py-2.5 px-3 text-zinc-400">Mandatory at entry</td>
                    <td className="py-2.5 px-3 text-right text-zinc-300">0.015% / 0.045%</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">SOL-PERP</td>
                    <td className="py-2.5 px-3 text-amber-400 font-semibold">15x max</td>
                    <td className="py-2.5 px-3 text-zinc-300">Cross / Isolated</td>
                    <td className="py-2.5 px-3 text-zinc-400">Mandatory at entry</td>
                    <td className="py-2.5 px-3 text-right text-zinc-300">0.015% / 0.045%</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">Top 20 Altcoins</td>
                    <td className="py-2.5 px-3 text-zinc-300 font-semibold">10x max</td>
                    <td className="py-2.5 px-3 text-zinc-300">Cross / Isolated</td>
                    <td className="py-2.5 px-3 text-zinc-400">Mandatory at entry</td>
                    <td className="py-2.5 px-3 text-right text-zinc-300">0.015% / 0.045%</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
