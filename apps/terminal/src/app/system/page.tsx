import { fetchDashboardData } from "@/lib/propr-api";
import { CheckCircle2, Server, Lock } from "lucide-react";

export const revalidate = 15;

export default async function SystemPage() {
  const { health } = await fetchDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-sm font-mono font-bold tracking-wider text-[var(--text-primary)] uppercase flex items-center gap-2">
          <Server size={15} className="text-[var(--cyan)]" />
          System Diagnostics & Architecture Status
        </h1>
        <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
          Runtime infrastructure, security guarantees, and connection telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Connection Health */}
        <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 space-y-3 font-mono text-xs">
          <h2 className="font-bold text-[var(--text-primary)] uppercase border-b border-[var(--border-subtle)] pb-2">
            Service Telemetry
          </h2>
          <div className="flex justify-between py-1">
            <span className="text-[var(--text-muted)]">REST API Gateway:</span>
            <span className={health.restStatus === "HEALTHY" ? "text-[var(--green)] font-bold" : "text-[var(--red)] font-bold"}>
              {health.restStatus}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[var(--text-muted)]">WebSocket Realtime Stream:</span>
            <span className={health.wsStatus === "CONNECTED" ? "text-[var(--green)] font-bold" : "text-[var(--amber)] font-bold"}>
              {health.wsStatus} (15s ISR Enabled)
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[var(--text-muted)]">Last REST Sync:</span>
            <span className="text-[var(--text-primary)]">{new Date(health.lastSyncAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[var(--text-muted)]">Monitored Accounts:</span>
            <span className="text-[var(--cyan)] font-bold">{health.accountCount}</span>
          </div>
        </div>

        {/* Security & Read-Only Guarantees */}
        <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 space-y-3 font-mono text-xs">
          <h2 className="font-bold text-[var(--text-primary)] uppercase border-b border-[var(--border-subtle)] pb-2 flex items-center gap-1.5">
            <Lock size={13} className="text-[var(--green)]" />
            Security & Read-Only Invariants
          </h2>
          <div className="flex items-center gap-2 py-1 text-[var(--green)]">
            <CheckCircle2 size={13} />
            <span>Zero Order Placement Endpoints (POST /orders excluded)</span>
          </div>
          <div className="flex items-center gap-2 py-1 text-[var(--green)]">
            <CheckCircle2 size={13} />
            <span>Zero Order Cancellation / Mutation Capabilities</span>
          </div>
          <div className="flex items-center gap-2 py-1 text-[var(--green)]">
            <CheckCircle2 size={13} />
            <span>Server-Only Credentials (API key never touches client bundles)</span>
          </div>
          <div className="flex items-center gap-2 py-1 text-[var(--green)]">
            <CheckCircle2 size={13} />
            <span>Decimal.js Exact Precision (Zero IEEE-754 float drift)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
