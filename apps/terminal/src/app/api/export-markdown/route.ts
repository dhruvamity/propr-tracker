import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/propr-api";
import { generateMarkdownExport } from "@/lib/export-markdown";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Force re-fetch from upstream API to ensure freshest data
    const data = await fetchDashboardData(true);
    const markdown = generateMarkdownExport(data);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}`;
    const filename = `propr-terminal-complete-export-${dateStr}-${timeStr}utc.md`;

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
