import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  let workspaceId: string | null = null;
  try {
    const { data: workspaces } = await supabaseAdmin
      .from("workspaces")
      .select("id")
      .limit(1);
    if (workspaces && workspaces.length > 0) {
      workspaceId = workspaces[0].id;
    }
  } catch (err) {
    console.error("Failed to fetch workspaceId in settings/ai", err);
  }

  return NextResponse.json({
    provider: process.env.AI_PROVIDER || "gemini",
    aimlConfigured: !!process.env.AIML_API_KEY,
    aimlModel: process.env.AIML_MODEL || "meta-llama/llama-3.1-70b-instruct",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    resendConfigured: !!process.env.RESEND_API_KEY,
    brightdataConfigured: !!process.env.BRIGHTDATA_API_KEY && !!process.env.BRIGHTDATA_SERP_ZONE,
    workspaceId,
  });
}
