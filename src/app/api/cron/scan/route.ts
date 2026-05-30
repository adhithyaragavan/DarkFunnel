import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { runScanPipeline } from "@/lib/pipeline";

export const maxDuration = 300; // 5 minutes Vercel max

// GET /api/cron/scan — triggered by Vercel Cron
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all workspaces
  const { data: workspaces, error } = await supabaseAdmin
    .from("workspaces")
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  for (const ws of workspaces ?? []) {
    try {
      const result = await runScanPipeline(ws.id);
      results.push({ workspaceId: ws.id, ...result });
    } catch (err) {
      results.push({
        workspaceId: ws.id,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ ran: results.length, results });
}
