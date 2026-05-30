import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// DELETE /api/signals/[workspaceId] — clear all signals
export async function DELETE(
  _req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const { error } = await supabaseAdmin
    .from("signals")
    .delete()
    .eq("workspace_id", params.workspaceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// GET /api/signals/[workspaceId]?intent=Hot&source=reddit&status=new&page=1
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const { searchParams } = req.nextUrl;
  const intent = searchParams.get("intent");
  const source = searchParams.get("source");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = 20;

  let query = supabaseAdmin
    .from("signals")
    .select("*", { count: "exact" })
    .eq("workspace_id", params.workspaceId)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (intent) query = query.eq("intent_level", intent);
  if (source) query = query.eq("source_type", source);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count, page, pageSize });
}
