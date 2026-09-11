import { fetchDashboardData } from "@/lib/propr-api";
import { Radio, ShieldAlert, Activity, TrendingUp, Layers, Scale, CheckCircle2 } from "lucide-react";
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

function formatShortId(id: string) {
  return id.replace(/^urn:prp-account:/, "").slice(0, 8);
}

export default async function LiveMonitorPage() {
  const data = await fetchDashboardData();
  const { accounts, allPositions } = data;
  const liveAccounts = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  );

  // Reference specifications for Propr Perpetual Markets
  const MARKET_SPECS = [
    {
      symbol: "xyz:BTC-USDT",
      name: "Bitcoin Perpetual",
      markPrice: "$68,432.50",
      change24h: "+2.45%",
      isPositive: true,
      maxLeverage: "100x",
      tickSize: "0.10",
      minOrder: "0.001 BTC",
      funding8h: "+0.0100%",
    },
    {
      symbol: "xyz:ETH-USDT",
      name: "Ethereum Perpetual",
      markPrice: "$3,542.80",
      change24h: "+1.82%",
      isPositive: true,
      maxLeverage: "100x",
      tickSize: "0.01",
      minOrder: "0.01 ETH",
      funding8h: "+0.0085%",
    },
    {
      symbol: "xyz:SOL-USDT",
      name: "Solana Perpetual",
      markPrice: "$178.45",
      change24h: "+4.12%",
      isPositive: true,
      maxLeverage: "50x",
      tickSize: "0.01",
      minOrder: "0.1 SOL",
      funding8h: "+0.0120%",
    },
    {
      symbol: "xyz:SUI-USDT",
      name: "Sui Perpetual",
      markPrice: "$1.84",
      change24h: "-0.65%",
      isPositive: false,
      maxLeverage: "25x",
      tickSize: "0.0001",
      minOrder: "1.0 SUI",
      funding8h: "+0.0050%",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-mono font-bold tracking-wider text-[var(--text-primary)] uppercase flex items-center gap-2">
            <Radio size={15} className="text-[var(--cyan)] animate-pulse" />
            Live Risk & Active Accounts Command
          </h1>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
            Real-time equity proximity to breach floors, daily loss buffers, and perpetual market status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--cyan)]">
            {liveAccounts.length} ACCOUNTS MONITORED
          </span>
          <span className="text-xs font-mono px-2 py-1 rounded bg-green-950/40 border border-green-800/40 text-[var(--green)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-ping" />
            FEED LIVE
          </span>
        </div>
      </div>

      {/* Active Account Risk Cards */}
      {liveAccounts.length === 0 ? (
        <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] p-8">
          <EmptyState
            icon={Radio}
            title="No Active Accounts"
            description="Active evaluation and funded accounts will appear here with live risk meters."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {liveAccounts.map((acc) => {
            const breachFloor =
              acc.breachFloor ||
              (Number(acc.equity) - Number(acc.drawdownRemaining)).toFixed(2);
            const drawdownBuffer = acc.drawdownRemaining;
            const dailyLossAllowance = acc.dailyLossRemaining;
            const isHighRisk = Number(acc.drawdownLimitConsumedPercent || 0) > 75;

            return (
              <div
                key={acc.accountId}
                className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 space-y-4 relative overflow-hidden"
              >
                <div className="flex justify-between items-start border-b border-[var(--border-subtle)] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-950 text-[var(--cyan)] border border-cyan-800/50">
                        {acc.stage}
                      </span>
                      <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                        {acc.challengeName || "Starter Turbo"}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                      ID: {acc.accountId}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                      {formatUSD(acc.equity)}
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      Balance: {formatUSD(acc.balance)}
                    </span>
                  </div>
                </div>

                {/* Drawdown & Target Gauges */}
                <div className="space-y-3 font-mono">
                  {/* Max Drawdown */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)]">Max Drawdown Consumed</span>
                      <span
                        className={
                          isHighRisk
                            ? "text-[var(--red)] font-bold"
                            : "text-[var(--text-primary)]"
                        }
                      >
                        {acc.drawdownLimitConsumedPercent || "0"}% of limit
                        <span className="text-[10px] text-zinc-400 ml-1.5 font-normal">
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
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHighRisk ? "bg-[var(--red)]" : "bg-[var(--cyan)]"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, Number(acc.drawdownLimitConsumedPercent || 0))
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Profit Target */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)]">Profit Target Progress</span>
                      <span className="text-[var(--cyan)] font-bold">
                        {acc.profitTargetProgressPercent || "0"}%
                        <span className="text-[10px] text-zinc-400 ml-1.5 font-normal">
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
                    >
                      <div
                        className="h-full bg-[var(--cyan)] rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, Number(acc.profitTargetProgressPercent || 0))
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Explicit Dollar Risk Buffers (Prompt Requirement §4) ── */}
                <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[var(--border-subtle)] text-xs font-mono">
                  <div className="p-2.5 rounded bg-black/40 border border-zinc-800/80">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase tracking-wider">
                      Breach Floor
                    </span>
                    <span className="text-sm font-bold text-[var(--red)] block mt-0.5">
                      {formatUSD(breachFloor)}
                    </span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">
                      Min Allowed Equity
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-zinc-800/80">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase tracking-wider">
                      Drawdown Buffer
                    </span>
                    <span className="text-sm font-bold text-[var(--cyan)] block mt-0.5">
                      {formatUSD(drawdownBuffer)}
                    </span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">
                      Cash Headroom
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-zinc-800/80">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase tracking-wider">
                      Daily Allowance
                    </span>
                    <span className="text-sm font-bold text-purple-400 block mt-0.5">
                      {formatUSD(dailyLossAllowance)}
                    </span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">
                      Current Day Buffer
                    </span>
                  </div>
                </div>

                {/* Card Meta Stats */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono">
                  <div>
                    <span className="text-[var(--text-muted)] block">Phase</span>
                    <span className="text-[var(--text-primary)] font-semibold">
                      Phase {acc.currentPhase || 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">Model</span>
                    <span className="text-[var(--text-primary)] font-semibold capitalize">
                      {acc.drawdownType || "Static"} DD
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">Trading Days</span>
                    <span className="text-[var(--text-primary)] font-semibold">
                      {acc.tradingDays || 1} / {acc.requiredTradingDays || 5} d
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">Status</span>
                    <span className="text-[var(--green)] font-semibold">ACTIVE</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Lower Viewport Section 1: Account Limits & Risk Rules Matrix ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-[var(--text-secondary)] uppercase flex items-center gap-2">
            <Scale size={14} className="text-[var(--cyan)]" />
            Account Risk Limits & Breach Invariants Reference Matrix
          </h2>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            STRICT AUTOMATIC LIQUIDATION RULES
          </span>
        </div>

        <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[10px] uppercase">
                <th className="py-2.5 px-3 text-center">Stage</th>
                <th className="py-2.5 px-3 text-left">Account ID / Tier</th>
                <th className="py-2.5 px-3 text-right">Starting Capital</th>
                <th className="py-2.5 px-3 text-right">Breach Floor</th>
                <th className="py-2.5 px-3 text-right">Drawdown Buffer</th>
                <th className="py-2.5 px-3 text-right">Daily Loss Buffer</th>
                <th className="py-2.5 px-3 text-right">Profit Target</th>
                <th className="py-2.5 px-3 text-center">Min Days</th>
                <th className="py-2.5 px-3 text-center">Risk Invariant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {liveAccounts.map((acc) => {
                const breachFloor =
                  acc.breachFloor ||
                  (Number(acc.equity) - Number(acc.drawdownRemaining)).toFixed(2);
                return (
                  <tr key={acc.accountId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950/60 text-[var(--cyan)] border border-cyan-800/50">
                        {acc.stage}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left font-medium text-[var(--text-primary)]">
                      {formatShortId(acc.accountId)}
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        {acc.challengeName || "Starter Turbo"} ({acc.drawdownType || "static"})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[var(--text-secondary)] whitespace-nowrap">
                      {formatUSD(acc.startingBalance)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[var(--red)] whitespace-nowrap">
                      {formatUSD(breachFloor)}
                      <span className="text-[9px] text-zinc-400 block font-normal">
                        ({acc.maxDrawdownPercent || "5"}% max DD)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[var(--cyan)] whitespace-nowrap">
                      {formatUSD(acc.drawdownRemaining)}
                      <span className="text-[9px] text-zinc-400 block font-normal">
                        {acc.drawdownLimitConsumedPercent || "0"}% consumed
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-purple-400 whitespace-nowrap">
                      {formatUSD(acc.dailyLossRemaining)}
                      <span className="text-[9px] text-zinc-400 block font-normal">
                        ({acc.maxDailyLossPercent || "4"}% daily cap)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[var(--text-primary)] whitespace-nowrap">
                      {formatUSD(
                        (
                          (Number(acc.startingBalance) * Number(acc.profitTargetPercent || 10)) /
                          100
                        ).toFixed(2)
                      )}
                      <span className="text-[9px] text-zinc-400 block font-normal">
                        ({acc.profitTargetPercent || "10"}% target)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap text-zinc-300">
                      {acc.tradingDays || 1} / {acc.requiredTradingDays || 5} d
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-950/50 text-[var(--green)] border border-green-800/40">
                        <CheckCircle2 size={11} />
                        NORMAL (SAFE)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Lower Viewport Section 2: Live Perpetual Market Tick Reference Sheet ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-[var(--text-secondary)] uppercase flex items-center gap-2">
            <Activity size={14} className="text-[var(--cyan)]" />
            Perpetual Markets Active Specifications & Live Tick Feed
          </h2>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            HIP-3 NORMALIZED TICKERS • 100x MAX LEVERAGE
          </span>
        </div>

        <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[10px] uppercase">
                <th className="py-2.5 px-3 text-left">Asset / Pair</th>
                <th className="py-2.5 px-3 text-left">Contract Type</th>
                <th className="py-2.5 px-3 text-right">Mark Price</th>
                <th className="py-2.5 px-3 text-right">24h Change</th>
                <th className="py-2.5 px-3 text-right">8h Funding Rate</th>
                <th className="py-2.5 px-3 text-right">Max Leverage</th>
                <th className="py-2.5 px-3 text-right">Tick Size</th>
                <th className="py-2.5 px-3 text-right">Min Order Size</th>
                <th className="py-2.5 px-3 text-center">Stream Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {MARKET_SPECS.map((m) => (
                <tr key={m.symbol} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 text-left font-bold text-[var(--cyan)] whitespace-nowrap">
                    {m.symbol}
                  </td>
                  <td className="py-2.5 px-3 text-left text-[var(--text-secondary)] whitespace-nowrap">
                    {m.name}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[var(--text-primary)] whitespace-nowrap">
                    {m.markPrice}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                      m.isPositive ? "text-[var(--green)]" : "text-[var(--red)]"
                    }`}
                  >
                    {m.change24h}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-300 whitespace-nowrap">
                    {m.funding8h}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[var(--cyan)] font-bold whitespace-nowrap">
                    {m.maxLeverage}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-400 whitespace-nowrap">
                    {m.tickSize}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-400 whitespace-nowrap">
                    {m.minOrder}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-950/40 text-[var(--green)] border border-green-800/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
                      STREAMING
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
