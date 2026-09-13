import { Metadata } from "next";
import { RegimeView } from "@/components/regime/regime-view";
import baselineData from "@/data/baseline.json";
import { Baseline } from "@/components/regime/regime-types";

export const metadata: Metadata = {
  title: "Market Regime Filter • Propr Terminal",
  description:
    "Real-time BTCUSDT volatility pulse, directional persistence, and multi-timeframe market regime filter.",
};

export default function RegimePage() {
  const baseline = baselineData as unknown as Baseline;

  return (
    <div className="space-y-6">
      <RegimeView initialBaseline={baseline} />
    </div>
  );
}
