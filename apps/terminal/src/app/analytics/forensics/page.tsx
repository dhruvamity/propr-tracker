import { fetchDashboardData } from "@/lib/propr-api";
import { ForensicsCalendarView } from "@/components/analytics/forensics-calendar-view";

export const revalidate = 15;

export const metadata = {
  title: "Daily Forensics Calendar | Propr Terminal",
  description:
    "Day-by-day trade forensics, rule compliance calendar, and discipline execution diagnostic.",
};

export default async function ForensicsCalendarPage() {
  const data = await fetchDashboardData();
  const { accounts } = data;

  return (
    <div className="space-y-6">
      <ForensicsCalendarView accounts={accounts} />
    </div>
  );
}
