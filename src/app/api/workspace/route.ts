import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/workspace — list all workspaces
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/workspace — create a new workspace
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      user_email,
      product_description,
      icp_description,
      competitors,
      keywords,
      slack_webhook_url,
      email_digest_enabled,
      email_digest_time,
    } = body;

    if (!user_email || !product_description || !icp_description) {
      return NextResponse.json(
        { error: "user_email, product_description, and icp_description are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("workspaces")
      .insert({
        user_email,
        product_description,
        icp_description,
        competitors: competitors ?? [],
        keywords: keywords ?? [],
        slack_webhook_url: slack_webhook_url ?? null,
        email_digest_enabled: email_digest_enabled ?? false,
        email_digest_time: email_digest_time ?? "09:00",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
