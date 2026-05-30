import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/scan-logs/[workspaceId]
export async function GET(
  _req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const { data, error } = await supabaseAdmin
    .from("scan_logs")
    .select("*")
    .eq("workspace_id", params.workspaceId)
    .order("started_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
