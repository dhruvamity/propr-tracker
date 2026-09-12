import { fetchDashboardData } from "@/lib/propr-api";
import { TrendingUp } from "lucide-react";
import { formatUSD, formatAccountTag } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 15;

export default async function PositionsPage() {
  const { allPositions, accounts } = await fetchDashboardData();
  const activeAccounts = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm md:text-base font-semibold text-zinc-100 font-sans">
            Positions
          </h1>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Active perpetual market exposures across monitored accounts
          </p>
        </div>
        <span className="text-xs font-sans px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          {allPositions.length} open
        </span>
      </div>

      {allPositions.length === 0 ? (
        <div className="space-y-4">
          {/* Compact Flat State */}
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-6 md:p-8 text-center space-y-3 font-sans">
            <div className="w-10 h-10 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <TrendingUp size={20} />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">
                No Open Positions
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {activeAccounts.length} active accounts · flat
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)]" />
              <span>Monitoring active · Listening for fills</span>
            </div>
          </div>

          {/* Contextual Account Risk Row */}
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 text-xs font-sans">
              <span className="font-semibold text-zinc-200">Account Risk Context</span>
              <span className="text-zinc-400">Nearest Limit</span>
            </div>
            <div className="divide-y divide-zinc-800/60 font-sans text-xs">
              {activeAccounts.map((acc) => {
                const dailyRoom = Number(acc.dailyLossRemaining || 0);
                const ddBuffer = Number(acc.drawdownRemaining || 0);
                const dailyLimit = Number(acc.dailyLossLimitAmount || 0);
                const dailyUsed = Number(acc.dailyLossUsedAmount || 0);
                const dailyBurn = dailyLimit > 0 ? (dailyUsed / dailyLimit) * 100 : 0;
                const isDaily = dailyBurn >= 70 || (dailyRoom > 0 && dailyRoom < ddBuffer);
                const room = isDaily ? dailyRoom : ddBuffer;
                const ruleName = isDaily ? "daily-loss threshold" : "drawdown floor";

                return (
                  <div key={acc.accountId} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-100">{acc.challengeName}</span>
                      <span className="font-mono text-zinc-400 text-xs">{formatAccountTag(acc.accountId)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-300 font-sans">
                        <span className="font-mono font-medium text-zinc-100">{formatUSD(room)}</span> to {ruleName}
                      </span>
                      <Link
                        href="/live"
                        className="text-[var(--cyan)] hover:text-white transition-colors"
                      >
                        Risk monitor →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 font-sans">
                <th className="py-2.5 px-3 font-normal">Account</th>
                <th className="py-2.5 px-3 font-normal">Asset</th>
                <th className="py-2.5 px-3 font-normal">Side</th>
                <th className="py-2.5 px-3 text-right font-normal">Size</th>
                <th className="py-2.5 px-3 text-right font-normal">Entry Price</th>
                <th className="py-2.5 px-3 text-right font-normal">Mark Price</th>
                <th className="py-2.5 px-3 text-right font-normal">Liq Price</th>
                <th className="py-2.5 px-3 text-right font-normal">Margin</th>
                <th className="py-2.5 px-3 text-right font-normal">Unrealized PnL</th>
                <th className="py-2.5 px-3 text-right font-normal">ROE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">
              {allPositions.map((pos) => {
                const uPnlNum = Number(pos.unrealizedPnl || 0);
                const isPos = uPnlNum >= 0;

                return (
                  <tr
                    key={pos.positionId}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2.5 px-3 text-zinc-300 font-medium">
                      {formatAccountTag(pos.accountId)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white font-sans">{pos.asset}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                          pos.positionSide === "long"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : "bg-red-950/60 text-red-400 border border-red-800/40"
                        }`}
                      >
                        {pos.positionSide ? pos.positionSide.toUpperCase() : "LONG"}
                      </span>
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
