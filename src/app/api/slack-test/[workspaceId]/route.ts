import { NextResponse } from "next/server";
import { sendSlackNotification } from "@/lib/slack";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/slack-test/[workspaceId] — send test Slack message
export async function POST(
  _req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const { data: workspace } = await supabaseAdmin
    .from("workspaces")
    .select("slack_webhook_url")
    .eq("id", params.workspaceId)
    .single();

  let webhookUrl = workspace?.slack_webhook_url;
  try {
    const body = await _req.json();
    if (body.slack_webhook_url) {
      webhookUrl = body.slack_webhook_url;
    }
  } catch {}

  if (!webhookUrl) {
    return NextResponse.json({ error: "No Slack webhook configured" }, { status: 400 });
  }

  try {
    await sendSlackNotification(webhookUrl, {
      title: "🧪 Test Signal — DarkFunnel is connected!",
      intent_level: "Hot",
      intent_score: 10,
      signal_type: "evaluation",
      summary: "This is a test notification from DarkFunnel. Your Slack integration is working correctly.",
      recommended_action: "No action needed — this is a test.",
      source_url: "https://darkfunnel.app",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send Slack notification" },
      { status: 500 }
    );
  }
}
