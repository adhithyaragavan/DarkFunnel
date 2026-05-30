"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, ArrowRight, ShieldCheck, Mail, MessageSquare, Terminal } from "lucide-react";
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
      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.user_email)) {
        setError("Please enter a valid email address.");
        toast.error("Please enter a valid email address");
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
    setLoadingMsg("🔍 Initializing target intent filters...");
    toast.info("Initializing onboarding configuration");

    const t1 = setTimeout(() => {
      setLoadingMsg("📡 Connecting Bright Data search proxies...");
      toast.info("Connecting search crawler proxies");
    }, 1500);

    const t2 = setTimeout(() => {
      setLoadingMsg("🚀 Launching DarkFunnel live pipeline!");
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#030303] w-full relative overflow-hidden select-none">
      {/* Mesh grid & glowing background orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-primary/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 my-8">
        <div className="mb-8 text-center">
          <div className="text-5xl mb-4 transition-transform duration-500 hover:rotate-12 cursor-pointer inline-block">🌑</div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">Welcome to DarkFunnel</h1>
          <p className="text-neutral-400 mt-2 text-xs md:text-sm font-medium">
            Let&apos;s configure your ethical web-crawlers and B2B buying filters.
          </p>
        </div>

        {/* Dynamic step checkmarks & indicators */}
        <div className="flex justify-between items-center mb-6 text-xs font-bold text-neutral-400 px-3">
          <div className={`flex items-center gap-2 transition-colors duration-300 ${step >= 1 ? "text-primary" : "text-neutral-500"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-black transition-all duration-300 ${step > 1 ? "bg-primary border-primary text-white" : step === 1 ? "border-primary text-primary shadow-[0_0_10px_rgba(99,102,241,0.2)]" : "border-white/[0.08]"}`}>
              {step > 1 ? "✓" : "1"}
            </span>
            <span>Product</span>
          </div>
          <div className={`h-px flex-1 mx-3 transition-colors duration-500 ${step > 1 ? "bg-primary/50" : "bg-white/[0.08]"}`} />
          <div className={`flex items-center gap-2 transition-colors duration-300 ${step >= 2 ? "text-primary" : "text-neutral-500"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-black transition-all duration-300 ${step > 2 ? "bg-primary border-primary text-white" : step === 2 ? "border-primary text-primary shadow-[0_0_10px_rgba(99,102,241,0.2)]" : "border-white/[0.08]"}`}>
              {step > 2 ? "✓" : "2"}
            </span>
            <span>Market</span>
          </div>
          <div className={`h-px flex-1 mx-3 transition-colors duration-500 ${step > 2 ? "bg-primary/50" : "bg-white/[0.08]"}`} />
          <div className={`flex items-center gap-2 transition-colors duration-300 ${step >= 3 ? "text-primary" : "text-neutral-500"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-black transition-all duration-300 ${step === 3 ? "border-primary text-primary shadow-[0_0_10px_rgba(99,102,241,0.2)]" : "border-white/[0.08]"}`}>
              3
            </span>
            <span>Launch</span>
          </div>
        </div>

        {/* Animated progress bar */}
        <div className="h-1.5 bg-white/[0.06] rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out shadow-[0_0_8px_rgba(99,102,241,0.5)]"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <Card className="bg-black/60 backdrop-blur-xl border border-white/[0.08] shadow-[0_0_50px_-12px_rgba(99,102,241,0.15)] rounded-2xl overflow-hidden">
          <div className="relative w-full overflow-hidden">
            {/* Smooth slide container */}
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${(step - 1) * 33.3333}%)`, width: "300%" }}
            >
              {/* Step 1 */}
              <div className="w-[33.333%] shrink-0 p-6 flex flex-col justify-between min-h-[385px]">
                <div>
                  <CardHeader className="px-0 pt-0 pb-4">
                    <CardTitle className="text-lg font-bold text-white">Step 1: Your Product</CardTitle>
                    <CardDescription className="text-neutral-400 text-xs">Define what you sell and who buys it.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-0 pb-0">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-neutral-300">Your Work Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="founder@company.com"
                        className="bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] focus-visible:ring-primary/20 focus-visible:border-primary/50 text-neutral-200 placeholder:text-neutral-600 transition-all h-9"
                        value={form.user_email}
                        onChange={(e) => set("user_email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="product" className="text-xs font-semibold text-neutral-300">Describe your product</Label>
                      <Textarea
                        id="product"
                        placeholder="We sell project management software for construction companies..."
                        className="bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] focus-visible:ring-primary/20 focus-visible:border-primary/50 text-neutral-200 placeholder:text-neutral-600 transition-all min-h-[76px]"
                        value={form.product_description}
                        onChange={(e) => set("product_description", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="icp" className="text-xs font-semibold text-neutral-300">Who is your ideal customer?</Label>
                      <Textarea
                        id="icp"
                        placeholder="Construction project managers at companies with 50-500 employees..."
                        className="bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] focus-visible:ring-primary/20 focus-visible:border-primary/50 text-neutral-200 placeholder:text-neutral-600 transition-all min-h-[72px]"
                        value={form.icp_description}
                        onChange={(e) => set("icp_description", e.target.value)}
                      />
                    </div>
                  </CardContent>
                </div>
                
                <div className="pt-4 text-[10px] text-neutral-500 flex items-start gap-2 select-none leading-relaxed border-t border-white/[0.06] mt-5 animate-in fade-in slide-in-from-bottom-1 duration-300 font-medium">
                  <ShieldCheck size={14} className="shrink-0 text-emerald-400 mt-0.5" />
                  <span>
                    DarkFunnel only monitors publicly available web content
                    via Bright Data&apos;s ethical web infrastructure.
                    We never access private or gated data.
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="w-[33.333%] shrink-0 p-6 flex flex-col justify-between min-h-[385px]">
                <div>
                  <CardHeader className="px-0 pt-0 pb-4">
                    <CardTitle className="text-lg font-bold text-white">Step 2: The Market</CardTitle>
                    <CardDescription className="text-neutral-400 text-xs">
                      Provide competitor brands and high-relevance buyer keywords.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 px-0 pb-0">
                    <div className="space-y-1.5">
                      <Label htmlFor="competitors" className="text-xs font-semibold text-neutral-300">Competitors (comma separated)</Label>
                      <Input
                        id="competitors"
                        placeholder="HubSpot, Salesforce, Pipedrive"
                        className="bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] focus-visible:ring-primary/20 focus-visible:border-primary/50 text-neutral-200 placeholder:text-neutral-600 transition-all h-9"
                        value={form.competitors}
                        onChange={(e) => set("competitors", e.target.value)}
                      />
                      <span className="text-[10px] text-neutral-500 font-medium block">We will crawl developer forums and review sites looking for discussions mentioning these brands.</span>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="keywords" className="text-xs font-semibold text-neutral-300">Keywords to track (comma separated)</Label>
                      <Input
                        id="keywords"
                        placeholder="CRM alternatives, sales software review"
                        className="bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] focus-visible:ring-primary/20 focus-visible:border-primary/50 text-neutral-200 placeholder:text-neutral-600 transition-all h-9"
                        value={form.keywords}
                        onChange={(e) => set("keywords", e.target.value)}
                      />
                      <span className="text-[10px] text-neutral-500 font-medium block">Key terms associated with purchase intent, software evaluation, or product research.</span>
                    </div>
                  </CardContent>
                </div>
              </div>

              {/* Step 3 */}
              <div className="w-[33.333%] shrink-0 p-6 flex flex-col justify-between min-h-[385px]">
                <div>
                  <CardHeader className="px-0 pt-0 pb-4">
                    <CardTitle className="text-lg font-bold text-white">Step 3: Alerts & Launch</CardTitle>
                    <CardDescription className="text-neutral-400 text-xs">Configure notifications and trigger your initial scan.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-0 pb-0">
                    <div className="flex items-center justify-between p-3.5 border border-white/[0.06] rounded-xl bg-white/[0.01] text-xs">
                      <div className="flex gap-2.5 items-start">
                        <Mail size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-neutral-200">Daily Email Digest</h4>
                          <p className="text-[10px] text-neutral-500 mt-0.5 font-medium">
                            Receive daily intent briefs every morning.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {form.email_digest_enabled && (
                          <Input
                            type="time"
                            value={form.email_digest_time}
                            onChange={(e) => set("email_digest_time", e.target.value)}
                            className="w-20 bg-white/[0.02] border-white/[0.08] text-neutral-200 text-xs h-7 px-1.5 focus-visible:ring-primary/20 animate-in fade-in duration-300"
                          />
                        )}
                        <Button
                          variant={form.email_digest_enabled ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-[10px] px-2.5 font-bold transition-all"
                          onClick={() => set("email_digest_enabled", !form.email_digest_enabled)}
                        >
                          {form.email_digest_enabled ? "On" : "Off"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="slack" className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-indigo-400" />
                        Slack Webhook URL (Optional)
                      </Label>
                      <Input
                        id="slack"
                        placeholder="https://hooks.slack.com/services/..."
                        className="bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] focus-visible:ring-primary/20 focus-visible:border-primary/50 text-neutral-200 placeholder:text-neutral-600 transition-all h-9 text-xs"
                        value={form.slack_webhook_url}
                        onChange={(e) => set("slack_webhook_url", e.target.value)}
                      />
                    </div>

                    {/* Console Live Log Preview */}
                    <div className="border border-white/[0.06] bg-black/40 rounded-xl p-3 font-mono text-[9px] text-neutral-400 select-none relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                      
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2">
                        <div className="flex items-center gap-1">
                          <Terminal size={10} className="text-neutral-500" />
                          <span className="text-[8px] text-neutral-300 font-bold">DarkFunnel_Scanner.sh</span>
                        </div>
                        <span className="text-primary font-bold animate-pulse text-[8px] flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          Live pipeline ready
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-2 text-neutral-500 font-semibold">
                        <div className="border border-white/[0.04] p-1 rounded bg-white/[0.01]">
                          <div>INTENT SCAN</div>
                          <div className="text-[10px] font-black text-neutral-300 mt-0.5">Enabled</div>
                        </div>
                        <div className="border border-white/[0.04] p-1 rounded bg-white/[0.01]">
                          <div>CRAWL PROXY</div>
                          <div className="text-[10px] font-black text-neutral-300 mt-0.5">Bright Data</div>
                        </div>
                      </div>
                      
                      <div className="space-y-0.5 text-[7.5px] font-medium leading-relaxed">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <span>[CRAWL]</span> <span>monitoring developer spaces...</span>
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <span>[MODEL]</span> <span>Gemini scoring purchase signals...</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-6 mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 animate-in shake font-semibold">
              ⚠️ {error}
            </div>
          )}

          {loading && (
            <div className="mx-6 mb-2 p-4 bg-primary/10 border border-primary/20 rounded-xl text-xs text-indigo-400 flex items-center gap-3 justify-center select-none font-extrabold transition-all duration-300 animate-in fade-in">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span>{loadingMsg}</span>
            </div>
          )}

          <CardFooter className="flex justify-between pt-6 border-t border-white/[0.06] mt-4 p-6 bg-white/[0.01]">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={step === 1 || loading}
              className="text-neutral-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold gap-1.5"
            >
              <ArrowLeft size={14} />
              Back
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext} className="bg-primary hover:bg-primary/95 text-white font-bold text-xs gap-1.5 transition-all">
                Next Step
                <ArrowRight size={14} />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-2 active:scale-95 duration-200 transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] animate-pulse px-6"
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
