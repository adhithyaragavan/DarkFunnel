import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWeeklySummaryEmail } from "@/lib/email";
import { callAIMLAPI } from "@/lib/gemini";
import { Signal } from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 120;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch all workspaces
  const { data: workspaces } = await supabaseAdmin
    .from("workspaces")
    .select("*");

  const results = [];
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  for (const ws of workspaces ?? []) {
    try {
      // 2. Fetch signals in last 7 days
      const { data: signals } = await supabaseAdmin
        .from("signals")
        .select("*")
        .eq("workspace_id", ws.id)
        .gte("created_at", since);

      if (!signals || signals.length === 0) {
        results.push({ workspaceId: ws.id, skipped: true, reason: "No signals this week" });
        continue;
      }

      // 3. Synthesize strategic focus
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
        console.warn("AI synthesis failed for weekly summary:", aiErr);
      }

      // 4. Send email
      await sendWeeklySummaryEmail(ws.user_email, signals as Signal[], recommendation);
      results.push({ workspaceId: ws.id, sent: true, count: signals.length });
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
