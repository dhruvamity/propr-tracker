import { fetchDashboardData } from "@/lib/propr-api";
import { RulesView } from "@/components/rules/rules-view";

export const revalidate = 15;

export default async function RulesPage() {
  const data = await fetchDashboardData();
  return <RulesView data={data} />;
}
