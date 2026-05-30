import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getActivityLogs } from "@/lib/activity";

interface ActivityLog {
  id: string;
  workspace_id: string;
  action: string;
  details: string;
  created_at: string;
}

interface ScanLog {
  id: string;
  workspace_id: string;
  started_at: string;
  completed_at?: string;
  status: string;
  signals_found: number;
  signals_saved: number;
}

// GET /api/activity-logs/[workspaceId]
export async function GET(
  _req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const workspaceId = params.workspaceId;
  
  // 1. Fetch activity logs
  const activityLogs = (await getActivityLogs(workspaceId)) as ActivityLog[];

  // 2. Fetch scan logs
  let scanLogs: ScanLog[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("scan_logs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("started_at", { ascending: false })
      .limit(20);
    
    if (!error && data) {
      scanLogs = data as ScanLog[];
    }
  } catch (err) {
    console.warn("Failed to fetch scan logs from DB:", err);
  }

  // 3. Transform scan logs to look like activity logs
  const transformedScanLogs: ActivityLog[] = scanLogs.map((log: ScanLog) => ({
    id: `scan-${log.id}`,
    workspace_id: workspaceId,
    action: "Scan completed",
    details: `Scan completed — ${log.signals_saved || 0} signals saved (${log.signals_found || 0} found)`,
    created_at: log.completed_at || log.started_at
  }));

  // 4. Merge all, remove duplicates
  const seenDetails = new Set<string>();
  const merged: ActivityLog[] = [];
  
  for (const log of [...activityLogs, ...transformedScanLogs]) {
    const key = `${log.action}-${log.details}`;
    if (!seenDetails.has(key)) {
      seenDetails.add(key);
      merged.push(log);
    }
  }
  
  const sorted = merged
    .sort((a: ActivityLog, b: ActivityLog) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  return NextResponse.json(sorted);
}
