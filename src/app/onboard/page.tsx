"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form state
  const [form, setForm] = useState({
    user_email: "",
    product_description: "",
    icp_description: "",
    competitors: "",
    keywords: "",
    slack_webhook_url: "",
    email_digest_enabled: true,
    email_digest_time: "09:00",
  });

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleNext = () => {
    if (step === 1) {
      if (!form.user_email || !form.product_description || !form.icp_description) {
        setError("Please fill in all fields before continuing.");
        toast.error("Please fill in all fields before continuing");
        return;
      }
    }
    setError(null);
    setStep((s) => Math.min(s + 1, 3));
  };

  const handlePrev = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    // Sequential loading messages
    setLoadingMsg("🔍 Starting your first scan...");
    toast.info("Initializing onboarding configuration");

    const t1 = setTimeout(() => {
      setLoadingMsg("📡 Connecting to Bright Data...");
      toast.info("Connecting search crawler proxies");
    }, 1500);

    const t2 = setTimeout(() => {
      setLoadingMsg("✅ DarkFunnel is live!");
      toast.success("Workspace launched successfully!");
    }, 3000);

    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          competitors: form.competitors
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          keywords: form.keywords
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        clearTimeout(t1);
        clearTimeout(t2);
        setError(data.error ?? "Failed to create workspace");
        setLoading(false);
        toast.error(data.error ?? "Failed to create workspace");
        return;
      }

      // Trigger first scan in the background
      if (data.id) {
        fetch(`/api/scan/${data.id}`, { method: "POST" }).catch(() => {});
      }

      setTimeout(() => {
        router.push("/feed");
      }, 4500);
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
      toast.error("Onboarding failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background w-full">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center select-none">
          <div className="text-4xl mb-3 animate-pulse">🌑</div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to DarkFunnel</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Let&apos;s set up your signal monitoring profile.
          </p>
        </div>

        {/* Dynamic step checkmarks & indicators */}
        <div className="flex justify-between items-center mb-6 text-xs font-semibold text-muted-foreground select-none px-2">
          <div className={`flex items-center gap-1.5 transition-colors ${step >= 1 ? "text-primary" : ""}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-bold transition-all ${step > 1 ? "bg-primary border-primary text-primary-foreground" : step === 1 ? "border-primary text-primary" : "border-border"}`}>
              {step > 1 ? "✓" : "1"}
            </span>
            <span>Targeting</span>
          </div>
          <div className={`h-px bg-border flex-1 mx-3 transition-colors ${step > 1 ? "bg-primary/50" : ""}`} />
          <div className={`flex items-center gap-1.5 transition-colors ${step >= 2 ? "text-primary" : ""}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-bold transition-all ${step > 2 ? "bg-primary border-primary text-primary-foreground" : step === 2 ? "border-primary text-primary" : "border-border"}`}>
              {step > 2 ? "✓" : "2"}
            </span>
            <span>Market</span>
          </div>
          <div className={`h-px bg-border flex-1 mx-3 transition-colors ${step > 2 ? "bg-primary/50" : ""}`} />
          <div className={`flex items-center gap-1.5 transition-colors ${step >= 3 ? "text-primary" : ""}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-bold transition-all ${step === 3 ? "border-primary text-primary" : "border-border"}`}>
              3
            </span>
            <span>Launch</span>
          </div>
        </div>

        {/* Animated progress bar */}
        <div className="h-1 bg-border rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <div className="relative w-full overflow-hidden">
            {/* Smooth slide container */}
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${(step - 1) * 100}%)`, width: "300%" }}
            >
              {/* Step 1 */}
              <div className="w-[33.333%] shrink-0 p-6 flex flex-col justify-between">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Step 1: Your Product</CardTitle>
                  <CardDescription>Tell us what you sell and who buys it.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-0 pb-0">
                  <div className="space-y-2">
                    <Label htmlFor="email">Your Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="founder@company.com"
                      className="bg-input border-border"
                      value={form.user_email}
                      onChange={(e) => set("user_email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product">Describe your product</Label>
                    <Textarea
                      id="product"
                      placeholder="We sell project management software for construction companies..."
                      className="bg-input border-border min-h-[90px]"
                      value={form.product_description}
                      onChange={(e) => set("product_description", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icp">Who is your ideal customer?</Label>
                    <Textarea
                      id="icp"
                      placeholder="Construction project managers at companies with 50-500 employees..."
                      className="bg-input border-border min-h-[80px]"
                      value={form.icp_description}
                      onChange={(e) => set("icp_description", e.target.value)}
                    />
                  </div>
                  <div className="pt-3 text-[10px] text-muted-foreground/85 flex items-start gap-1.5 select-none leading-normal border-t border-border/30 mt-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
                    <span className="shrink-0 text-[11px] mt-0.5">🔒</span>
                    <span>
                      DarkFunnel only monitors publicly available web content
                      via Bright Data&apos;s ethical web infrastructure.
                      We never access private or gated data.
                    </span>
                  </div>
                </CardContent>
              </div>

              {/* Step 2 */}
              <div className="w-[33.333%] shrink-0 p-6 flex flex-col justify-between">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Step 2: The Market</CardTitle>
                  <CardDescription>
                    Who are your competitors and what keywords should we track?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-0 pb-0">
                  <div className="space-y-2">
                    <Label htmlFor="competitors">Competitors (comma separated)</Label>
                    <Input
                      id="competitors"
                      placeholder="HubSpot, Salesforce, Pipedrive"
                      className="bg-input border-border"
                      value={form.competitors}
                      onChange={(e) => set("competitors", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords to track (comma separated)</Label>
                    <Input
                      id="keywords"
                      placeholder="CRM alternatives, sales software review"
                      className="bg-input border-border"
                      value={form.keywords}
                      onChange={(e) => set("keywords", e.target.value)}
                    />
                  </div>
                </CardContent>
              </div>

              {/* Step 3 */}
              <div className="w-[33.333%] shrink-0 p-6 flex flex-col justify-between">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Step 3: Notifications & Launch</CardTitle>
                  <CardDescription>How do you want to receive active alerts?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-0 pb-0">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-black/10 text-xs">
                    <div>
                      <h4 className="font-semibold text-foreground">Daily Email Digest</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Receive a summary every morning.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="time"
                        value={form.email_digest_time}
                        onChange={(e) => set("email_digest_time", e.target.value)}
                        className="w-20 bg-input border-border text-xs h-7 px-1.5 animate-in fade-in"
                      />
                      <Button
                        variant={form.email_digest_enabled ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-[10px] px-2.5"
                        onClick={() => set("email_digest_enabled", !form.email_digest_enabled)}
                      >
                        {form.email_digest_enabled ? "On" : "Off"}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slack">Slack Webhook URL (Optional)</Label>
                    <Input
                      id="slack"
                      placeholder="https://hooks.slack.com/services/..."
                      className="bg-input border-border text-xs"
                      value={form.slack_webhook_url}
                      onChange={(e) => set("slack_webhook_url", e.target.value)}
                    />
                  </div>

                  {/* Dashboard Preview Illustration */}
                  <div className="border border-border bg-black/40 rounded-lg p-3 font-mono text-[9px] text-muted-foreground select-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-1.5">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500/80" />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500/80" />
                        <span className="ml-1 text-[8px] text-foreground font-semibold">DarkFunnel_Console.sh</span>
                      </div>
                      <span className="text-primary font-semibold animate-pulse text-[8px]">● Live Scan Ready</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      <div className="border border-border/30 p-1 rounded bg-white/5">
                        <div>CRAWL COVERAGE</div>
                        <div className="text-[10px] font-bold text-foreground mt-0.5">8,450 URLs</div>
                      </div>
                      <div className="border border-border/30 p-1 rounded bg-white/5">
                        <div>BUYING INTENT</div>
                        <div className="text-[10px] font-bold text-primary mt-0.5">92 leads</div>
                      </div>
                      <div className="border border-border/30 p-1 rounded bg-white/5">
                        <div>ALERTS</div>
                        <div className="text-[10px] font-bold text-green-400 mt-0.5">100% active</div>
                      </div>
                    </div>
                    
                    <div className="space-y-0.5 text-[8px]">
                      <div className="flex items-center gap-1.5 text-green-400">
                        <span>[CRAWL]</span> <span>scanning social feeds...</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-primary">
                        <span>[MODEL]</span> <span>assessing reddit thread intent... score 9/10 🔥</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-6 mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive animate-in shake">
              {error}
            </div>
          )}

          {loading && (
            <div className="mx-6 mb-2 p-4 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary flex items-center gap-3 justify-center select-none font-semibold transition-all duration-300 animate-in fade-in">
              <Loader2 size={16} className="animate-spin" />
              <span>{loadingMsg}</span>
            </div>
          )}

          <CardFooter className="flex justify-between pt-6 border-t border-border mt-4 p-6 bg-black/20">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={step === 1 || loading}
            >
              Back
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext}>Next Step →</Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-2 active:scale-95 duration-200 transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse px-6"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    🚀 Launch DarkFunnel
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
