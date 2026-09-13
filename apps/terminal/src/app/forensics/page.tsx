import { fetchDashboardData } from "@/lib/propr-api";
import { ForensicsCalendarView } from "@/components/analytics/forensics-calendar-view";

export const revalidate = 15;

export const metadata = {
  title: "Trade Forensics & Discipline Calendar | Propr Terminal",
  description:
    "Unified cross-account trade forensics, multi-account discipline diagnostics, and historical execution calendar.",
};

export default async function ForensicsPage() {
  const data = await fetchDashboardData();
  const { accounts } = data;

  return (
    <div className="space-y-6">
      <ForensicsCalendarView accounts={accounts} />
    </div>
  );
}
