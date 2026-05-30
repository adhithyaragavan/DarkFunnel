import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";

// GET /api/workspace/[id]
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH /api/workspace/[id]
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const { data, error } = await supabaseAdmin
      .from("workspaces")
      .update(body)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    try {
      const changes: string[] = [];
      if (body.product_description) changes.push("product description");
      if (body.icp_description) changes.push("ICP details");
      if (body.competitors) changes.push("competitors list");
      if (body.keywords) changes.push("keywords changed");
      if (body.slack_webhook_url) changes.push("Slack webhook");
      if ("email_digest_enabled" in body) changes.push("email preferences");
      
      const details = changes.length > 0 ? changes.join(", ") : "no major changes";
      await logActivity(params.id, "Settings updated", `Settings updated — ${details}`);
    } catch (err) {
      console.warn("Failed to log settings activity:", err);
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/workspace/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await supabaseAdmin
    .from("workspaces")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
