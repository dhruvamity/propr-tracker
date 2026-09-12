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
        <div className="flex items-center gap-3 font-mono text-xs text-zinc-400">
          <span>Engine: <strong className="text-zinc-200">Propr Core</strong></span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400">Read-Only Active</span>
          </span>
        </div>
      </div>

      {/* System Health Summary, Flow & Progressive Disclosure Event Log */}
      <SystemView health={health} />
    </div>
  );
}
