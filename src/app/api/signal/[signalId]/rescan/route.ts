import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { scrapeUrl } from "@/lib/brightdata";
import { scoreSignal } from "@/lib/gemini";

export async function POST(
  _req: Request,
  { params }: { params: { signalId: string } }
) {
  try {
    // 1. Fetch the signal
    const { data: signal, error: signalError } = await supabaseAdmin
      .from("signals")
      .select("*")
      .eq("id", params.signalId)
      .single();

    if (signalError || !signal) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }

    // 2. Fetch workspace settings
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from("workspaces")
      .select("product_description, icp_description, competitors")
      .eq("id", signal.workspace_id)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // 3. Scrape URL via Jina Reader
    const rawText = await scrapeUrl(signal.source_url);
    if (!rawText) {
      return NextResponse.json({ error: "Failed to scrape source URL content" }, { status: 502 });
    }

    // 4. Re-score using Gemini
    const scored = await scoreSignal(
      rawText.slice(0, 15000), // Protect context window
      signal.title,
      workspace.product_description || "",
      workspace.icp_description || "",
      workspace.competitors || []
    );

    // 5. Update DB
    const { data: updatedSignal, error: updateError } = await supabaseAdmin
      .from("signals")
      .update({
        raw_content: rawText.slice(0, 5000),
        intent_score: scored.intentScore,
        intent_level: scored.intentLevel,
        signal_type: scored.signalType,
        summary: scored.summary,
        recommended_action: scored.recommendedAction,
        person_name: scored.personName ?? signal.person_name,
        company_name: scored.companyName ?? signal.company_name,
        scraped_at: new Date().toISOString()
      })
      .eq("id", params.signalId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedSignal);
  } catch (err) {
    console.error("Error rescanning individual signal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
