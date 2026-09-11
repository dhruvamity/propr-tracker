import { fetchDashboardData } from "@/lib/propr-api";
import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const revalidate = 15;

function formatUSD(val: string | number | undefined | null) {
  if (val === undefined || val === null || val === "" || val === "NaN") return "$0.00";
  const n = Number(val);
  if (isNaN(n) || !isFinite(n)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default async function PositionsPage() {
  const { allPositions } = await fetchDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-mono font-bold tracking-wider text-[var(--text-primary)] uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--green)]"></span>
            Active Trading Positions
          </h1>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
            Open positions across active evaluation and funded accounts.
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--cyan)]">
          {allPositions.length} POSITIONS OPEN
        </span>
      </div>

      {allPositions.length === 0 ? (
        <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] p-12">
          <EmptyState
            icon={TrendingUp}
            title="No Open Positions"
            description="Active trading positions across your evaluation and funded accounts will appear here in real time."
            statusBadge="Position stream active"
          />
        </div>
      ) : (
        <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[10px] uppercase">
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
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {allPositions.map((pos) => (
                <tr key={pos.positionId} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 font-bold text-[var(--text-primary)]">{pos.asset}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pos.positionSide === "long" ? "bg-green-950/60 text-[var(--green)] border border-green-800/40" : "bg-red-950/60 text-[var(--red)] border border-red-800/40"}`}>
                      {pos.positionSide.toUpperCase()} {pos.leverage}x
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-secondary)]">{pos.accountId.slice(0, 12)}...</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[var(--text-primary)]">{pos.quantity}</td>
                  <td className="py-2.5 px-3 text-right text-[var(--text-secondary)]">${pos.entryPrice}</td>
                  <td className="py-2.5 px-3 text-right text-[var(--cyan)] font-semibold">${pos.markPrice}</td>
                  <td className="py-2.5 px-3 text-right text-[var(--text-secondary)]">
                    {formatUSD(pos.marginUsed)} <span className="text-[10px] uppercase text-[var(--text-muted)]">({pos.marginMode})</span>
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold ${Number(pos.unrealizedPnl) >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                    {formatUSD(pos.unrealizedPnl)}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-semibold ${Number(pos.returnOnEquity) >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
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
