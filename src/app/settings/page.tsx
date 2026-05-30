import { supabaseAdmin } from "@/lib/supabase";
import { SettingsClient } from "@/components/SettingsClient";

export const dynamic = "force-dynamic";

async function getWorkspace() {
  const { data } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .limit(1)
    .single();
  return data;
}

export default async function SettingsPage() {
  const workspace = await getWorkspace();
  return <SettingsClient workspace={workspace} />;
}
