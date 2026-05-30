import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmailDigest } from "@/lib/email";
import { Signal } from "@/types";

export const maxDuration = 60;

// GET /api/cron/digest — triggered by Vercel Cron daily
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: workspaces } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .eq("email_digest_enabled", true);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const results = [];

  for (const ws of workspaces ?? []) {
    try {
      const { data: signals } = await supabaseAdmin
        .from("signals")
        .select("*")
        .eq("workspace_id", ws.id)
        .gte("created_at", since)
        .order("intent_score", { ascending: false })
        .limit(50);

      await sendEmailDigest(ws.user_email, (signals ?? []) as Signal[]);
      results.push({ workspaceId: ws.id, sent: true, count: (signals ?? []).length });
    } catch (err) {
      results.push({
        workspaceId: ws.id,
        sent: false,
        error: err instanceof Error ? err.message : "Unknown",
      });
    }
  }

  return NextResponse.json({ ran: results.length, results });
}
