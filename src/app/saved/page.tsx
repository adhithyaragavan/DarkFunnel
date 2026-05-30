import { supabaseAdmin } from "@/lib/supabase";
import { Sidebar } from "@/components/Sidebar";
import { SavedClient } from "@/components/SavedClient";
import { Signal } from "@/types";

export const dynamic = "force-dynamic";

async function getSavedSignals(): Promise<Signal[]> {
  const { data: workspaces } = await supabaseAdmin
    .from("workspaces")
    .select("id")
    .limit(1);

  if (!workspaces || workspaces.length === 0) return [];

  const { data: signals, error } = await supabaseAdmin
    .from("signals")
    .select("*")
    .eq("workspace_id", workspaces[0].id)
    .in("status", ["saved", "contacted", "responded", "converted"])
    .order("intent_score", { ascending: false });

  if (error) return [];
  return (signals ?? []) as Signal[];
}

export default async function SavedPage() {
  const signals = await getSavedSignals();

  return (
    <div className="flex w-full">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Saved Signals</h1>
            <p className="text-muted-foreground">
              Actionable intent signals you have saved for outreach.
              {signals.length > 0 && (
                <span className="ml-2 text-primary font-medium">{signals.length} leads ready</span>
              )}
            </p>
          </header>

          <SavedClient initialSignals={signals} />
        </div>
      </main>
    </div>
  );
}
