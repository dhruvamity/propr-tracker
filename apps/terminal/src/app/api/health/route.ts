import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/propr-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchDashboardData();
    return NextResponse.json({
      health: data.health,
      accountCount: data.accounts.length,
      lastSyncAt: data.health.lastSyncAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        health: {
          restStatus: "ERROR",
          wsStatus: "DISCONNECTED",
          lastSyncAt: new Date().toISOString(),
          accountCount: 0,
          apiHealthy: false,
        },
        error: message,
      },
      { status: 500 }
    );
  }
}
