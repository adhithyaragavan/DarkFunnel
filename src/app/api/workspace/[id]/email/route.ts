import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmailDigest, sendWeeklySummaryEmail } from "@/lib/email";
import { callAIMLAPI } from "@/lib/gemini";
import { Signal } from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logActivity } from "@/lib/activity";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { type } = await req.json();
    if (type !== "digest" && type !== "weekly") {
      return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
    }

    // 1. Fetch workspace
    const { data: ws } = await supabaseAdmin
      .from("workspaces")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!ws) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (type === "digest") {
      // 2. Fetch daily signals
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: signals } = await supabaseAdmin
        .from("signals")
        .select("*")
        .eq("workspace_id", ws.id)
        .gte("created_at", since)
        .order("intent_score", { ascending: false });

      await sendEmailDigest(ws.user_email, (signals ?? []) as Signal[]);
      try {
        await logActivity(ws.id, "Email digest sent", `Email digest sent — ${(signals ?? []).length} signals`);
      } catch {}
      return NextResponse.json({ success: true, count: (signals ?? []).length });
    } else {
      // 3. Fetch weekly signals
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: signals } = await supabaseAdmin
        .from("signals")
        .select("*")
        .eq("workspace_id", ws.id)
        .gte("created_at", since);

      if (!signals || signals.length === 0) {
        return NextResponse.json({ error: "No signals recorded in the last 7 days to generate summary" }, { status: 400 });
      }

      // 4. AI Strategic recommendation
      let recommendation = "Focus outreach on identified high-intent prospects across key developer forums, emphasizing rapid-deployment capabilities and direct comparative value.";
      try {
        const signalSummary = signals.map(s => `- ${s.title}: ${s.summary}`).slice(0, 15).join("\n");
        const prompt = `You are a B2B sales strategist. Based on the following buyer intent signals detected for product: "${ws.product_description}" and targeting ICP: "${ws.icp_description}", write a one-paragraph strategic recommendation (under 4 sentences) outlining the most critical outreach focus. Be highly actionable, strategic, and concise. Do not use generic filler.
Signals:
${signalSummary}`;

        const provider = process.env.AI_PROVIDER || "gemini";
        if (provider === "aiml") {
          recommendation = await callAIMLAPI([
            { role: "system", content: "You are a B2B sales strategist." },
            { role: "user", content: prompt }
          ], false);
        } else {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
          const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
          const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
          });
          recommendation = response.response.text();
        }
      } catch (aiErr) {
        console.warn("AI recommendation generation failed:", aiErr);
      }

      await sendWeeklySummaryEmail(ws.user_email, signals as Signal[], recommendation);
      try {
        await logActivity(ws.id, "Email digest sent", `Weekly summary email sent — ${signals.length} signals`);
      } catch {}
      return NextResponse.json({ success: true, count: signals.length });
    }
  } catch (err) {
    console.error("Failed to trigger on-demand email:", err);
    return NextResponse.json({ error: "Failed to dispatch email report" }, { status: 500 });
  }
}
