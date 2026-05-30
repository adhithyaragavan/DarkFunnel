import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/analytics/[workspaceId]
export async function GET(
  _req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const workspaceId = params.workspaceId;

  // Signals by intent level
  const { data: byIntent } = await supabaseAdmin
    .from("signals")
    .select("intent_level")
    .eq("workspace_id", workspaceId);

  const intentCounts = { Hot: 0, Warm: 0, Cold: 0 };
  for (const s of byIntent ?? []) {
    if (s.intent_level in intentCounts) {
      intentCounts[s.intent_level as keyof typeof intentCounts]++;
    }
  }

  // Signals by source type
  const { data: bySource } = await supabaseAdmin
    .from("signals")
    .select("source_type")
    .eq("workspace_id", workspaceId);

  const sourceCounts: Record<string, number> = {};
  for (const s of bySource ?? []) {
    sourceCounts[s.source_type] = (sourceCounts[s.source_type] ?? 0) + 1;
  }

  // Signals by status
  const { data: byStatus } = await supabaseAdmin
    .from("signals")
    .select("status")
    .eq("workspace_id", workspaceId);

  const statusCounts: Record<string, number> = {};
  for (const s of byStatus ?? []) {
    statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
  }

  // Signals last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from("signals")
    .select("created_at")
    .eq("workspace_id", workspaceId)
    .gte("created_at", sevenDaysAgo);

  const days: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    days[d.toLocaleDateString("en-US", { weekday: "short" })] = 0;
  }
  for (const s of recent ?? []) {
    const key = new Date(s.created_at).toLocaleDateString("en-US", { weekday: "short" });
    if (key in days) days[key]++;
  }

  const dailyData = Object.entries(days).map(([name, signals]) => ({ name, signals }));

  // Scan logs summary
  const { data: scanLogs } = await supabaseAdmin
    .from("scan_logs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("started_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    intentCounts,
    sourceCounts,
    statusCounts,
    dailyData,
    total: (byIntent ?? []).length,
    scanLogs: scanLogs ?? [],
  });
}
