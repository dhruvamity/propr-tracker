import { fetchDashboardData } from "@/lib/propr-api";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Activity,
  TrendingUp,
  ListOrdered,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const revalidate = 15; // Revalidate data every 15 seconds

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

function formatINR(val: string | number | undefined | null) {
  if (val === undefined || val === null || val === "" || val === "NaN") return "₹0.00";
  const n = Number(val);
  if (isNaN(n) || !isFinite(n)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatShortId(id: string) {
  return id.replace(/^urn:prp-account:/, "").slice(0, 8);
}

export default async function OverviewPage() {
  const data = await fetchDashboardData();
  const { summary, finance, accounts, allPositions, allOrders, health } = data;

  const activeAccounts = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  );

  return (
    <div className="space-y-6">
      {/* ─── Executive Financial Header (Prompt §11) ────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Actual Cash Spent */}
        <div className="p-4 rounded border border-[var(--border-primary)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-[var(--text-muted)]">
            <span>TOTAL ACTUAL CASH SPENT</span>
            <span className="text-[10px] px-1 rounded bg-black/40 text-[var(--text-secondary)]">ALL FIRMS</span>
          </div>
          <div className="mt-2 text-xl md:text-2xl font-mono font-bold text-[var(--text-primary)]">
            {formatINR(finance.totalActualCashCostINR || finance.totalInvestedINR)}
          </div>
          <div className="mt-1 text-xs font-mono text-slate-400">
            Propr Face: {formatUSD(finance.totalInvestedUSD)} USD
          </div>
          <div className="mt-0.5 text-[10px] font-mono text-slate-400">
            Propr {formatINR(finance.proprActualCashCostINR)} + Breakout {formatINR(finance.breakoutActualCashCostINR)}
          </div>
        </div>

        {/* Active Capital */}
        <div className="p-4 rounded border border-[var(--border-primary)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-[var(--text-muted)]">
            <span>ACTIVE CAPITAL</span>
            <span className="text-[10px] px-1 rounded bg-cyan-950/50 text-[var(--cyan)]">AT RISK</span>
          </div>
          <div className="mt-2 text-xl md:text-2xl font-mono font-bold text-[var(--cyan)]">
            {formatINR(finance.activeActualCashCostINR || finance.activeCapitalINR)}
          </div>
          <div className="mt-1 text-xs font-mono text-slate-400">
            Active Face: {formatUSD(finance.activeCapitalUSD)} USD
          </div>
          <div className="mt-0.5 text-[10px] font-mono text-slate-400">
            Est Face INR: {formatINR(finance.activeCapitalINR)}
          </div>
        </div>

        {/* Payouts Withdrawn */}
        <div className="p-4 rounded border border-[var(--border-primary)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-[var(--text-muted)]">
            <span>PAYOUTS WITHDRAWN</span>
            <span className="text-[10px] px-1 rounded bg-black/40 text-[var(--text-secondary)]">CASH</span>
          </div>
          <div className="mt-2 text-xl md:text-2xl font-mono font-bold text-[var(--green)]">
            {formatINR(finance.totalPayoutsINR)}
          </div>
          <div className="mt-1 text-xs font-mono text-slate-400">
            {formatUSD(finance.totalPayoutsUSD)} USD
          </div>
          <div className="mt-0.5 text-[10px] font-mono text-slate-400">
            Processed Bank Cash
          </div>
        </div>

        {/* Actual Cash PnL */}
        <div className="p-4 rounded border border-[var(--border-primary)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-[var(--text-muted)]">
            <span>ACTUAL CASH PNL</span>
            <span className="text-[10px] px-1 rounded bg-red-950/50 text-[var(--red)]">NET</span>
          </div>
          <div className="mt-2 text-xl md:text-2xl font-mono font-bold text-[var(--red)]">
            {formatINR(finance.actualCashPnLINR)}
          </div>
          <div className="mt-1 text-xs font-mono text-slate-400">
            Net Outflow: {formatINR(finance.totalActualCashCostINR || finance.totalInvestedINR)}
          </div>
          <div className="mt-0.5 text-[10px] font-mono text-slate-400">
            All Prop Firms Combined
          </div>
        </div>
      </div>

      {/* ─── Account Status Badges (Prompt §11, §12) ──────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider px-2">
          Accounts Status:
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/30 border border-cyan-800/40 text-xs font-mono text-[var(--cyan)]">
          <Activity className="w-3.5 h-3.5" />
          <span>ACTIVE EVAL: <strong>{summary.activeEvals}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-950/30 border border-green-800/40 text-xs font-mono text-[var(--green)]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>FUNDED: <strong>{summary.funded}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-950/30 border border-purple-800/40 text-xs font-mono text-purple-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>PASSED: <strong>{summary.passed}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/30 border border-red-800/40 text-xs font-mono text-[var(--red)]">
          <XCircle className="w-3.5 h-3.5" />
          <span>FAILED / BREACHED: <strong>{summary.failedBreached}</strong></span>
        </div>
        <div className="ml-auto text-[10px] font-mono text-[var(--text-muted)] pr-2">
          REST: <span className="text-[var(--green)] font-semibold">{health.restStatus}</span>
        </div>
      </div>

      {/* ─── Active Evaluation Risk Cards (Prompt §13) ────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-[var(--text-secondary)] uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse"></span>
            Active Accounts & Risk Monitor
          </h2>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {activeAccounts.length} ACTIVE ATTEMPTS
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeAccounts.map((acc) => (
            <div
              key={acc.accountId}
              className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 space-y-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-[var(--cyan)] border border-cyan-800/50">
                      {acc.stage}
                    </span>
                    <span className="font-mono text-xs text-[var(--text-primary)] font-bold">
                      {acc.challengeName || "Starter Turbo"}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-[var(--text-muted)] mt-1">
                    ID: {acc.accountId}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-base font-bold text-[var(--text-primary)]">
                    {formatUSD(acc.equity)}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">
                    Balance: {formatUSD(acc.balance)}
                  </div>
                </div>
              </div>

              {/* Progress & Drawdown Bars */}
              <div className="space-y-3">
                {/* Target Progress */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-[var(--text-secondary)]">Profit Target Progress</span>
                    <span className="text-[var(--cyan)] font-bold">
                      {acc.profitTargetProgressPercent || "0"}%
                      <span className="text-[10px] text-zinc-400 ml-1 font-normal">
                        ({Number(acc.profitTargetPct || 0) >= 0 ? "+" : ""}{acc.profitTargetPct || "0"}% gain)
                      </span>
                    </span>
                  </div>
                  <div
                    className="h-3.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-subtle)]"
                    role="progressbar"
                    aria-valuenow={Number(acc.profitTargetProgressPercent || 0)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Profit Target Progress"
                  >
                    <div
                      className="h-full bg-[var(--cyan)] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, Number(acc.profitTargetProgressPercent || 0)))}%` }}
                    />
                  </div>
                </div>

                {/* Drawdown Gauge (Accurate limit consumed scale) */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-[var(--text-secondary)]">Max Drawdown Consumed</span>
                    <span className={Number(acc.drawdownLimitConsumedPercent || 0) > 75 ? "text-[var(--red)] font-bold" : Number(acc.drawdownLimitConsumedPercent || 0) > 40 ? "text-[var(--amber)] font-semibold" : "text-[var(--text-primary)]"}>
                      {acc.drawdownLimitConsumedPercent || "0"}% of limit
                      <span className="text-[10px] text-zinc-400 ml-1 font-normal">
                        ({acc.drawdownUsedPercent || "0"}% loss)
                      </span>
                    </span>
                  </div>
                  <div
                    className="h-3.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-subtle)]"
                    role="progressbar"
                    aria-valuenow={Number(acc.drawdownLimitConsumedPercent || 0)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Max Drawdown Consumed"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        Number(acc.drawdownLimitConsumedPercent || 0) > 75
                          ? "bg-[var(--red)]"
                          : Number(acc.drawdownLimitConsumedPercent || 0) > 40
                          ? "bg-[var(--amber)]"
                          : "bg-[var(--cyan)]"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, Number(acc.drawdownLimitConsumedPercent || 0)))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Explicit Dollar Risk Buffers */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono">
                <div className="p-2 rounded bg-black/40 border border-zinc-800/80">
                  <span className="text-[9px] text-[var(--text-muted)] block uppercase tracking-wider">Breach Floor</span>
                  <span className="text-xs font-bold text-[var(--red)]">
                    {formatUSD(acc.breachFloor || (Number(acc.equity) - Number(acc.drawdownRemaining)).toFixed(2))}
                  </span>
                  <span className="text-[9px] text-zinc-400 block mt-0.5">Min Allowed Equity</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-zinc-800/80">
                  <span className="text-[9px] text-[var(--text-muted)] block uppercase tracking-wider">Drawdown Buffer</span>
                  <span className="text-xs font-bold text-[var(--cyan)]">
                    {formatUSD(acc.drawdownRemaining)}
                  </span>
                  <span className="text-[9px] text-zinc-400 block mt-0.5">Cash Headroom</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-zinc-800/80">
                  <span className="text-[9px] text-[var(--text-muted)] block uppercase tracking-wider">Daily Allowance</span>
                  <span className="text-xs font-bold text-purple-400">
                    {formatUSD(acc.dailyLossRemaining)}
                  </span>
                  <span className="text-[9px] text-zinc-400 block mt-0.5">Current Day Buffer</span>
                </div>
              </div>

              {/* Card Meta Stats */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono">
                <div>
                  <span className="text-[var(--text-muted)] block">Phase</span>
                  <span className="text-[var(--text-primary)] font-semibold">Phase {acc.currentPhase || 1}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block">Open Pos</span>
                  <span className="text-[var(--text-primary)] font-semibold">{acc.openPositionCount}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block">Open Orders</span>
                  <span className="text-[var(--text-primary)] font-semibold">{acc.openOrderCount}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block">Sync</span>
                  <span className="text-[var(--green)]">LIVE</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Account Universe Overview Table (Prompt §12) ────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            All Accounts Directory (Universe of {accounts.length})
          </h2>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            HISTORICAL & ACTIVE ACCOUNTS
          </span>
        </div>

        <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[10px] uppercase">
                <th className="py-2.5 px-3 text-center">Stage</th>
                <th className="py-2.5 px-3 text-left">Account ID</th>
                <th className="py-2.5 px-3 text-right">Starting</th>
                <th className="py-2.5 px-3 text-right">Balance</th>
                <th className="py-2.5 px-3 text-right">Equity</th>
                <th className="py-2.5 px-3 text-right">DD Used</th>
                <th className="py-2.5 px-3 text-right">Target</th>
                <th className="py-2.5 px-3 text-center">Status Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {accounts.map((acc) => {
                const isFailed = acc.stage === "FAILED" || acc.stage === "BREACHED";
                const isActive = acc.stage === "EVALUATION" || acc.stage === "FUNDED";
                return (
                  <tr
                    key={acc.accountId}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          isActive
                            ? "bg-cyan-950/60 text-[var(--cyan)] border-cyan-800/50"
                            : isFailed
                            ? "bg-red-950/60 text-[var(--red)] border-red-800/50"
                            : "bg-zinc-800 text-zinc-300 border-zinc-700"
                        }`}
                      >
                        {acc.stage}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left text-[var(--text-primary)] font-medium">
                      {formatShortId(acc.accountId)}
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        {acc.challengeName || "Starter Turbo"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[var(--text-secondary)] whitespace-nowrap">
                      {formatUSD(acc.initialBalance || acc.startingBalance)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[var(--text-primary)] whitespace-nowrap">
                      {formatUSD(acc.balance)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[var(--text-primary)] whitespace-nowrap">
                      {formatUSD(acc.equity)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[var(--text-secondary)] whitespace-nowrap">
                      <span className={Number(acc.drawdownLimitConsumedPercent || 0) > 75 ? "text-[var(--red)] font-bold" : "text-[var(--text-primary)]"}>
                        {acc.drawdownLimitConsumedPercent || "0"}%
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        {acc.drawdownUsedPercent || "0"}% loss
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[var(--text-secondary)] whitespace-nowrap">
                      <span className="text-[var(--text-primary)] font-medium">
                        {acc.profitTargetProgressPercent || "0"}%
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        {Number(acc.profitTargetPct || 0) >= 0 ? "+" : ""}{acc.profitTargetPct || "0"}% gain
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {acc.failureReason ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950/50 text-[var(--red)] border border-red-800/40">
                          {acc.failureReason.replace(/_/g, " ")}
                        </span>
                      ) : isActive ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950/50 text-[var(--cyan)] border border-cyan-800/40">
                          Evaluation Active
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)] text-[10px]">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Open Positions & Orders Terminal (Prompt §15, §16) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Positions */}
        <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center justify-between mb-3 border-b border-[var(--border-subtle)] pb-2">
            <h3 className="text-xs font-mono font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
              Open Positions ({allPositions.length})
            </h3>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">LIVE MARKS</span>
          </div>
          {allPositions.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No Open Positions"
              description="Active positions across your accounts will appear here in real time."
              className="py-8"
            />
          ) : (
            <div className="space-y-2">
              {allPositions.map((pos) => (
                <div key={pos.positionId} className="flex justify-between text-xs font-mono border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--text-primary)] font-bold">{pos.asset} {pos.positionSide.toUpperCase()}</span>
                  <span className="text-[var(--cyan)]">{pos.quantity} @ {pos.entryPrice}</span>
                  <span className={Number(pos.unrealizedPnl) >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}>
                    {formatUSD(pos.unrealizedPnl)} ({pos.returnOnEquity}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center justify-between mb-3 border-b border-[var(--border-subtle)] pb-2">
            <h3 className="text-xs font-mono font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
              Open Orders ({allOrders.length})
            </h3>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">PENDING EXECUTION</span>
          </div>
          {allOrders.length === 0 ? (
            <EmptyState
              icon={ListOrdered}
              title="No Pending Orders"
              description="Resting limit orders, trigger orders, and protective stops will be listed here."
              className="py-8"
            />
          ) : (
            <div className="space-y-2">
              {allOrders.map((ord) => (
                <div key={ord.orderId} className="flex justify-between text-xs font-mono border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--text-primary)]">{ord.asset} {ord.side.toUpperCase()}</span>
                  <span className="text-[var(--text-secondary)]">{ord.type} {ord.quantity}</span>
                  <span className="text-[var(--cyan)]">{ord.price || ord.triggerPrice || "MKT"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
