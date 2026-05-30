import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import fs from "fs";
import path from "path";
import { logActivity } from "@/lib/activity";

// PATCH /api/signal/[signalId] — update status or notes or deal_value
export async function PATCH(
  req: Request,
  { params }: { params: { signalId: string } }
) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const allowed = ["status", "notes", "deal_value"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    const hasDealValue = "deal_value" in update;
    const dealValue = update.deal_value;
    delete update.deal_value;

    const { data, error } = await supabaseAdmin
      .from("signals")
      .update(update)
      .eq("id", params.signalId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (hasDealValue && data) {
      const metadataPath = path.join(process.cwd(), "scratch", "signal_metadata.json");
      let metadata: Record<string, Record<string, unknown>> = {};
      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        } catch {}
      }
      metadata[params.signalId] = {
        ...metadata[params.signalId],
        deal_value: Number(dealValue) || 0
      };
      fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");

      // Log converted activity log
      if (body.status === "converted") {
        try {
          await logActivity(
            data.workspace_id as string,
            "Signal converted",
            `Signal converted — "${(data.title as string).substring(0, 40)}..." closed with deal value of $${Number(dealValue).toLocaleString()}`
          );
        } catch {}
      }

      data.deal_value = Number(dealValue) || 0;
    } else if (body.status === "saved" && data) {
      try {
        await logActivity(
          data.workspace_id as string,
          "Signal saved",
          `Signal saved — "${(data.title as string).substring(0, 40)}..."`
        );
      } catch {}
    } else if (body.status === "dismissed" && data) {
      try {
        await logActivity(
          data.workspace_id as string,
          "Signal dismissed",
          `Signal dismissed — "${(data.title as string).substring(0, 40)}..."`
        );
      } catch {}
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH signal error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/signal/[signalId]
export async function DELETE(
  _req: Request,
  { params }: { params: { signalId: string } }
) {
  const { error } = await supabaseAdmin
    .from("signals")
    .delete()
    .eq("id", params.signalId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
