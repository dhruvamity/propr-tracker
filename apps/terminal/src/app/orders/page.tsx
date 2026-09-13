import { fetchDashboardData } from "@/lib/propr-api";
import { isTradingActive } from "@propr/data-model";
import { ListOrdered } from "lucide-react";
import { formatUSD, formatAccountTag } from "@/lib/utils";
import Link from "next/link";
import {
  TableContainer,
  TableHeaderRow,
  TableHeaderCell,
  TableBody,
  StatusBadge,
} from "@/components/ui";

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
  const activeAccounts = accounts.filter((a) => isTradingActive(a.stage));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ListOrdered className="text-[var(--cyan)]" size={22} />
            <span>Working Orders</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Open conditional and limit orders across all active accounts.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-primary)]">
            {allOrders.length} Working Order{allOrders.length !== 1 ? "s" : ""}
          </span>
          <span className="px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-primary)]">
            {activeAccounts.length} Active Account{activeAccounts.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Orders Table or Empty State */}
      {allOrders.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-12 text-center space-y-3 font-sans">
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <ListOrdered size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-200">No Working Orders</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No open limit or trigger orders are active on Hyperliquid. When orders are placed, they will appear here in real time.
            </p>
          </div>
        </div>
      ) : (
        <TableContainer>
          <thead>
            <TableHeaderRow>
              <TableHeaderCell>Asset</TableHeaderCell>
              <TableHeaderCell>Account</TableHeaderCell>
              <TableHeaderCell>Side</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell align="right">Size</TableHeaderCell>
              <TableHeaderCell align="right">Price / Trigger</TableHeaderCell>
              <TableHeaderCell align="center">Status</TableHeaderCell>
            </TableHeaderRow>
          </thead>
          <TableBody>
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
                    {ord.side === "buy" ? "Buy" : "Sell"}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-zinc-300 font-sans">
                  {formatOrderType(ord.type)}
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-200">
                  {ord.quantity}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-white">
                  {formatUSD(ord.price || ord.triggerPrice)}
                </td>
                {/* Status with small amber dot (Prompt §17) */}
                <td className="py-2.5 px-3 text-center font-sans">
                  <StatusBadge label="Pending" tone="amber" />
                </td>
              </tr>
            ))}
          </TableBody>
        </TableContainer>
      )}
    </div>
  );
}
