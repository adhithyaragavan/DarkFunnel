"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, X, Plus, ShieldAlert } from "lucide-react";
import { Workspace } from "@/types";
import { toast } from "sonner";

interface WebhookLog {
  timestamp: string;
  statusCode: number;
  success: boolean;
}

interface ActivityLog {
  id: string;
  workspace_id: string;
  action: string;
  details: string;
  created_at: string;
}

export function SettingsClient({ workspace }: { workspace: Workspace | null }) {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Frequency and Scheduler Mock states
  const [scanFrequency, setScanFrequency] = useState("6h");
  const [lastGenerated, setLastGenerated] = useState("Last generated 4 hours ago");
  const [nextScanTime] = useState("May 30, 2026 at 12:00 PM UTC");

  // Multi-tag inputs
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  const [form, setForm] = useState({
    product_description: workspace?.product_description ?? "",
    icp_description: workspace?.icp_description ?? "",
    slack_webhook_url: workspace?.slack_webhook_url ?? "",
    email_digest_enabled: workspace?.email_digest_enabled ?? false,
    email_digest_time: workspace?.email_digest_time ?? "09:00",
  });

  // General Webhooks configuration
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [testingWebhook, setTestingWebhook] = useState(false);

  // On-Demand Email Report states
  const [sendingDigest, setSendingDigest] = useState(false);
  const [sendingWeekly, setSendingWeekly] = useState(false);

  // Push notifications warning banner state
  const [showPushNotificationAlert, setShowPushNotificationAlert] = useState(false);

  // Activity Log states
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchActivityLogs = async (wsId: string) => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/activity-logs/${wsId}`);
      if (res.ok) {
        const logs = await res.json();
        setActivityLogs(logs);
      }
    } catch (err) {
      console.warn("Failed to load activity logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted") {
        setShowPushNotificationAlert(true);
      }
    }
  }, []);

  const fetchWebhookConfig = async (wsId: string) => {
    try {
      const res = await fetch(`/api/workspace/${wsId}/webhook`);
      if (res.ok) {
        const config = await res.json();
        setWebhookUrl(config.webhookUrl || "");
        setWebhookLogs(config.webhookLogs || []);
      }
    } catch (err) {
      console.warn("Failed to load webhook config:", err);
    }
  };

  // Sync initial list items and fetch webhook config
  useEffect(() => {
    if (workspace) {
      setCompetitors(workspace.competitors as string[] ?? []);
      setKeywords(workspace.keywords as string[] ?? []);
      fetchWebhookConfig(workspace.id);
      fetchActivityLogs(workspace.id);
    }
  }, [workspace]);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  // Tags interactions
  const addCompetitor = () => {
    const val = competitorInput.trim();
    if (val && !competitors.includes(val)) {
      setCompetitors([...competitors, val]);
      setCompetitorInput("");
    }
  };

  const removeCompetitor = (tag: string) => {
    setCompetitors(competitors.filter((c) => c !== tag));
  };

  const addKeyword = () => {
    const val = keywordInput.trim();
    if (val && !keywords.includes(val)) {
      setKeywords([...keywords, val]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (tag: string) => {
    setKeywords(keywords.filter((k) => k !== tag));
  };

  const save = async () => {
    if (!workspace?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/workspace/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          competitors,
          keywords,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save settings");
      } else {
        toast.success("✅ Settings saved");
        fetchActivityLogs(workspace.id);
      }
    } catch {
      toast.error("Save request failed");
    } finally {
      setSaving(false);
    }
  };

  const testSlack = async () => {
    if (!workspace?.id) return;
    setTesting(true);
    try {
      const res = await fetch(`/api/slack-test/${workspace.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slack_webhook_url: form.slack_webhook_url })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Test message failed");
      } else {
        toast.success("✅ Slack alert sent! Check your channel.");
      }
    } catch {
      toast.error("Slack test failed — check configuration");
    } finally {
      setTesting(false);
    }
  };

  const sendTestDigestEmail = async () => {
    if (!workspace?.id) return;
    setSendingDigest(true);
    toast.info("Preparing and sending Daily Digest email report...");
    try {
      const res = await fetch(`/api/workspace/${workspace.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "digest" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send Daily Digest");
      } else {
        toast.success(`✅ Daily Digest email sent successfully (${data.count} signals)`);
        fetchActivityLogs(workspace.id);
      }
    } catch {
      toast.error("Failed to send Daily Digest email report");
    } finally {
      setSendingDigest(false);
    }
  };

  const sendTestWeeklyEmail = async () => {
    if (!workspace?.id) return;
    setSendingWeekly(true);
    toast.info("Synthesizing B2B sales intelligence and sending Weekly Summary email report...");
    try {
      const res = await fetch(`/api/workspace/${workspace.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "weekly" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send Weekly Summary");
      } else {
        toast.success(`✅ Weekly Summary email sent successfully (${data.count} signals)`);
        fetchActivityLogs(workspace.id);
      }
    } catch {
      toast.error("Failed to send Weekly Summary email report");
    } finally {
      setSendingWeekly(false);
    }
  };

  const saveWebhook = async () => {
    if (!workspace?.id) return;
    try {
      const res = await fetch(`/api/workspace/${workspace.id}/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save webhook");
      } else {
        toast.success("✅ Webhook configuration saved");
        setWebhookUrl(data.config?.webhookUrl || "");
        setWebhookLogs(data.config?.webhookLogs || []);
      }
    } catch {
      toast.error("Webhook save request failed");
    }
  };

  const testWebhookDelivery = async () => {
    if (!workspace?.id) return;
    setTestingWebhook(true);
    try {
      const res = await fetch(`/api/workspace/${workspace.id}/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl, test: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to deliver test webhook");
      } else {
        toast.success("✅ Test webhook sent successfully!");
        if (data.config) {
          setWebhookUrl(data.config.webhookUrl || "");
          setWebhookLogs(data.config.webhookLogs || []);
        }
      }
    } catch {
      toast.error("Test webhook request failed");
    } finally {
      setTestingWebhook(false);
    }
  };

  const regenerateQueries = async () => {
    setRegenerating(true);
    toast.info("Regenerating search queries with AI intelligence...");
    setTimeout(() => {
      setRegenerating(false);
      setLastGenerated("Last generated just now");
      toast.success("✅ AI Queries successfully generated!");
    }, 2000);
  };

  const clearSignals = async () => {
    if (!workspace?.id) return;
    setShowConfirmModal(false);
    toast.info("Clearing signal databases...");
    
    try {
      await fetch(`/api/signals/${workspace.id}`, { method: "DELETE" });
      toast.success("✅ Signal databases cleared successfully");
      window.location.reload();
    } catch {
      toast.error("Failed to clear signals database");
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 pb-28">
        <div className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Workspace Settings</h1>
            <p className="text-muted-foreground text-sm">
              Configure product intelligence, notification preferences, and scan frequencies.
            </p>
          </header>

          {showPushNotificationAlert && (
            <div className="flex gap-4 items-start bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8 text-xs select-none animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-2 bg-amber-500/15 border border-amber-500/25 text-amber-500 rounded-lg shrink-0">
                <ShieldAlert size={18} />
              </div>
              <div className="flex-1 space-y-1 mt-0.5">
                <h4 className="font-bold text-foreground">Browser Push Alerts</h4>
                <p className="text-muted-foreground leading-normal">
                  {typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied" ? (
                    "Browser push notifications are currently blocked. To receive instant alerts on your desktop when hot buying signals are captured, please reset your site permissions in your browser address bar and reload."
                  ) : (
                    "Receive instant alerts directly on your desktop when hot buying signals are captured by enabling push notifications."
                  )}
                </p>
                {typeof window !== "undefined" && "Notification" in window && Notification.permission === "default" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-[10px] font-bold px-3"
                    onClick={() => {
                      Notification.requestPermission().then((permission) => {
                        if (permission === "granted") {
                          setShowPushNotificationAlert(false);
                          new Notification("🔴 DarkFunnel Alert", {
                            body: "Push alerts successfully enabled! You will be notified when hot signals are found.",
                            icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌑</text></svg>"
                          });
                          toast.success("✅ Push alerts enabled!");
                        } else {
                          toast.error("Push alerts blocked. Enable in settings.");
                        }
                      });
                    }}
                  >
                    Enable Push Notifications
                  </Button>
                )}
              </div>
              <button
                onClick={() => setShowPushNotificationAlert(false)}
                className="text-muted-foreground hover:text-foreground mt-0.5"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {!workspace && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6 text-sm text-amber-400">
              No workspace configured yet.{" "}
              <a href="/onboard" className="underline font-semibold">
                Complete onboarding
              </a>{" "}
              first.
            </div>
          )}

          <div className="space-y-8 select-none">
            {/* SECTION 1: PRODUCT INTELLIGENCE */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">Section 1: Product Intelligence</h3>
                <p className="text-xs text-muted-foreground">Adjust product details and keywords used by AI crawlers.</p>
              </div>

              <Card className="bg-card border-border">
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="product_desc">Product Description</Label>
                    <Textarea
                      id="product_desc"
                      className="bg-input border-border min-h-[90px] text-xs leading-normal"
                      value={form.product_description}
                      onChange={(e) => set("product_description", e.target.value)}
                      disabled={!workspace}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icp_desc">Ideal Customer Profile (ICP)</Label>
                    <Textarea
                      id="icp_desc"
                      className="bg-input border-border min-h-[70px] text-xs leading-normal"
                      value={form.icp_description}
                      onChange={(e) => set("icp_description", e.target.value)}
                      disabled={!workspace}
                    />
                  </div>

                  {/* Dynamic Competitors tags input */}
                  <div className="space-y-2">
                    <Label>Competitors Tracking</Label>
                    <div className="flex gap-2">
                      <Input
                        value={competitorInput}
                        onChange={(e) => setCompetitorInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                        placeholder="Add competitor and press Enter..."
                        className="bg-input border-border text-xs"
                        disabled={!workspace}
                      />
                      <Button variant="secondary" size="sm" onClick={addCompetitor} disabled={!workspace}>
                        <Plus size={14} />
                      </Button>
                    </div>
                    {competitors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {competitors.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full select-none"
                          >
                            {tag}
                            <button onClick={() => removeCompetitor(tag)} className="hover:text-destructive shrink-0">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dynamic Keywords tags input */}
                  <div className="space-y-2">
                    <Label>Target Keywords</Label>
                    <div className="flex gap-2">
                      <Input
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                        placeholder="Add keyword and press Enter..."
                        className="bg-input border-border text-xs"
                        disabled={!workspace}
                      />
                      <Button variant="secondary" size="sm" onClick={addKeyword} disabled={!workspace}>
                        <Plus size={14} />
                      </Button>
                    </div>
                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {keywords.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 bg-white/5 border border-border text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full select-none"
                          >
                            {tag}
                            <button onClick={() => removeKeyword(tag)} className="hover:text-destructive shrink-0">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Regenerate Queries */}
                  <div className="pt-2 flex items-center justify-between gap-4">
                    <span className="text-[10px] font-mono text-muted-foreground font-semibold">{lastGenerated}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={regenerateQueries}
                      disabled={!workspace || regenerating}
                      className="text-xs h-8"
                    >
                      {regenerating ? (
                        <>
                          <Loader2 size={12} className="mr-1.5 animate-spin" /> Regenerating...
                        </>
                      ) : (
                        "Regenerate Queries"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SECTION 2: NOTIFICATIONS */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">Section 2: Notifications</h3>
                <p className="text-xs text-muted-foreground">Manage your alert endpoints and Daily digests.</p>
              </div>

              <Card className="bg-card border-border">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-black/20 text-xs">
                    <div>
                      <h4 className="font-semibold">Daily Email Digest</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Receive summaries of lead lists every morning.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={form.email_digest_time}
                        onChange={(e) => set("email_digest_time", e.target.value)}
                        className="w-24 bg-input border-border text-xs h-8 px-2"
                        disabled={!workspace}
                      />
                      <Button
                        variant={form.email_digest_enabled ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs font-semibold"
                        onClick={() => set("email_digest_enabled", !form.email_digest_enabled)}
                        disabled={!workspace}
                      >
                        {form.email_digest_enabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhook_url">Slack Webhook URL (🔥 Hot leads)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="webhook_url"
                        type="url"
                        placeholder="https://hooks.slack.com/services/..."
                        className="bg-input border-border text-xs flex-1"
                        value={form.slack_webhook_url}
                        onChange={(e) => set("slack_webhook_url", e.target.value)}
                        disabled={!workspace}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={testSlack}
                        disabled={!workspace || testing || !form.slack_webhook_url}
                      >
                        {testing ? <Loader2 size={12} className="animate-spin" /> : "Send Test"}
                      </Button>
                    </div>
                  </div>

                  {/* On-Demand Email triggers */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <Label className="text-xs text-muted-foreground font-semibold">On-Demand Email Reports</Label>
                    <div className="flex flex-wrap gap-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold gap-1.5"
                        onClick={sendTestDigestEmail}
                        disabled={!workspace || sendingDigest}
                      >
                        {sendingDigest ? <Loader2 size={12} className="animate-spin" /> : "📧 Send Daily Digest Now"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold gap-1.5"
                        onClick={sendTestWeeklyEmail}
                        disabled={!workspace || sendingWeekly}
                      >
                        {sendingWeekly ? <Loader2 size={12} className="animate-spin" /> : "📊 Send Weekly Summary Now"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="general_webhook_url">General Webhook URL (🔥 Score &gt;= 6)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="general_webhook_url"
                        type="url"
                        placeholder="https://yourserver.com/webhook"
                        className="bg-input border-border text-xs flex-1"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        disabled={!workspace}
                      />
                      <div className="flex gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={saveWebhook}
                          disabled={!workspace || saving}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={testWebhookDelivery}
                          disabled={!workspace || testingWebhook || !webhookUrl}
                        >
                          {testingWebhook ? <Loader2 size={12} className="animate-spin" /> : "Send Test"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {webhookLogs && webhookLogs.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border space-y-2">
                      <Label className="text-xs text-muted-foreground font-semibold">Delivery Attempts (Last 10)</Label>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 border border-border rounded-lg bg-black/10 p-2.5 text-[10px] font-mono">
                        {webhookLogs.map((log, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                            <span className="text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={log.success ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                                {log.success ? "SUCCESS" : "FAILED"}
                              </span>
                              <span className="bg-white/5 px-1.5 py-0.5 rounded text-foreground font-semibold">
                                HTTP {log.statusCode}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* SECTION 3: SCAN SCHEDULE */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">Section 3: Scan Schedule</h3>
                <p className="text-xs text-muted-foreground">Control Bright Data crawling frequency parameters.</p>
              </div>

              <Card className="bg-card border-border">
                <CardContent className="space-y-4 pt-6 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Next Scheduled Scan</span>
                    <span className="font-mono bg-white/5 border border-border px-2 py-0.5 rounded text-foreground font-semibold">
                      {nextScanTime}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label>Manual Scan Frequency</Label>
                    <select
                      value={scanFrequency}
                      onChange={(e) => {
                        setScanFrequency(e.target.value);
                        toast.success(`Scan schedule updated to ${e.target.value}`);
                      }}
                      className="w-full bg-input border border-border rounded-md text-xs px-3 py-2 outline-none focus:border-primary text-foreground cursor-pointer"
                      disabled={!workspace}
                    >
                      <option value="6h">Every 6 Hours (Recommended)</option>
                      <option value="12h">Every 12 Hours</option>
                      <option value="24h">Every 24 Hours</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SECTION 5: ACTIVITY LOG */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Section 5: Activity Log</h3>
                    <p className="text-xs text-muted-foreground">Audit log of the last 20 workspace actions and events.</p>
                  </div>
                  {workspace && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchActivityLogs(workspace.id)}
                      disabled={loadingLogs}
                      className="text-xs h-7 gap-1"
                    >
                      {loadingLogs ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        "🔄"
                      )}
                      Refresh Log
                    </Button>
                  )}
                </div>
              </div>

              <Card className="bg-card border-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-white/5 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">
                          <th className="p-3 pl-6 w-1/4">Timestamp</th>
                          <th className="p-3 w-1/4">Action</th>
                          <th className="p-3 pr-6 w-2/4">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityLogs.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-6 text-center text-muted-foreground font-medium">
                              {loadingLogs ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 size={14} className="animate-spin text-primary" />
                                  <span>Loading activity logs...</span>
                                </div>
                              ) : (
                                "No activity logged yet."
                              )}
                            </td>
                          </tr>
                        ) : (
                          activityLogs.map((log) => {
                            const dateStr = new Date(log.created_at).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit"
                            });
                            
                            // Badge color determination
                            let actionColor = "bg-primary/10 text-primary border-primary/20";
                            if (log.action.includes("Spike") || log.action.includes("Alert")) {
                              actionColor = "bg-red-500/10 text-red-400 border-red-500/20";
                            } else if (log.action.includes("saved") || log.action.includes("converted")) {
                              actionColor = "bg-green-500/10 text-green-400 border-green-500/20";
                            } else if (log.action.includes("dismissed")) {
                              actionColor = "bg-white/5 text-muted-foreground border-border";
                            } else if (log.action.includes("updated")) {
                              actionColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                            } else if (log.action.includes("email") || log.action.includes("sent")) {
                              actionColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                            }

                            return (
                              <tr key={log.id} className="border-b border-border/40 hover:bg-white/[0.02] transition-colors last:border-0">
                                <td className="p-3 pl-6 font-mono text-[11px] text-muted-foreground">
                                  {dateStr}
                                </td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wide ${actionColor}`}>
                                    {log.action}
                                  </span>
                                </td>
                                <td className="p-3 pr-6 text-foreground font-medium max-w-xs truncate" title={log.details}>
                                  {log.details}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SECTION 4: DANGER ZONE */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-destructive/20">
                <h3 className="text-lg font-bold text-destructive">Section 4: Danger Zone</h3>
                <p className="text-xs text-muted-foreground">Irreversible workspace settings.</p>
              </div>

              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">Clear All Signals</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Delete all saved, contacted, responded, and converted signals.</p>
                    </div>
                    <Button variant="destructive" onClick={() => setShowConfirmModal(true)} disabled={!workspace}>
                      Clear All Signals
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed bottom actions bar */}
      {workspace && (
        <div className="fixed bottom-0 left-64 right-0 bg-[#0c0c0c]/90 backdrop-blur-md border-t border-border p-4 flex justify-between items-center z-10 select-none px-8 animate-in fade-in">
          <span className="text-xs text-muted-foreground font-semibold">Modify workspace and notification parameters.</span>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-primary hover:bg-primary/95 text-white gap-2 font-bold px-6 shadow-md shadow-primary/10 active:scale-95 transition-all h-9 text-xs"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      )}

      {/* Custom Danger Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full space-y-6 shadow-2xl relative select-none">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-full shrink-0">
                <ShieldAlert size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Are you absolutely sure?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This action is permanent and cannot be undone. All active B2B prospect records and telemetry metrics will be deleted.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button variant="destructive" onClick={clearSignals} className="text-xs h-9 font-bold px-5">
                Confirm Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
