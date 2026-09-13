import { fetchDashboardData } from "@/lib/propr-api";
import { isTradingActive } from "@propr/data-model";
import { TrendingUp } from "lucide-react";
import { formatUSD, formatAccountTag, formatPercent } from "@/lib/utils";
import Link from "next/link";
import {
  TableContainer,
  TableHeaderRow,
  TableHeaderCell,
  TableBody,
} from "@/components/ui";

export const revalidate = 15;

export default async function PositionsPage() {
  const { allPositions, accounts } = await fetchDashboardData();
  const activeAccounts = accounts.filter((a) => isTradingActive(a.stage));

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header (Prompt §28: No generic subtitle) */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">
          Open positions
        </h2>
        <span className="text-xs text-zinc-400 font-mono">
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
        <TableContainer>
          <thead>
            <TableHeaderRow>
              <TableHeaderCell className="w-24">Account</TableHeaderCell>
              <TableHeaderCell className="w-20">Asset</TableHeaderCell>
              <TableHeaderCell className="w-16">Side</TableHeaderCell>
              <TableHeaderCell align="right">Size</TableHeaderCell>
              <TableHeaderCell align="right">Entry</TableHeaderCell>
              <TableHeaderCell align="right">Mark</TableHeaderCell>
              <TableHeaderCell align="right">Liq</TableHeaderCell>
              <TableHeaderCell align="right">Margin</TableHeaderCell>
              <TableHeaderCell align="right">uPnL</TableHeaderCell>
              <TableHeaderCell align="right">ROE</TableHeaderCell>
            </TableHeaderRow>
          </thead>
          <TableBody>
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
            </TableBody>
          </TableContainer>
      )}
    </div>
  );
}
