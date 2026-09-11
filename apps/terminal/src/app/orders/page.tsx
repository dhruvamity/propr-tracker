import { fetchDashboardData } from "@/lib/propr-api";
import { ListOrdered } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { formatShortId, formatAccountTag } from "@/lib/utils";

export const revalidate = 15;

export default async function OrdersPage() {
  const { allOrders, accounts, allPositions } = await fetchDashboardData();
  const activeCount = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm md:text-base font-semibold text-white tracking-wide">
            Open Orders
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Resting limit orders & protective stops
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          {allOrders.length}
        </span>
      </div>

      {allOrders.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5">
            <EmptyState
              icon={ListOrdered}
              title="No Resting Orders"
              description={`${activeCount} active accounts currently have zero resting orders or pending stops.`}
              metrics={{
                activeAccounts: activeCount,
                openPositions: allPositions.length,
                openOrders: 0,
                lastChecked: "Just now",
              }}
            />
          </div>

          {/* Pre-Order Execution Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                Execution Rules & Fee Protocol
              </h2>
              <span className="text-[11px] font-mono text-zinc-500">
                Rulebook compliance
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2 font-mono text-xs">
                <div className="text-emerald-400 font-semibold uppercase tracking-wider text-[11px]">
                  1. Maker Fee Priority (Rule P1)
                </div>
                <div className="text-zinc-300 font-medium">
                  0.015% Maker vs 0.045% Taker
                </div>
                <p className="text-zinc-500 text-[11px] leading-relaxed">
                  Always use resting limit orders. Saves 66% in execution fees to prevent buffer attrition.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2 font-mono text-xs">
                <div className="text-amber-400 font-semibold uppercase tracking-wider text-[11px]">
                  2. Protective Stops (Rule H4 & H5)
                </div>
                <div className="text-zinc-300 font-medium">
                  Mandatory SL at Entry
                </div>
                <p className="text-zinc-500 text-[11px] leading-relaxed">
                  Hard stop loss must be placed immediately with entry. Never widen or move stop away from entry.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2 font-mono text-xs">
                <div className="text-red-400 font-semibold uppercase tracking-wider text-[11px]">
                  3. Daily Loss Guardrails
                </div>
                <div className="text-zinc-300 font-medium">
                  Automatic Circuit Breakers
                </div>
                <p className="text-zinc-500 text-[11px] leading-relaxed">
                  Breaches trigger if daily room hits $0. Starter room is $22.40; Explorer room is $233.31.
                </p>
              </div>
            </div>
          </div>

          {/* Account Order Capacity */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                Account Order Capacity
              </h2>
              <span className="text-[11px] font-mono text-zinc-500">
                0 / 2 concurrent positions active
              </span>
            </div>

            <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3 text-right">Remaining Buffer</th>
                    <th className="py-2.5 px-3 text-right">Daily Room</th>
                    <th className="py-2.5 px-3 text-right">Max Risk / Trade</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[12px]">
                  {accounts
                    .filter((a) => a.stage === "EVALUATION" || a.stage === "FUNDED")
                    .map((acc) => {
                      const buffer = Number(acc.drawdownRemaining || 0);
                      const dailyRoom = Number(acc.dailyLossRemaining || 0);
                      const maxRisk5Pct = buffer * 0.05;

                      return (
                        <tr key={acc.accountId} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {acc.challengeName || "Evaluation"}
                            <span className="text-zinc-500 ml-2 font-normal text-[11px]">
                              {formatAccountTag(acc.accountId)} ({formatShortId(acc.accountId)})
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                              {acc.stage}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-white">
                            ${buffer.toFixed(2)}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-semibold ${dailyRoom < 50 ? "text-amber-400" : "text-zinc-200"}`}>
                            ${dailyRoom.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-emerald-400">
                            ${maxRisk5Pct.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[11px] text-emerald-400">
                              Ready for orders
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Size</th>
                <th className="py-2.5 px-3 text-right">Price / Trigger</th>
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[12px]">
              {allOrders.map((ord) => (
                <tr
                  key={ord.orderId}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-white">{ord.asset}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ord.side === "buy" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {ord.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300 uppercase">{ord.type}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-200 border border-zinc-700">
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-white">
                    {ord.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-200 font-semibold">
                    {ord.price || ord.triggerPrice || "MARKET"}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400">
                    <span className="text-zinc-300 font-medium">{formatAccountTag(ord.accountId)}</span>{" "}
                    <span className="text-zinc-500 text-[10px]">({formatShortId(ord.accountId)})</span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-500">
                    {new Date(ord.createdAt).toLocaleTimeString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour12: false,
                    })}{" "}
                    IST
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
