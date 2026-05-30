"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, ArrowRight } from "lucide-react";

interface AIConfig {
  provider: string;
  aimlConfigured: boolean;
  aimlModel: string;
  geminiConfigured: boolean;
  resendConfigured: boolean;
  brightdataConfigured: boolean;
  workspaceId: string | null;
}

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [testResult, setTestResult] = useState<{ [key: string]: { type: "ok" | "err"; msg: string } }>({});
  const [testing, setTesting] = useState<{ [key: string]: boolean }>({});

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings/ai");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const triggerTest = async (key: string, url: string) => {
    setTesting((prev) => ({ ...prev, [key]: true }));
    setTestResult((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });

    try {
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setTestResult((prev) => ({
          ...prev,
          [key]: { type: "ok", msg: data.message ?? "Test completed successfully!" },
        }));
      } else {
        setTestResult((prev) => ({
          ...prev,
          [key]: { type: "err", msg: data.error ?? "Test failed" },
        }));
      }
    } catch {
      setTestResult((prev) => ({
        ...prev,
        [key]: { type: "err", msg: "Request failed" },
      }));
    } finally {
      setTesting((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </main>
      </div>
    );
  }

  const integrations = [
    {
      id: "aiml",
      title: "AI/ML API Integration",
      description: "Access leading open-source models (Llama 3.1, Claude 3.5, DeepSeek) through a unified endpoint.",
      icon: "⚡",
      badge: config?.provider === "aiml" ? (
        <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold">Active Provider</Badge>
      ) : config?.aimlConfigured ? (
        <Badge variant="secondary" className="bg-white/5 border border-border text-muted-foreground text-xs font-semibold">Standby (Key Saved)</Badge>
      ) : (
        <Badge variant="destructive" className="bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold">Not Configured</Badge>
      ),
      details: [
        { label: "Selected Model", value: config?.aimlModel ?? "meta-llama/llama-3.1-70b-instruct" },
        { label: "Connection Base", value: "https://api.aimlapi.com/v1" },
        { label: "API Key status", value: config?.aimlConfigured ? "✓ Configured (Masked)" : "✗ Missing Key" }
      ],
      actions: (
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            className="w-full text-xs h-9" 
            onClick={() => window.location.href = "/settings"}
          >
            Configure in Settings
          </Button>
          <a
            href="https://aimlapi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center shrink-0 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-all px-3 h-9"
          >
            Get API Key
          </a>
        </div>
      )
    },
    {
      id: "gemini",
      title: "Google Gemini Integration",
      description: "Direct connection to Google's highly-optimized Gemini models for text and schema processing.",
      icon: "♊",
      badge: config?.provider === "gemini" ? (
        <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold">Active Provider</Badge>
      ) : config?.geminiConfigured ? (
        <Badge variant="secondary" className="bg-white/5 border border-border text-muted-foreground text-xs font-semibold">Standby (Key Saved)</Badge>
      ) : (
        <Badge variant="destructive" className="bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold">Not Configured</Badge>
      ),
      details: [
        { label: "Active Model", value: "gemini-3.5-flash" },
        { label: "Rate Limit Logic", value: "Dynamic Pacing & Backoff" },
        { label: "API Key status", value: config?.geminiConfigured ? "✓ Configured (Masked)" : "✗ Missing Key" }
      ],
      actions: (
        <Button 
          variant="outline" 
          className="w-full text-xs h-9" 
          onClick={() => window.location.href = "/settings"}
        >
          Configure in Settings
        </Button>
      )
    },
    {
      id: "slack",
      title: "Slack Webhook Alerts",
      description: "Instant Slack messages pushed directly to your channels when 🔥 Hot buying signals are extracted.",
      icon: "💬",
      badge: config?.brightdataConfigured ? (
        <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold">Active Alerts</Badge>
      ) : (
        <Badge variant="destructive" className="bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold">Not Configured</Badge>
      ),
      details: [
        { label: "Alert Trigger", value: "Signal Intent Score ≥ 7" },
        { label: "Payload Format", value: "Slack Rich Block Kit" },
        { label: "Webhook Setup", value: "Enabled via Workspace Settings" }
      ],
      actions: (
        <div className="flex flex-col gap-2 w-full">
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              className="flex-1 text-xs h-9" 
              onClick={() => window.location.href = "/settings"}
            >
              Update URL
            </Button>
            <Button
              variant="secondary"
              className="shrink-0 text-xs h-9"
              onClick={() => triggerTest("slack", `/api/slack-test/${config?.workspaceId || "none"}`)}
              disabled={testing["slack"] || !config?.workspaceId}
            >
              {testing["slack"] ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} className="mr-1" />}
              Send Test
            </Button>
          </div>
          {testResult["slack"] && (
            <p className={`text-xs mt-1 ${testResult["slack"].type === "ok" ? "text-green-400" : "text-destructive"}`}>
              {testResult["slack"].msg}
            </p>
          )}
        </div>
      )
    },
    {
      id: "resend",
      title: "Resend HTML Digests",
      description: "Beautiful custom responsive HTML digests containing lists of daily potential buyer leads.",
      icon: "✉️",
      badge: config?.resendConfigured ? (
        <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold">Connected</Badge>
      ) : (
        <Badge variant="destructive" className="bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold">Not Configured</Badge>
      ),
      details: [
        { label: "Digest Time", value: "09:00 AM UTC Daily" },
        { label: "Provider Service", value: "Resend Email Infrastructure" },
        { label: "API Key status", value: config?.resendConfigured ? "✓ Configured (Masked)" : "✗ Missing Key" }
      ],
      actions: (
        <div className="flex flex-col gap-2 w-full">
          <Button
            variant="outline"
            className="w-full text-xs h-9"
            onClick={() => triggerTest("resend", `/api/digest/${config?.workspaceId || "none"}`)}
            disabled={testing["resend"] || !config?.resendConfigured || !config?.workspaceId}
          >
            {testing["resend"] ? <Loader2 size={12} className="animate-spin" /> : "Send Manual Email Digest"}
          </Button>
          {testResult["resend"] && (
            <p className={`text-xs mt-1 ${testResult["resend"].type === "ok" ? "text-green-400" : "text-destructive"}`}>
              {testResult["resend"].msg}
            </p>
          )}
        </div>
      )
    },
    {
      id: "brightdata",
      title: "Bright Data SERP Crawling",
      description: "Enterprise-grade search engine crawling proxies to extract search results without IP bans.",
      icon: "🌐",
      badge: config?.brightdataConfigured ? (
        <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold">Connected</Badge>
      ) : (
        <Badge variant="destructive" className="bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold">Not Configured</Badge>
      ),
      details: [
        { label: "SERP Proxy Zone", value: "darkfunnel_serp" },
        { label: "Zone Format", value: "raw (JSON mode enabled)" },
        { label: "API status", value: config?.brightdataConfigured ? "✓ Operational" : "✗ Missing Credentials" }
      ],
      actions: (
        <a
          href="https://brightdata.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center rounded-md border border-border bg-transparent text-xs font-medium whitespace-nowrap transition-all outline-none hover:bg-white/5 h-9 gap-1.5 px-3 text-foreground"
        >
          View Bright Data Console <ArrowRight size={12} />
        </a>
      )
    }
  ];

  return (
    <div className="flex w-full min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">System Integrations</h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              Monitor and test your DarkFunnel connectivity suite. Toggle intelligence providers, send alerts, and verify automated operations.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {integrations.map((int) => (
              <Card key={int.id} className="bg-card border-border relative overflow-hidden flex flex-col justify-between">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl bg-white/5 w-12 h-12 rounded-lg flex items-center justify-center border border-border select-none shrink-0">
                        {int.icon}
                      </span>
                      <div>
                        <CardTitle className="text-lg font-bold">{int.title}</CardTitle>
                        <CardDescription className="text-xs leading-normal mt-1">{int.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-border text-xs text-muted-foreground font-medium">
                      <span>Connection Property</span>
                      <span>Config Value</span>
                    </div>
                    {int.details.map((detail, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">{detail.label}</span>
                        <span className="font-mono bg-white/5 border border-border px-1.5 py-0.5 rounded-sm truncate max-w-[200px]">
                          {detail.value}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center text-xs pt-2">
                      <span className="text-muted-foreground">Status Status</span>
                      {int.badge}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    {int.actions}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
