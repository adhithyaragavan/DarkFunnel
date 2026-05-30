import { supabaseAdmin } from "@/lib/supabase";
import { Sidebar } from "@/components/Sidebar";
import { FeedClient } from "@/components/FeedClient";
import { NotificationBell } from "@/components/NotificationBell";
import { MOCK_SIGNALS } from "@/lib/mock-data";
import { Signal } from "@/types";

export const dynamic = "force-dynamic";

async function getSignals(): Promise<Signal[]> {
  // Try to get real workspace
  const { data: workspaces } = await supabaseAdmin
    .from("workspaces")
    .select("id")
    .limit(1);

  if (!workspaces || workspaces.length === 0) {
    return MOCK_SIGNALS; // Fall back to mock if no workspace yet
  }

  const workspaceId = workspaces[0].id;

  const { data: signals, error } = await supabaseAdmin
    .from("signals")
    .select("*")
    .eq("workspace_id", workspaceId)
    .neq("status", "dismissed")
    .order("intent_score", { ascending: false })
    .limit(50);

  if (error || !signals || signals.length === 0) {
    return MOCK_SIGNALS;
  }

  return signals as Signal[];
}

async function getWorkspaceId(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("workspaces")
    .select("id")
    .limit(1)
    .single();
  return data?.id ?? null;
}

export default async function FeedPage() {
  const [signals, workspaceId] = await Promise.all([getSignals(), getWorkspaceId()]);
  const isDemo = !workspaceId;

  // 6. WORKSPACE STATS IN HEADER
  let keywordsCount = 2; // Default mock
  const sourcesCount = 5;
  let lastUpdatedMinutes = 12;

  if (!isDemo && workspaceId) {
    const { data: ws } = await supabaseAdmin
      .from("workspaces")
      .select("keywords")
      .eq("id", workspaceId)
      .single();

    if (ws && Array.isArray(ws.keywords)) {
      keywordsCount = ws.keywords.length;
    }

    const { data: logs } = await supabaseAdmin
      .from("scan_logs")
      .select("completed_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(1);

    if (logs && logs.length > 0 && logs[0].completed_at) {
      const diffMs = new Date().getTime() - new Date(logs[0].completed_at).getTime();
      lastUpdatedMinutes = Math.floor(diffMs / 60000);
    }
  }

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8 flex items-center justify-between border-b border-border pb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Signal Feed</h1>
              <p className="text-xs text-muted-foreground mt-1 select-none font-medium">
                Monitoring <span className="text-[#6366f1] font-semibold">{keywordsCount} keyword{keywordsCount === 1 ? "" : "s"}</span> across <span className="text-[#6366f1] font-semibold">{sourcesCount} sources</span> • Updated <span className="font-semibold">{lastUpdatedMinutes} minute{lastUpdatedMinutes === 1 ? "" : "s"} ago</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Right-aligned green pulsing dot + 'Live monitoring active' text */}
              <div className="flex items-center gap-2 select-none bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full text-xs font-semibold text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>Live monitoring active</span>
              </div>
              <NotificationBell isDemo={isDemo} />
            </div>
          </header>

          {isDemo && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">🌑</span>
                <p className="text-sm font-medium text-primary">
                  Demo mode — these are example signals.{" "}
                  <a href="/onboard" className="underline">Set up your workspace</a> to start finding real buyers.
                </p>
              </div>
            </div>
          )}

          <FeedClient initialSignals={signals} workspaceId={workspaceId} isDemo={isDemo} />
        </div>
      </main>
    </div>
  );
}
