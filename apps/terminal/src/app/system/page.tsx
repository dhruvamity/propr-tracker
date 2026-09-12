import { fetchDashboardData } from "@/lib/propr-api";
import { SystemView } from "@/components/system-view";

export const revalidate = 15;

export default async function SystemPage() {
  const { health } = await fetchDashboardData();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-white tracking-wide">
            System Health
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Connection health, pipeline synchronization, and telemetry state
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            Engine: Propr OS
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
            Read-Only Invariant: ACTIVE
          </span>
        </div>
      </div>

      {/* System Health Summary, Flow & Progressive Disclosure Event Log */}
      <SystemView health={health} />
    </div>
  );
}
