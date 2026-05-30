import { supabaseAdmin } from "./supabase";
import fs from "fs";
import path from "path";

interface LocalActivityLog {
  id: string;
  workspace_id: string;
  action: string;
  details: string;
  created_at: string;
}

export async function logActivity(workspaceId: string, action: string, details: string) {
  const timestamp = new Date().toISOString();
  try {
    const { error } = await supabaseAdmin.from("activity_logs").insert({
      workspace_id: workspaceId,
      action,
      details,
      created_at: timestamp
    });
    if (error) throw error;
  } catch {
    // Fallback to local JSON storage
    const logsPath = path.join(process.cwd(), "scratch", "activity_logs.json");
    let logs: LocalActivityLog[] = [];
    if (fs.existsSync(logsPath)) {
      try {
        logs = JSON.parse(fs.readFileSync(logsPath, "utf-8"));
      } catch {}
    }
    const logEntry: LocalActivityLog = {
      id: `act-${Math.random().toString(36).substring(2, 11)}`,
      workspace_id: workspaceId,
      action,
      details,
      created_at: timestamp
    };
    logs = [logEntry, ...logs].slice(0, 100);
    fs.mkdirSync(path.dirname(logsPath), { recursive: true });
    fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2), "utf-8");
  }
}

export async function getActivityLogs(workspaceId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("activity_logs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return data;
  } catch {
    // Fallback to local JSON
    const logsPath = path.join(process.cwd(), "scratch", "activity_logs.json");
    if (fs.existsSync(logsPath)) {
      try {
        const logs = JSON.parse(fs.readFileSync(logsPath, "utf-8"));
        return (logs as LocalActivityLog[]).filter((l) => l.workspace_id === workspaceId).slice(0, 20);
      } catch {}
    }
    return [];
  }
}
