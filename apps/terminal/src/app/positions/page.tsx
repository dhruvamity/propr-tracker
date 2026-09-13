import { fetchDashboardData } from "@/lib/propr-api";
import { TrendingUp } from "lucide-react";
import { formatUSD, formatAccountTag, formatPercent } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 15;

export default async function PositionsPage() {
  const { allPositions, accounts } = await fetchDashboardData();
  const activeAccounts = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header (Prompt §28: No generic subtitle) */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">
          Open positions
        </h2>
        <span className="text-xs text-zinc-500 font-mono">
          {allPositions.length} active
        </span>
      </div>

      {allPositions.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-8 text-center space-y-3 font-sans">
          <div className="w-10 h-10 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <TrendingUp size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-semibold text-zinc-100">
              No Open Positions
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Flat across {activeAccounts.length} active accounts
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-4 text-xs">
            <Link href="/live" className="text-[var(--cyan)] hover:text-white transition-colors">
              Risk monitor →
            </Link>
            <span className="text-zinc-700">•</span>
            <Link href="/rules" className="text-zinc-400 hover:text-zinc-200 transition-colors">
              Trading rules →
            </Link>
          </div>
        </div>
      ) : (
        /* Compact Table with Fixed Numeric Alignment (Prompt §16) */
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 font-sans">
                <th className="py-2.5 px-3 font-normal w-24">Account</th>
                <th className="py-2.5 px-3 font-normal w-20">Asset</th>
                <th className="py-2.5 px-3 font-normal w-16">Side</th>
                <th className="py-2.5 px-3 text-right font-normal">Size</th>
                <th className="py-2.5 px-3 text-right font-normal">Entry</th>
                <th className="py-2.5 px-3 text-right font-normal">Mark</th>
                <th className="py-2.5 px-3 text-right font-normal">Liq</th>
                <th className="py-2.5 px-3 text-right font-normal">Margin</th>
                <th className="py-2.5 px-3 text-right font-normal">uPnL</th>
                <th className="py-2.5 px-3 text-right font-normal">ROE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">
              {allPositions.map((pos) => {
                const uPnlNum = Number(pos.unrealizedPnl || 0);
                const isPos = uPnlNum >= 0;
                const roeNum = Number(pos.returnOnEquity || 0);

                return (
                  <tr
                    key={pos.positionId}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2.5 px-3 text-zinc-300 font-medium font-mono">
                      {formatAccountTag(pos.accountId)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white font-sans">{pos.asset}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`text-xs font-medium ${
                          pos.positionSide === "long" ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {pos.positionSide === "long" ? "Long" : "Short"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-200 font-mono">
                      {pos.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300 font-mono">
                      {formatUSD(pos.entryPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-white font-medium font-mono">
                      {formatUSD(pos.markPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-400 font-mono">
                      {pos.liquidationPrice ? formatUSD(pos.liquidationPrice) : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-400 font-mono">
                      {formatUSD(pos.marginUsed)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold font-mono ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                      {isPos ? `+${formatUSD(uPnlNum)}` : `-${formatUSD(Math.abs(uPnlNum))}`}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold font-mono ${roeNum >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatPercent(roeNum, 2, true)}
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
