import { fetchDashboardData } from "@/lib/propr-api";
import { SystemView } from "@/components/system-view";

export const revalidate = 15;

export default async function SystemPage() {
  const { health } = await fetchDashboardData();

  return (
    <div className="space-y-6">
      {/* System Health Summary, Flow & Progressive Disclosure Event Log (Prompt §23: No redundant engine header) */}
      <SystemView health={health} />
    </div>
  );
}
