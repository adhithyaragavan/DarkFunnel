import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Try to get real workspace
    const { data: workspaces } = await supabaseAdmin
      .from("workspaces")
      .select("id")
      .limit(1);

    if (!workspaces || workspaces.length === 0) {
      // Return empty fallback for demo mode
      return NextResponse.json({ count24h: 0, last10: [] });
    }

    const workspaceId = workspaces[0].id;
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Get 24h count
    const { count, error: countError } = await supabaseAdmin
      .from("signals")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("created_at", since24h);

    // Get last 10 signals
    const { data: signals, error: signalsError } = await supabaseAdmin
      .from("signals")
      .select("id, title, intent_score, intent_level, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (countError || signalsError) {
      return NextResponse.json({ error: "Failed to query notifications" }, { status: 500 });
    }

    return NextResponse.json({
      count24h: count || 0,
      last10: signals || []
    });
  } catch (err) {
    console.error("Notifications API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
