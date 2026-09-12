import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/propr-api";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleRefresh();
}

export async function POST() {
  return handleRefresh();
}

async function handleRefresh() {
  try {
    const data = await fetchDashboardData(true);
    // Invalidate server-side page caches across all app routes
    try {
      revalidatePath("/", "layout");
    } catch {
      // Ignored during static generation or build phase
    }

    return NextResponse.json({
      success: true,
      lastSyncAt: data.health.lastSyncAt,
      accountCount: data.accounts.length,
      accounts: data.accounts.map((a) => ({
        id: a.accountId,
        challenge: a.challengeName,
        stage: a.stage,
        equity: a.equity,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
