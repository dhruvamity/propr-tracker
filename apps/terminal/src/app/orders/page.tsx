import { fetchDashboardData } from "@/lib/propr-api";
import { ListOrdered } from "lucide-react";
import { formatUSD, formatAccountTag } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 15;

function formatOrderType(type: string): string {
  const clean = type.toLowerCase().replace(/_/g, " ");
  if (clean.includes("take profit") || clean.includes("take_profit")) return "Take profit";
  if (clean.includes("stop")) return "Stop loss";
  if (clean.includes("limit")) return "Limit";
  if (clean.includes("market")) return "Market";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export default async function OrdersPage() {
  const { allOrders, accounts } = await fetchDashboardData();
  const activeAccounts = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header (Prompt §28: No generic subtitle) */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">
          Open orders
        </h2>
        <span className="text-xs text-zinc-500 font-mono">
          {allOrders.length} active
        </span>
      </div>

      {allOrders.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-8 text-center space-y-3 font-sans">
          <div className="w-10 h-10 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <ListOrdered size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-semibold text-zinc-100">
              No Active Orders
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No resting limit orders or protective stops across {activeAccounts.length} active accounts
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-4 text-xs">
            <Link href="/live" className="text-[var(--cyan)] hover:text-white transition-colors">
              Risk monitor →
            </Link>
            <span className="text-zinc-700">•</span>
            <Link href="/positions" className="text-zinc-400 hover:text-zinc-200 transition-colors">
              View positions →
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 font-sans">
                <th className="py-2.5 px-3 font-normal">Asset</th>
                <th className="py-2.5 px-3 font-normal">Account</th>
                <th className="py-2.5 px-3 font-normal">Side</th>
                <th className="py-2.5 px-3 font-normal">Type</th>
                <th className="py-2.5 px-3 text-right font-normal">Size</th>
                <th className="py-2.5 px-3 text-right font-normal">Price / Trigger</th>
                <th className="py-2.5 px-3 text-center font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">
              {allOrders.map((ord) => (
                <tr
                  key={ord.orderId}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-white font-sans">{ord.asset}</td>
                  <td className="py-2.5 px-3 text-zinc-300">
                    {formatAccountTag(ord.accountId)}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span
                      className={`text-xs font-medium ${
                        ord.side === "buy" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {ord.side.toLowerCase() === "buy" ? "Buy" : "Sell"}
                    </span>
                  </td>
                  {/* Human-readable order type (Prompt §17) */}
                  <td className="py-2.5 px-3 text-zinc-300 font-sans">
                    {formatOrderType(ord.type)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-white">
                    {ord.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-white">
                    {formatUSD(ord.price || ord.triggerPrice)}
                  </td>
                  {/* Status with small amber dot (Prompt §17) */}
                  <td className="py-2.5 px-3 text-center font-sans">
                    <span className="inline-flex items-center gap-1.5 text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>Pending</span>
                    </span>
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
