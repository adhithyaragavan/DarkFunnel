import { NextResponse } from "next/server";
import { getWebhookConfig, saveWebhookConfig, triggerWebhook } from "@/lib/webhooks";
import { Signal } from "@/types";

// GET /api/workspace/[id]/webhook
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const config = getWebhookConfig(params.id);
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "Failed to load webhook configuration" }, { status: 500 });
  }
}

// POST /api/workspace/[id]/webhook
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { webhookUrl, test } = body;

    if (test) {
      // Trigger a sample test webhook delivery
      const sampleSignal: Signal = {
        id: "sig-test-12345",
        workspace_id: params.id,
        title: "🔥 Buying intent detected on G2 reviews for DarkFunnel",
        summary: "A user is expressing frustration with their current legacy pipeline scraper and asking for modern automation alternatives.",
        intent_score: 9,
        intent_level: "Hot",
        signal_type: "switching",
        source_type: "g2",
        source_url: "https://g2.com/products/darkfunnel/reviews",
        recommended_action: "Send direct outreach offering a custom trial with automated Jina content parsing.",
        person_name: "Sarah Jenkins",
        company_name: "Acme Corp",
        status: "new",
        scraped_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      // Momentarily save the temporary URL if passed in, or use current config
      const targetUrl = webhookUrl || getWebhookConfig(params.id).webhookUrl;
      if (!targetUrl) {
        return NextResponse.json({ error: "Webhook URL is required to send a test" }, { status: 400 });
      }

      // Temporarily overwrite or store the URL
      saveWebhookConfig(params.id, targetUrl);

      // Trigger test delivery
      await triggerWebhook(params.id, sampleSignal);
      const updatedConfig = getWebhookConfig(params.id);
      return NextResponse.json({ success: true, config: updatedConfig });
    }

    // Save actual URL config
    saveWebhookConfig(params.id, webhookUrl);
    return NextResponse.json({ success: true, config: getWebhookConfig(params.id) });
  } catch (err) {
    console.error("Webhook settings API error:", err);
    return NextResponse.json({ error: "Failed to update webhook configuration" }, { status: 500 });
  }
}
