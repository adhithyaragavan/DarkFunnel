import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmailDigest } from "@/lib/email";

// POST /api/digest/[workspaceId] — send email digest manually
export async function POST(
  _req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const { data: workspace } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .eq("id", params.workspaceId)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Get signals from last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: signals } = await supabaseAdmin
    .from("signals")
    .select("*")
    .eq("workspace_id", params.workspaceId)
    .gte("created_at", since)
    .order("intent_score", { ascending: false })
    .limit(50);

  try {
    await sendEmailDigest(workspace.user_email, signals ?? []);
    return NextResponse.json({ success: true, count: (signals ?? []).length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
