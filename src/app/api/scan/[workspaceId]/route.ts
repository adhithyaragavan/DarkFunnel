import { NextResponse } from "next/server";
import { runScanPipeline } from "@/lib/pipeline";

// POST /api/scan/[workspaceId] — trigger a scan
export async function POST(
  _req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const { workspaceId } = params;
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  try {
    // Run the full pipeline
    const result = await runScanPipeline(workspaceId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      signalsFound: result.signalsFound,
      signalsSaved: result.signalsSaved,
    });
  } catch (err) {
    console.error("[scan] Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
