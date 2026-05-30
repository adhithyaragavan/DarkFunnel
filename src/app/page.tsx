"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Shield, Zap, Bell, BarChart3, Database, Activity } from "lucide-react";

const DEMO_TICKERS = [
  {
    source: "reddit",
    title: "Looking for alternatives to ProCore for general contracting. Pricing is getting insane.",
    intent: "switching",
    score: 9,
    time: "Just now"
  },
  {
    source: "hackernews",
    title: "Is there any developer-friendly pipeline API with Jina scraping and LLM tagging?",
    intent: "question",
    score: 8,
    time: "1m ago"
  },
  {
    source: "g2",
    title: "PlanGrid pricing is becoming unscalable for medium teams. Seeking recommendations.",
    intent: "complaint",
    score: 7,
    time: "3m ago"
  },
  {
    source: "web",
    title: "Evaluating construction tech synchronizers with offline support and local DB sync.",
    intent: "evaluation",
    score: 6,
    time: "6m ago"
  },
  {
    source: "reddit",
    title: "We are outgrowing our current CRM. What is everyone using for B2B sales pipelines?",
    intent: "switching",
    score: 9,
    time: "12m ago"
  },
  {
    source: "hackernews",
    title: "Show HN: A lightweight alternative to Salesforce with direct email sync.",
    intent: "evaluation",
    score: 8,
    time: "15m ago"
  },
  {
    source: "g2",
    title: "HubSpot is too complex for our 10-person startup. Need something simpler.",
    intent: "complaint",
    score: 7,
    time: "20m ago"
  },
  {
    source: "web",
    title: "Comparing Apollo.io vs ZoomInfo for contact scraping in Europe.",
    intent: "question",
    score: 6,
    time: "30m ago"
  }
];

export default function Home() {
  const [activeTickers, setActiveTickers] = useState<typeof DEMO_TICKERS>([]);

  useEffect(() => {
    // Initialize with first 3 items immediately
    setActiveTickers(DEMO_TICKERS.slice(0, 3));
    let idx = 3;

    const interval = setInterval(() => {
      const nextItem = DEMO_TICKERS[idx % DEMO_TICKERS.length];
      setActiveTickers((prev) => {
        // Prepend new item and keep only the latest 4 items
        return [nextItem, ...prev.slice(0, 3)];
      });
      idx++;
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen bg-[#030303] text-foreground selection:bg-primary selection:text-white font-sans overflow-x-hidden">
      {/* Grid Background Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Navigation */}
      <header className="border-b border-white/[0.06] bg-black/40 backdrop-blur-md sticky top-0 z-40 select-none px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer">
            <span className="text-2xl transition-transform duration-500 group-hover:rotate-180">🌑</span>
            <span className="font-black tracking-tight text-xl text-white bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">DarkFunnel</span>
          </div>
          <div className="flex items-center gap-6">
            <a 
              href="/feed" 
              className="text-xs font-semibold text-muted-foreground hover:text-white transition-colors"
            >
              Dashboard
            </a>
            <a 
              href="/onboard" 
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Start Free →
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-28 px-6 overflow-hidden">
        {/* Colorful Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto text-center space-y-8 relative">
          <span className="bg-primary/10 text-indigo-400 border border-primary/20 font-mono text-[10px] font-bold py-1.5 px-4 tracking-wider uppercase inline-flex items-center gap-1.5 mx-auto rounded-full">
            🚀 BRIGHT DATA HACKATHON WINNER
          </span>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.08] animate-in fade-in slide-in-from-top-4 duration-500">
            Find Your Buyers <span className="bg-gradient-to-r from-indigo-400 via-primary to-purple-400 bg-clip-text text-transparent">Before They Find You</span>
          </h1>

          <p className="text-sm md:text-lg text-neutral-400 max-w-3xl mx-auto leading-relaxed font-medium">
            DarkFunnel monitors Reddit, Hacker News, G2, and the open web for real-time B2B intent signals — powered by Bright Data&apos;s ethical crawling infrastructure and Gemini&apos;s cognitive analysis.
          </p>

          <div className="flex flex-wrap gap-4 justify-center items-center select-none pt-4">
            <a 
              href="/onboard" 
              className="bg-primary hover:bg-primary/95 text-white font-extrabold text-sm px-8 py-4 rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              Start Free <ArrowRight size={18} />
            </a>
            <a 
              href="#how-it-works" 
              className="bg-white/[0.02] border border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.06] font-bold text-sm px-8 py-4 rounded-xl transition-all"
            >
              See How It Works ↓
            </a>
          </div>

          {/* HERO VISUAL: Live stream mock feed */}
          <div className="pt-16 max-w-4xl mx-auto select-none">
            <div className="bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-[0_0_50px_-12px_rgba(99,102,241,0.15)] relative text-left">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest font-mono">Live Scrape Stream</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 font-bold">Active monitor: 50+ sources</span>
              </div>

              <div className="space-y-3 min-h-[260px] overflow-hidden">
                {activeTickers.map((ticker, idx) => {
                  let badgeColor = "bg-green-500/10 text-green-400 border-green-500/20";
                  let borderLeft = "border-l-emerald-500";
                  
                  if (ticker.score >= 8) {
                    badgeColor = "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse";
                    borderLeft = "border-l-red-500";
                  } else if (ticker.score >= 7) {
                    badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                    borderLeft = "border-l-amber-500";
                  } else {
                    borderLeft = "border-l-blue-500";
                  }

                  return (
                    <div 
                      key={ticker.title + idx} 
                      className={`p-3.5 bg-white/[0.01] border-y border-r border-l-4 ${borderLeft} border-white/[0.06] hover:border-white/[0.12] rounded-r-xl rounded-l-md flex items-center justify-between gap-4 transition-all duration-300 transform animate-in slide-in-from-top-3 fade-in duration-500`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-base shrink-0 p-1.5 bg-white/[0.03] rounded-lg border border-white/[0.04]">
                          {ticker.source === "reddit" && "💬"}
                          {ticker.source === "hackernews" && "💻"}
                          {ticker.source === "g2" && "⭐️"}
                          {ticker.source === "web" && "🌐"}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-neutral-200 truncate max-w-sm md:max-w-xl">
                            {ticker.title}
                          </p>
                          <span className="text-[9px] font-medium text-neutral-500">{ticker.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider font-mono text-neutral-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                          {ticker.intent}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                          {ticker.score}/10
                        </span>
                      </div>
                    </div>
                  );
                })}
                {activeTickers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-xs text-neutral-400">
                    <Loader2 size={28} className="animate-spin text-primary mb-3" />
                    <span>Listening to Bright Data crawlers...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section className="border-y border-white/[0.06] bg-white/[0.01] py-10 text-center select-none px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-5">POWERED BY LEADING WEB DATA ARCHITECTURES</p>
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-6 text-xs font-mono font-black text-neutral-400">
            <span className="flex items-center gap-1.5 hover:text-white transition-colors">📡 BRIGHT DATA SERP</span>
            <span className="flex items-center gap-1.5 hover:text-white transition-colors">🤖 GOOGLE GEMINI</span>
            <span className="flex items-center gap-1.5 hover:text-white transition-colors">⚡️ SUPABASE ADMIN</span>
            <span className="flex items-center gap-1.5 hover:text-white transition-colors">🔺 VERCEL APPS</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-28 px-6 bg-black/40 relative select-none">
        <div className="max-w-6xl mx-auto space-y-20">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Process Flow</span>
            <h2 className="text-3xl md:text-5xl font-black text-white">How DarkFunnel Works</h2>
            <p className="text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed font-semibold">Zero configuration B2B intent scrapers deployed in three steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4 p-8 bg-white/[0.01] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl relative group hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute right-4 bottom-2 text-8xl font-mono font-black text-white/[0.01] select-none group-hover:text-white/[0.02] transition-colors">01</div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl">🎯</div>
              <h3 className="font-extrabold text-lg text-white">1. Describe Product & Competitors</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Outline what you sell and list key competitor brands. Gemini dynamically generates semantic intent triggers and signals targets.
              </p>
            </div>

            <div className="space-y-4 p-8 bg-white/[0.01] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl relative group hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute right-4 bottom-2 text-8xl font-mono font-black text-white/[0.01] select-none group-hover:text-white/[0.02] transition-colors">02</div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl">🔍</div>
              <h3 className="font-extrabold text-lg text-white">2. AI-Powered Scrape Engine</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Bright Data&apos;s ethical browser scrapers comb developer hubs, social forums, and blogs. AI engines inspect and score text payload for purchase context.
              </p>
            </div>

            <div className="space-y-4 p-8 bg-white/[0.01] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl relative group hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute right-4 bottom-2 text-8xl font-mono font-black text-white/[0.01] select-none group-hover:text-white/[0.02] transition-colors">03</div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl">📬</div>
              <h3 className="font-extrabold text-lg text-white">3. Deploy High-Intent Leads</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                High-intent deals populate your pipeline instantly. Get weekly AI market briefs, email alerts, and Slack webhooks when signals spike.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID SECTION */}
      <section className="py-28 px-6 border-t border-white/[0.06] select-none">
        <div className="max-w-6xl mx-auto space-y-20">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Capabilities</span>
            <h2 className="text-3xl md:text-5xl font-black text-white">Engineered For B2B Revenue</h2>
            <p className="text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed font-semibold">An end-to-end toolchain to unlock dark-funnel buying intent.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 border border-white/[0.06] hover:border-white/[0.12] rounded-2xl space-y-3 bg-white/[0.01] hover:bg-white/[0.02] transition-all duration-300 group hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-lg"><Activity size={18} className="text-red-400" /></div>
              <h4 className="font-extrabold text-base text-white">Real-Time Intent Scoring</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">Cognitive models score lead content from 1-10, classifying buyers by actual buying urgency and business fit.</p>
            </div>

            <div className="p-8 border border-border rounded-2xl space-y-3 bg-white/[0.01] hover:bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg"><Database size={18} className="text-indigo-400" /></div>
              <h4 className="font-extrabold text-base text-white">Multi-Source Monitoring</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">Consistently crawls developer forums, product review sites, social networks, and index blogs via API.</p>
            </div>

            <div className="p-8 border border-border rounded-2xl space-y-3 bg-white/[0.01] hover:bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg"><Zap size={18} className="text-amber-400" /></div>
              <h4 className="font-extrabold text-base text-white">AI Recommended Actions</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">Receive custom-tailored Sales Outreach scripts outlining exactly how to approach and close each signal.</p>
            </div>

            <div className="p-8 border border-border rounded-2xl space-y-3 bg-white/[0.01] hover:bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg"><BarChart3 size={18} className="text-emerald-400" /></div>
              <h4 className="font-extrabold text-base text-white">Market Intelligence</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">Generates weekly market trends, competitor sentiment tracker indices, and keyword intelligence reports.</p>
            </div>

            <div className="p-8 border border-border rounded-2xl space-y-3 bg-white/[0.01] hover:bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-lg"><Bell size={18} className="text-purple-400" /></div>
              <h4 className="font-extrabold text-base text-white">Instant Alert Spikes</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">Spike monitors flag unusual intent signal velocity, dispatching instant notifications to Slack and email.</p>
            </div>

            <div className="p-8 border border-border rounded-2xl space-y-3 bg-white/[0.01] hover:bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg"><Shield size={18} className="text-blue-400" /></div>
              <h4 className="font-extrabold text-base text-white">CRM Pipeline Ready</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium font-sans">Drag-and-drop pipeline Kanban board with ROI closed deals tracking, activity audits, and CSV data exports.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-white/[0.01] border-y border-white/[0.06] py-14 text-center select-none px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-around items-center gap-8 font-mono font-bold text-neutral-400">
          <div>
            <div className="text-4xl text-white font-black mb-1 bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">10,000+</div>
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Signals Analyzed</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-white/[0.08]" />
          <div>
            <div className="text-4xl text-white font-black mb-1 bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">50+</div>
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Sources Monitored</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-white/[0.08]" />
          <div>
            <div className="text-sm text-neutral-200 uppercase tracking-wide leading-relaxed max-w-[280px] mx-auto font-sans font-extrabold">
              Built for the Bright Data Web Data UNLOCKED Hackathon 🏆
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA SECTION */}
      <section className="py-28 px-6 text-center select-none relative overflow-hidden">
        {/* Glow behind CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-3xl mx-auto space-y-8 relative">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Ready to find your buyers?</h2>
          <p className="text-sm md:text-base text-neutral-400 leading-relaxed font-semibold max-w-xl mx-auto">
            Configure your product keywords in seconds and deploy our ethical web crawlers to deliver buying opportunities straight to your feed.
          </p>
          <a 
            href="/onboard" 
            className="inline-flex bg-primary hover:bg-primary/95 text-white font-extrabold text-sm px-10 py-4 rounded-xl shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
          >
            Start Free <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] bg-black/60 py-10 select-none text-center text-[10px] text-neutral-500 font-semibold px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            DarkFunnel 2026 • MIT License • Built with Bright Data SERP API
          </div>
          <div className="flex gap-6 font-bold text-neutral-400">
            <a href="https://brightdata.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Bright Data</a>
            <a href="https://gemini.google" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Google Gemini</a>
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Supabase</a>
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Vercel</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
