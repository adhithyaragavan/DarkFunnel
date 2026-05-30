"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Play, 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  ExternalLink,
  BookOpen,
  Award
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { MOCK_SIGNALS } from "@/lib/mock-data";
import { toast } from "sonner";

// Curated Harmonious Color Palettes
const SOURCE_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"]; // Indigo, Blue, Green, Amber, Pink
const INTENT_COLORS = ["#ef4444", "#f59e0b", "#10b981"]; // Red (Hot), Amber (Warm), Green (Cold)

interface AnalyticsData {
  workspaceId: string;
  intentCounts: { Hot: number; Warm: number; Cold: number };
  sourceCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  dailyData: { name: string; signals: number }[];
  total: number;
  scanLogs: Array<{
    id: string;
    started_at: string;
    completed_at?: string;
    status: string;
    signals_found: number;
    signals_saved: number;
  }>;
  competitorData: Array<{
    name: string;
    mentions: number;
    sentiment: { positive: number; negative: number; neutral: number };
    trend: "up" | "down" | "flat";
    recentSignal: { id: string; title: string; source_url: string } | null;
  }>;
  roiData: {
    pipelineInfluenced: number;
    dealsClosed: number;
    convertedSignals: Array<{ id: string; title: string; deal_value: number; company_name?: string }>;
  };
  keywordData: Array<{
    keyword: string;
    signals: number;
    avgScore: number;
  }>;
  marketBrief: {
    brief_text: string;
    key_themes: string[];
    top_opportunity: string;
    competitor_movements: string;
  } | null;
}

export function AnalyticsClient({ data }: { data: AnalyticsData | null }) {
  const [scanning, setScanning] = useState(false);
  const isDemo = !data;
  const workspaceId = data?.workspaceId ?? null;

  // Sync scan status from global events
  useEffect(() => {
    const handleScanStatus = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.scanning !== undefined) {
        setScanning(customEvent.detail.scanning);
      }
    };
    window.addEventListener("scan-status", handleScanStatus);
    return () => window.removeEventListener("scan-status", handleScanStatus);
  }, []);

  const triggerScan = async () => {
    if (!workspaceId || scanning) return;
    setScanning(true);
    window.dispatchEvent(new CustomEvent("scan-status", { detail: { scanning: true } }));
    toast.info("Scan running in background", { id: "bg-scan" });
    
    try {
      const res = await fetch(`/api/scan/${workspaceId}`, { method: "POST" });
      const resData = await res.json();
      
      window.dispatchEvent(new CustomEvent("scan-status", { detail: { scanning: false } }));
      
      if (resData.error) {
        toast.error(`Scan failed: ${resData.error}`);
      } else {
        toast.success("Scan complete! Analytics loaded.");
        window.location.reload();
      }
    } catch {
      window.dispatchEvent(new CustomEvent("scan-status", { detail: { scanning: false } }));
      toast.error("Scan failed — please try again");
    } finally {
      setScanning(false);
    }
  };

  // Standard Mock Calculations for Demo Mode
  const intentCounts = data?.intentCounts ?? {
    Hot: MOCK_SIGNALS.filter((s) => s.intent_level === "Hot").length,
    Warm: MOCK_SIGNALS.filter((s) => s.intent_level === "Warm").length,
    Cold: MOCK_SIGNALS.filter((s) => s.intent_level === "Cold").length,
  };

  const total = data?.total ?? MOCK_SIGNALS.length;
  const savedCount = data?.statusCounts?.saved ?? MOCK_SIGNALS.filter((s) => s.status === "saved").length;
  const convertedCount = data?.statusCounts?.converted ?? 0;

  // Mock 14-day history
  const dailyData = data?.dailyData ?? [
    { name: "May 17", signals: 10 },
    { name: "May 18", signals: 14 },
    { name: "May 19", signals: 8 },
    { name: "May 20", signals: 15 },
    { name: "May 21", signals: 22 },
    { name: "May 22", signals: 12 },
    { name: "May 23", signals: 19 },
    { name: "May 24", signals: 15 },
    { name: "May 25", signals: 25 },
    { name: "May 26", signals: 32 },
    { name: "May 27", signals: 18 },
    { name: "May 28", signals: 28 },
    { name: "May 29", signals: 21 },
    { name: "May 30", signals: 35 },
  ];

  const sourceData = data
    ? Object.entries(data.sourceCounts).map(([name, value]) => ({ name, value }))
    : [
        { name: "Reddit", value: 45 },
        { name: "Hacker News", value: 25 },
        { name: "G2", value: 15 },
        { name: "LinkedIn", value: 30 },
        { name: "Web", value: 10 },
      ];

  const intentData = [
    { name: "Hot", value: intentCounts.Hot },
    { name: "Warm", value: intentCounts.Warm },
    { name: "Cold", value: intentCounts.Cold },
  ];

  const scanLogs = data?.scanLogs ?? [
    {
      id: "log-1",
      started_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date(Date.now() - 3600000 + 45000).toISOString(),
      status: "completed",
      signals_found: 12,
      signals_saved: 3,
    },
    {
      id: "log-2",
      started_at: new Date(Date.now() - 86400000).toISOString(),
      completed_at: new Date(Date.now() - 86400000 + 90000).toISOString(),
      status: "completed",
      signals_found: 8,
      signals_saved: 1,
    },
    {
      id: "log-3",
      started_at: new Date(Date.now() - 172800000).toISOString(),
      completed_at: new Date(Date.now() - 172800000 + 60000).toISOString(),
      status: "failed",
      signals_found: 0,
      signals_saved: 0,
    },
  ];

  // Competitor Intelligence Mock Fallback
  const competitorData = data?.competitorData ?? [
    {
      name: "ProCore",
      mentions: 14,
      sentiment: { positive: 1, negative: 10, neutral: 3 },
      trend: "up" as const,
      recentSignal: { id: "sig-1", title: "Looking for ProCore alternative", source_url: "https://reddit.com" }
    },
    {
      name: "PlanGrid",
      mentions: 8,
      sentiment: { positive: 2, negative: 4, neutral: 2 },
      trend: "flat" as const,
      recentSignal: { id: "sig-2", title: "PlanGrid pricing fatigue issues", source_url: "https://g2.com" }
    },
    {
      name: "Fieldwire",
      mentions: 5,
      sentiment: { positive: 3, negative: 1, neutral: 1 },
      trend: "down" as const,
      recentSignal: null
    }
  ];

  // ROI Tracker Mock Fallback
  const roiData = data?.roiData ?? {
    pipelineInfluenced: 42000,
    dealsClosed: 3,
    convertedSignals: [
      { id: "sig-101", title: "Medium-Sized GC Looking For ProCore Alternative", deal_value: 25000, company_name: "BuildTech Contractors" },
      { id: "sig-102", title: "Subcontractor seeking sync platforms", deal_value: 12000, company_name: "Apex Plumbing" },
      { id: "sig-103", title: "switching from PlanGrid pricing", deal_value: 5000, company_name: "Coastal Construction" }
    ]
  };

  // Keyword Performance Mock Fallback
  const keywordData = data?.keywordData ?? [
    { keyword: "alternative", signals: 18, avgScore: 8.5 },
    { keyword: "switching", signals: 12, avgScore: 7.8 },
    { keyword: "pricing", signals: 9, avgScore: 6.4 },
    { keyword: "construction", signals: 7, avgScore: 5.2 },
    { keyword: "sync", signals: 4, avgScore: 7.1 }
  ];

  // Market Brief Mock Fallback
  const marketBrief = data?.marketBrief ?? {
    brief_text: "Over the past week, B2B demand signals have indicated a significant shift in buyer research patterns. The primary focus has moved towards rapid-deployment tooling and low-overhead infrastructure, with many organizations showing increasing friction with legacy enterprise software. Additionally, security compliance and multi-platform sync integrations have emerged as absolute requirements for early-stage evaluation.\n\nCompetitors are currently facing elevated complaints regarding customer support latency and licensing cost structures, creating a high-volume window of opportunity for direct displacement. Sales teams should prioritize direct outbound outreach highlighting migration support and direct cost comparisons.\n\nOutreach velocity should be increased on developer communities and social platforms, where immediate solution suggestions yield the highest positive response rates.",
    key_themes: [
      "Transitioning from legacy SaaS pipelines",
      "Integrations & developer experience friction",
      "Pricing transparency as a buying trigger",
      "Infrastructure migration support demand",
      "Platform reliability & multi-source support"
    ],
    competitor_movements: "Competitors are facing pricing fatigue and customer support backlogs, especially around enterprise scaling capabilities.",
    top_opportunity: {
      id: "sig-101",
      title: "Medium-Sized GC Looking For ProCore Alternative",
      summary: "High-value general contractor expressing frustration with ProCore licensing tiers and actively seeking a modern competitor.",
      intent_score: 9
    }
  };

  const getDuration = (start: string, end?: string, status?: string) => {
    if (!end) {
      if (status === "running") {
        const isStuck = Date.now() - new Date(start).getTime() > 10 * 60 * 1000;
        if (isStuck) return "Timed Out";
      }
      return "Running...";
    }
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffSecs = Math.max(1, Math.round(diffMs / 1000));
    if (diffSecs < 60) return `${diffSecs}s`;
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    return `${mins}m ${secs}s`;
  };

  // If live and has zero signals, show premium Empty State CTA
  const showEmptyState = total === 0 && !isDemo;

  return (
    <div className="flex w-full min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Workspace Analytics</h1>
              <p className="text-muted-foreground text-sm">
                {isDemo
                  ? "Displaying demo telemetry — set up a workspace for live intelligence."
                  : "B2B intent telemetry & Bright Data crawl metrics."}
              </p>
            </div>
            {workspaceId && !showEmptyState && (
              <Button
                onClick={triggerScan}
                disabled={scanning}
                size="sm"
                className="gap-1.5 shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {scanning ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Scanning...
                  </>
                ) : (
                  <>
                    <Play size={14} /> Scan Now (S)
                  </>
                )}
              </Button>
            )}
          </header>

          {isDemo && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3.5 mb-6 text-sm text-primary flex items-center gap-2">
              <TrendingUp size={16} />
              <span>
                Demo Telemetry —{" "}
                <a href="/onboard" className="underline font-semibold hover:text-primary-foreground">
                  Complete onboarding
                </a>{" "}
                to start parsing live signals.
              </span>
            </div>
          )}

          {showEmptyState ? (
            /* Premium Empty State CTA */
            <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card p-12 max-w-xl mx-auto mt-12 space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-pulse border border-primary/20">
                <BarChart3 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Run your first scan to see analytics</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We need to crawl search queries and assess lead intent before charts can render. Launch a query check now.
                </p>
              </div>
              <Button
                onClick={triggerScan}
                disabled={scanning}
                className="bg-primary hover:bg-primary/95 text-white gap-2 font-bold px-6 py-5 shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                {scanning ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Initializing Crawler...
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    Start Live Crawl
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Premium Stat Cards with Accent Lines */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                <Card className="bg-card border-border border-l-4 border-l-muted-foreground relative overflow-hidden select-none hover:bg-card-hover transition-colors">
                  <CardHeader className="pb-1 p-4">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Signals</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <div className="text-2xl font-extrabold tracking-tight text-foreground">{total}</div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Scraped leads</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border border-l-4 border-l-destructive relative overflow-hidden select-none hover:bg-card-hover transition-colors">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-destructive/5 rounded-full blur-xl pointer-events-none" />
                  <CardHeader className="pb-1 p-4">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-destructive">🔥 Hot Signals</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <div className="text-2xl font-extrabold tracking-tight text-destructive">{intentCounts.Hot}</div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">High urgency</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border border-l-4 border-l-primary relative overflow-hidden select-none hover:bg-card-hover transition-colors">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                  <CardHeader className="pb-1 p-4">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-primary">Saved Signals</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <div className="text-2xl font-extrabold tracking-tight text-primary">{savedCount}</div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Bookmarked leads</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border border-l-4 border-l-green-500 relative overflow-hidden select-none hover:bg-card-hover transition-colors">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full blur-xl pointer-events-none" />
                  <CardHeader className="pb-1 p-4">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-green-500">Converted Leads</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <div className="text-2xl font-extrabold tracking-tight text-green-500">{convertedCount}</div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Won accounts</p>
                  </CardContent>
                </Card>

                {/* Pipeline Influenced stat card */}
                <Card className="bg-card border-border border-l-4 border-l-[#818cf8] relative overflow-hidden select-none hover:bg-card-hover transition-colors col-span-1">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                  <CardHeader className="pb-1 p-4">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#818cf8]">Pipeline Influenced</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <div className="text-2xl font-extrabold tracking-tight text-[#818cf8] font-mono">
                      ${roiData.pipelineInfluenced.toLocaleString()}
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Total closed revenue</p>
                  </CardContent>
                </Card>

                {/* Deals Closed stat card */}
                <Card className="bg-card border-border border-l-4 border-l-indigo-400 relative overflow-hidden select-none hover:bg-card-hover transition-colors col-span-1">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                  <CardHeader className="pb-1 p-4">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Deals Closed</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <div className="text-2xl font-extrabold tracking-tight text-indigo-400">{roiData.dealsClosed}</div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Won deal counts</p>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly Market Brief Card */}
              {marketBrief && (
                <Card className="bg-card border-border mb-8 overflow-hidden relative select-none">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                  <CardHeader className="pb-2 border-b border-border/60 bg-white/5">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-primary" />
                      <CardTitle className="text-base font-bold text-foreground">AI Market Intelligence Brief</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Generated every Sunday night based on weekly intent signals.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Paragraph Analysis */}
                    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {marketBrief.brief_text}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                      {/* Key Themes */}
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">📌 Key Market Themes</h4>
                        <ul className="space-y-1.5">
                          {marketBrief.key_themes.map((theme, idx) => (
                            <li key={idx} className="flex gap-2 items-start text-xs text-muted-foreground">
                              <span className="text-primary mt-0.5 select-none font-bold">•</span>
                              <span>{theme}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Competitor Movements */}
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">⚔️ Competitor Movements</h4>
                        <div className="text-xs text-muted-foreground bg-white/5 border border-border p-3.5 rounded-lg leading-relaxed italic font-medium">
                          {marketBrief.competitor_movements}
                        </div>
                        {marketBrief.top_opportunity && (
                          <div className="mt-2.5 p-3.5 bg-green-500/5 border border-green-500/10 rounded-lg">
                            <div className="text-[9px] font-bold text-green-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
                              <Award size={12} /> Top Weekly Opportunity
                            </div>
                            <h5 className="text-xs font-bold text-foreground mt-1 truncate">{typeof marketBrief.top_opportunity === "string" ? marketBrief.top_opportunity : (marketBrief.top_opportunity as {title?: string})?.title || "—"}</h5>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 14-day Smooth curve Line Chart */}
              <Card className="bg-card border-border mb-8 select-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-bold">Intent Capture Telemetry (Last 14 Days)</CardTitle>
                  <CardDescription className="text-xs">Dynamic check frequency metrics mapped by daily capture counts.</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" vertical={false} />
                      <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#141414", borderColor: "#222", borderRadius: "8px" }} 
                        itemStyle={{ color: "#6366f1", fontSize: "11px", fontWeight: "bold" }}
                        labelStyle={{ color: "#aaa", fontSize: "10px", fontFamily: "monospace" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="signals"
                        name="Scraped Signals"
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Competitor Intelligence & Keyword performance Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 select-none">
                {/* Competitor mention tracker card */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-4 border-b border-border/40">
                    <CardTitle className="text-base font-bold text-foreground">Competitor Intelligence</CardTitle>
                    <CardDescription className="text-xs">Mentions, WoW trends, and sentiment breakdown of prospects.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {competitorData.length === 0 ? (
                      <p className="text-center py-10 text-xs text-muted-foreground">No competitors currently tracked in settings.</p>
                    ) : (
                      competitorData.map((comp) => {
                        const totalSentiments = comp.sentiment.positive + comp.sentiment.negative + comp.sentiment.neutral || 1;
                        const posPct = Math.round((comp.sentiment.positive / totalSentiments) * 100);
                        const negPct = Math.round((comp.sentiment.negative / totalSentiments) * 100);
                        const neuPct = 100 - posPct - negPct;

                        return (
                          <div key={comp.name} className="space-y-2 border-b border-border/40 pb-4 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground">{comp.name}</span>
                                <span className="bg-white/5 border border-border px-1.5 py-0.5 rounded text-[9px] font-mono text-muted-foreground font-semibold">
                                  {comp.mentions} mentions
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold">
                                <span>WoW Trend:</span>
                                {comp.trend === "up" && <span className="text-red-500 flex items-center">↗ UP</span>}
                                {comp.trend === "down" && <span className="text-green-500 flex items-center">↘ DOWN</span>}
                                {comp.trend === "flat" && <span className="text-muted-foreground flex items-center">→ FLAT</span>}
                              </div>
                            </div>

                            {/* Sentiment Bar Chart per competitor */}
                            <div className="h-2 w-full rounded overflow-hidden flex bg-white/5">
                              {comp.sentiment.positive > 0 && <div className="h-full bg-green-500" style={{ width: `${posPct}%` }} title={`Positive: ${posPct}%`} />}
                              {comp.sentiment.neutral > 0 && <div className="h-full bg-muted-foreground/30" style={{ width: `${neuPct}%` }} title={`Neutral: ${neuPct}%`} />}
                              {comp.sentiment.negative > 0 && <div className="h-full bg-red-500" style={{ width: `${negPct}%` }} title={`Negative: ${negPct}%`} />}
                            </div>

                            {/* Legend / Mentions recent */}
                            <div className="flex justify-between items-center text-[9px] font-semibold text-muted-foreground">
                              <div className="flex gap-2">
                                <span className="text-green-400">Pos ({posPct}%)</span>
                                <span>Neu ({neuPct}%)</span>
                                <span className="text-red-400 font-bold">Neg ({negPct}%)</span>
                              </div>
                              {comp.recentSignal && (
                                <a 
                                  href={comp.recentSignal.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-0.5 truncate max-w-[160px]"
                                >
                                  Recent: {comp.recentSignal.title} <ExternalLink size={8} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* Keyword Productivity performance chart */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-4 border-b border-border/40">
                    <CardTitle className="text-base font-bold text-foreground">Keyword Performance</CardTitle>
                    <CardDescription className="text-xs">Productivity lists mapping keywords to captured lead yields.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {keywordData.length === 0 ? (
                      <p className="text-center py-10 text-xs text-muted-foreground">No monitored keywords currently tracked.</p>
                    ) : (
                      keywordData.map((kw) => {
                        // Max signals scaling for bar representation
                        const maxSignals = Math.max(...keywordData.map((k) => k.signals), 1);
                        const pct = Math.round((kw.signals / maxSignals) * 100);

                        // Color coding based on average intent score
                        let barColor = "bg-green-500/60";
                        if (kw.avgScore >= 7.5) barColor = "bg-red-500/60 border-red-500/40";
                        else if (kw.avgScore >= 5.0) barColor = "bg-amber-500/60 border-amber-500/40";

                        return (
                          <div key={kw.keyword} className="space-y-1.5 text-xs">
                            <div className="flex justify-between items-center font-semibold">
                              <span className="font-mono text-muted-foreground">{kw.keyword}</span>
                              <div className="flex gap-2 font-mono text-[10px]">
                                <span>{kw.signals} leads</span>
                                <span className="text-primary font-bold">avg {kw.avgScore} score</span>
                              </div>
                            </div>
                            <div className="h-6 w-full rounded border border-border/50 overflow-hidden flex bg-white/5 relative items-center">
                              <div className={`h-full border-r ${barColor}`} style={{ width: `${pct}%` }} />
                              <span className="absolute left-2 text-[9px] font-bold uppercase tracking-wider font-mono text-white pointer-events-none">
                                {pct}% Yield
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Two Side-by-Side Donut Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 select-none">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Telemetry by Source</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64 flex flex-col justify-between">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={sourceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {sourceData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#141414", borderColor: "#222", borderRadius: "6px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
                      {sourceData.map((s, i) => (
                        <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-sm"
                            style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
                          />
                          {s.name} ({s.value})
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Breakdown by Intent</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64 flex flex-col justify-between">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={intentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {intentData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={INTENT_COLORS[index % INTENT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#141414", borderColor: "#222", borderRadius: "6px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2 font-semibold">
                      {intentData.map((s, i) => (
                        <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-sm"
                            style={{ background: INTENT_COLORS[i % INTENT_COLORS.length] }}
                          />
                          {s.name} ({s.value})
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ROI Converted Deals Table */}
              <Card className="bg-card border-border mb-8 overflow-hidden select-none">
                <CardHeader className="pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <CardTitle className="text-base font-bold text-foreground">Converted B2B Deals & Revenue (ROI Tracker)</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Tabular list of converted leads with confirmed deal value metrics.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="overflow-x-auto">
                    {roiData.convertedSignals.length === 0 ? (
                      <div className="text-center py-10 text-xs text-muted-foreground">No converted deals closed yet. Drag saved signals to Converted to see them here!</div>
                    ) : (
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-y border-border bg-white/5 text-muted-foreground uppercase font-bold tracking-wider">
                            <th className="py-2.5 px-6">Lead Title</th>
                            <th className="py-2.5 px-6">Account Name</th>
                            <th className="py-2.5 px-6 text-right">Deal Value ($)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roiData.convertedSignals.map((signal) => (
                            <tr key={signal.id} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-6 text-foreground font-bold max-w-sm truncate">
                                {signal.title}
                              </td>
                              <td className="py-3 px-6 text-muted-foreground font-semibold">
                                {signal.company_name || "Self/Independent Lead"}
                              </td>
                              <td className="py-3 px-6 text-right font-mono text-green-500 font-bold text-sm">
                                ${signal.deal_value.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Extended Scan History Table */}
              <Card className="bg-card border-border select-none overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-bold">Bright Data Scan Log History (Last 10 Scans)</CardTitle>
                  <CardDescription className="text-xs">Trace connection, scan times, duration, and signal yields.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-y border-border bg-white/5 text-muted-foreground uppercase font-bold tracking-wider">
                          <th className="py-2.5 px-6">Date Scanned</th>
                          <th className="py-2.5 px-6">Duration</th>
                          <th className="py-2.5 px-6">Signals Found</th>
                          <th className="py-2.5 px-6 text-right">Crawl Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scanLogs.map((log) => {
                          const displayDuration = getDuration(log.started_at, log.completed_at, log.status);

                          return (
                            <tr key={log.id} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-6 text-muted-foreground font-semibold">
                                {new Date(log.started_at).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </td>
                              <td className="py-3 px-6 font-mono text-muted-foreground font-semibold">
                                {displayDuration}
                              </td>
                              <td className="py-3 px-6 font-bold text-foreground">
                                {log.signals_found} found <span className="text-[10px] text-primary">({log.signals_saved} saved)</span>
                              </td>
                              <td className="py-3 px-6 text-right">
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                    log.status === "completed"
                                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                                      : log.status === "running"
                                      ? "bg-primary/10 border-primary/20 text-primary animate-pulse"
                                      : "bg-destructive/10 border-destructive/20 text-destructive"
                                  }`}
                                >
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
