import { fetchDashboardData } from "@/lib/propr-api";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const revalidate = 15;

export const metadata = {
  title: "Analytics | Propr Terminal",
  description: "Account performance, equity curves, ratios, and closed trade execution history.",
};

export default async function AnalyticsPage() {
  const data = await fetchDashboardData();
  const { accounts } = data;

  return (
    <div className="space-y-6">
      <AnalyticsView accounts={accounts} />
    </div>
  );
}
