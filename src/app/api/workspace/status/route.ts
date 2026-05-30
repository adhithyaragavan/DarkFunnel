import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Get active workspace
    const { data: workspaces } = await supabaseAdmin
      .from("workspaces")
      .select("id, user_email")
      .limit(1);

    if (!workspaces || workspaces.length === 0) {
      return NextResponse.json({ workspaceId: null });
    }

    const wsId = workspaces[0].id;
    const userEmail = workspaces[0].user_email || null;

    // 2. Fetch feed count (status = new or not dismissed)
    const { count: feedCount } = await supabaseAdmin
      .from("signals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", wsId)
      .eq("status", "new");

    // 3. Fetch saved count (status = saved)
    const { count: savedCount } = await supabaseAdmin
      .from("signals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", wsId)
      .eq("status", "saved");

    // Fetch total active signals
    const { count: totalSignals } = await supabaseAdmin
      .from("signals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", wsId)
      .neq("status", "dismissed");

    // Fetch hot active signals
    const { count: hotSignals } = await supabaseAdmin
      .from("signals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", wsId)
      .eq("intent_level", "Hot")
      .neq("status", "dismissed");

    // 4. Fetch last completed scan timestamp
    const { data: logs } = await supabaseAdmin
      .from("scan_logs")
      .select("completed_at")
      .eq("workspace_id", wsId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      workspaceId: wsId,
      userEmail,
      feedCount: feedCount ?? 0,
      savedCount: savedCount ?? 0,
      totalSignals: totalSignals ?? 0,
      hotSignals: hotSignals ?? 0,
      lastScan: logs?.completed_at ?? null,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
