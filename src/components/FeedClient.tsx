"use client";

import { useEffect, useState } from "react";
import { Filter, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignalCard } from "@/components/SignalCard";
import { Signal } from "@/types";
import { toast } from "sonner";

const crawlers = [
  "Crawling Reddit...",
  "Querying Hacker News...",
  "Scanning G2 Review Boards...",
  "Scraping LinkedIn...",
  "Scanning Google Web Data..."
];

export function FeedClient({
  initialSignals,
  workspaceId,
  isDemo = false,
}: {
  initialSignals: Signal[];
  workspaceId: string | null;
  isDemo?: boolean;
}) {
  const [signals, setSignals] = useState<Signal[]>(initialSignals);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Scanner status rotating states
  const [crawlerIndex, setCrawlerIndex] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);

  // Onboarding Tooltip Tour
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  // Browser Push Notification Permission modal state
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    // 7. Trigger onboarding tour on first visit
    const completed = localStorage.getItem("darkfunnel_tour_completed");
    if (!completed && !isDemo) {
      const t = setTimeout(() => setTourStep(1), 1500);
      return () => clearTimeout(t);
    }
  }, [isDemo]);

  useEffect(() => {
    // 3. Custom Browser Push modal permission trigger on first visit
    if (typeof window !== "undefined" && !isDemo) {
      const dismissed = localStorage.getItem("darkfunnel_push_tour_dismissed");
      if (!dismissed && Notification.permission === "default") {
        const t = setTimeout(() => setShowPermissionModal(true), 4000);
        return () => clearTimeout(t);
      }
    }
  }, [isDemo]);

  // Request browser notifications permission
  const requestNotificationPermission = () => {
    setShowPermissionModal(false);
    localStorage.setItem("darkfunnel_push_tour_dismissed", "true");
    
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("🔴 DarkFunnel Alert", {
            body: "Push alerts successfully enabled! You will be notified when hot signals are found.",
            icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌑</text></svg>"
          });
          toast.success("Push alerts enabled!");
        } else {
          toast.error("Push alerts blocked. Enable in settings.");
        }
      });
    }
  };

  const handleExport = () => {
    if (!signals || signals.length === 0) {
      toast.error("No signals available to export");
      return;
    }

    const headers = [
      "Date",
      "Source",
      "Intent Score",
      "Intent Level",
      "Signal Type",
      "Title",
      "Summary",
      "Recommended Action",
      "Person",
      "Company",
      "URL"
    ];

    const escapeCsv = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return "";
      const s = String(str).replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };

    const rows = signals.map((s) => [
      escapeCsv(s.created_at || s.scraped_at),
      escapeCsv(s.source_type),
      escapeCsv(s.intent_score),
      escapeCsv(s.intent_level),
      escapeCsv(s.signal_type),
      escapeCsv(s.title),
      escapeCsv(s.summary),
      escapeCsv(s.recommended_action),
      escapeCsv(s.person_name || ""),
      escapeCsv(s.company_name || ""),
      escapeCsv(s.source_url)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `darkfunnel_signals_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("✅ CSV exported successfully");
  };

  // Tooltip dynamic alignment listeners
  useEffect(() => {
    if (tourStep === null) return;
    const el = document.getElementById(`tour-step-${tourStep}`);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    const updatePosition = () => {
      const rect = el.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      let style: React.CSSProperties = {};
      if (tourStep === 1) {
        // Below search / header area
        style = {
          top: `${rect.bottom + scrollTop + 10}px`,
          left: `${rect.left + scrollLeft}px`,
        };
      } else if (tourStep === 2) {
        // Below Hot pill
        style = {
          top: `${rect.bottom + scrollTop + 10}px`,
          left: `${rect.left + scrollLeft}px`,
        };
      } else if (tourStep === 3) {
        // Next to the first card
        style = {
          top: `${rect.top + scrollTop + 20}px`,
          left: `${rect.left + scrollLeft + 40}px`,
        };
      } else if (tourStep === 4) {
        // Next to Sidebar scan button
        style = {
          top: `${rect.top + scrollTop - 10}px`,
          left: `${rect.right + scrollLeft + 15}px`,
        };
      }
      setTooltipStyle(style);
    };

    const timer = setTimeout(updatePosition, 300);
    window.addEventListener("resize", updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
    };
  }, [tourStep]);

  useEffect(() => {
    if (scanning) {
      setScanProgress(0);
      setCrawlerIndex(0);

      const crawlerInterval = setInterval(() => {
        setCrawlerIndex((prev) => (prev + 1) % crawlers.length);
      }, 2000);

      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 1.5;
        });
      }, 150);

      return () => {
        clearInterval(crawlerInterval);
        clearInterval(progressInterval);
      };
    } else {
      setScanProgress(0);
    }
  }, [scanning]);

  // Synchronize signals with localStorage statuses in demo mode
  useEffect(() => {
    if (isDemo) {
      const localStatuses = JSON.parse(localStorage.getItem("darkfunnel_mock_statuses") || "{}");
      const localNotes = JSON.parse(localStorage.getItem("darkfunnel_mock_notes") || "{}");
      setSignals((curr) => {
        return curr
          .map((s) => {
            const status = localStatuses[s.id] || s.status;
            const notes = localNotes[s.id] || s.notes;
            return { ...s, status, notes };
          })
          .filter((s) => s.status !== "dismissed");
      });
    }
  }, [isDemo]);

  // Filters state
  const [activeIntent, setActiveIntent] = useState<"All" | "Hot" | "Warm" | "Cold">("All");
  const [activeSource, setActiveSource] = useState("All Sources");
  const [activeType, setActiveType] = useState("All Types");

  // Sync scanning status and handle real-time streaming
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const handleScanStatus = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.scanning !== undefined) {
        const isScanning = customEvent.detail.scanning;
        setScanning(isScanning);

        if (isScanning) {
          setLastResult(null);
          // Start polling for new signals in real-time every 3 seconds!
          if (workspaceId && !interval) {
            interval = setInterval(async () => {
              try {
                const res = await fetch(`/api/signals/${workspaceId}?status=new`);
                if (res.ok) {
                  const payload = await res.json();
                  const freshSignals = payload.data as Signal[];
                  if (freshSignals && freshSignals.length > 0) {
                    setSignals((curr) => {
                      const existingIds = new Set(curr.map((s) => s.id));
                      const newAdded = freshSignals.filter((s) => !existingIds.has(s.id));
                      if (newAdded.length > 0) {
                        // 3. Trigger browser notifications if hot signals exist
                        const hotList = newAdded.filter(s => s.intent_level === "Hot");
                        if (hotList.length > 0 && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                          const notification = new Notification("🔴 DarkFunnel Alert", {
                            body: `${hotList.length} hot buying signals found — ${hotList[0].title}`,
                            icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌑</text></svg>"
                          });
                          notification.onclick = () => {
                            window.focus();
                          };
                        }
                        return [...newAdded, ...curr];
                      }
                      return curr;
                    });
                  }
                }
              } catch (err) {
                console.warn("Real-time signals stream polling error:", err);
              }
            }, 3000);
          }
        } else {
          // Scanning stopped
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
          setLastResult("Scan completed! Real-time stream synced successfully.");
        }
      }
    };

    window.addEventListener("scan-status", handleScanStatus);

    return () => {
      window.removeEventListener("scan-status", handleScanStatus);
      if (interval) clearInterval(interval);
    };
  }, [workspaceId]);

  // Handle save and dismiss callbacks from child cards directly to update UI instantly!
  const handleSave = async (id: string) => {
    if (isDemo || id.startsWith("sig-")) {
      const localStatuses = JSON.parse(localStorage.getItem("darkfunnel_mock_statuses") || "{}");
      localStatuses[id] = "saved";
      localStorage.setItem("darkfunnel_mock_statuses", JSON.stringify(localStatuses));

      setSignals((curr) =>
        curr.map((s) => (s.id === id ? { ...s, status: "saved" } : s))
      );
      window.dispatchEvent(new CustomEvent("scan-status", { detail: {} }));
      toast.success("Signal saved");
      return;
    }

    try {
      const res = await fetch(`/api/signal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "saved" }),
      });
      if (res.ok) {
        setSignals((curr) =>
          curr.map((s) => (s.id === id ? { ...s, status: "saved" } : s))
        );
        // Dispatch global sidebar refresh event
        window.dispatchEvent(new CustomEvent("scan-status", { detail: {} }));
        toast.success("Signal saved");
      } else {
        toast.error("Failed to save signal");
      }
    } catch (err) {
      console.error("Failed to save signal:", err);
      toast.error("Failed to save signal");
    }
  };

  const handleUnsave = async (id: string) => {
    if (isDemo || id.startsWith("sig-")) {
      const localStatuses = JSON.parse(localStorage.getItem("darkfunnel_mock_statuses") || "{}");
      localStatuses[id] = "new";
      localStorage.setItem("darkfunnel_mock_statuses", JSON.stringify(localStatuses));

      setSignals((curr) =>
        curr.map((s) => (s.id === id ? { ...s, status: "new" } : s))
      );
      window.dispatchEvent(new CustomEvent("scan-status", { detail: {} }));
      toast.success("Signal unsaved");
      return;
    }

    try {
      const res = await fetch(`/api/signal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "new" }),
      });
      if (res.ok) {
        setSignals((curr) =>
          curr.map((s) => (s.id === id ? { ...s, status: "new" } : s))
        );
        window.dispatchEvent(new CustomEvent("scan-status", { detail: {} }));
        toast.success("Signal unsaved");
      } else {
        toast.error("Failed to unsave signal");
      }
    } catch (err) {
      console.error("Failed to unsave signal:", err);
      toast.error("Failed to unsave signal");
    }
  };

  const handleDismiss = async (id: string) => {
    if (isDemo || id.startsWith("sig-")) {
      const localStatuses = JSON.parse(localStorage.getItem("darkfunnel_mock_statuses") || "{}");
      localStatuses[id] = "dismissed";
      localStorage.setItem("darkfunnel_mock_statuses", JSON.stringify(localStatuses));

      setSignals((curr) => curr.filter((s) => s.id !== id));
      window.dispatchEvent(new CustomEvent("scan-status", { detail: {} }));
      toast.success("Signal dismissed");
      return;
    }

    try {
      const res = await fetch(`/api/signal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });
      if (res.ok) {
        // Smoothly filter out dismissed signals in real time!
        setSignals((curr) => curr.filter((s) => s.id !== id));
        // Dispatch global sidebar refresh event
        window.dispatchEvent(new CustomEvent("scan-status", { detail: {} }));
        toast.success("Signal dismissed");
      } else {
        toast.error("Failed to dismiss signal");
      }
    } catch (err) {
      console.error("Failed to dismiss signal:", err);
      toast.error("Failed to dismiss signal");
    }
  };

  // Perform multi-dimensional client-side filtering!
  const filteredSignals = signals.filter((signal) => {
    // 1. Intent Level filter
    if (activeIntent !== "All" && signal.intent_level !== activeIntent) {
      return false;
    }

    // 2. Source Type filter
    if (activeSource !== "All Sources") {
      const srcMapping: Record<string, string> = {
        Reddit: "reddit",
        "Hacker News": "hackernews",
        G2: "g2",
        LinkedIn: "linkedin",
        Web: "web",
      };
      if (signal.source_type !== srcMapping[activeSource]) {
        return false;
      }
    }

    // 3. Signal Type filter
    if (activeType !== "All Types") {
      if (signal.signal_type !== activeType.toLowerCase()) {
        return false;
      }
    }

    // 4. Text Search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const titleMatch = signal.title.toLowerCase().includes(query);
      const summaryMatch = signal.summary.toLowerCase().includes(query);
      const personMatch = signal.person_name?.toLowerCase().includes(query);
      const companyMatch = signal.company_name?.toLowerCase().includes(query);
      if (!titleMatch && !summaryMatch && !personMatch && !companyMatch) {
        return false;
      }
    }

    return true;
  });

  // Calculate dynamic filter counts
  const getCountByIntent = (intent: "All" | "Hot" | "Warm" | "Cold") => {
    if (intent === "All") return signals.length;
    return signals.filter((s) => s.intent_level === intent).length;
  };

  // Daily Brief calculations
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const count24h = signals.filter((s) => {
    const date = new Date(s.scraped_at || s.created_at);
    return new Date().getTime() - date.getTime() < 24 * 60 * 60 * 1000;
  }).length;

  const topOpportunity = [...signals]
    .sort((a, b) => b.intent_score - a.intent_score)[0];

  return (
    <div className="space-y-6">
      {/* Real-time scanning notification banner */}
      {scanning && (
        <div className="bg-gradient-to-r from-primary/10 via-[#ec4899]/10 to-primary/10 bg-[length:200%_auto] animate-gradient-slow border border-primary/20 rounded-lg p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary"></span>
              </div>
              <p className="text-sm font-medium text-foreground">
                Scanning live: <span className="text-primary font-semibold">{crawlers[crawlerIndex]}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-primary/80">
              <RefreshCcw size={12} className="animate-spin" />
              Bright Data Active Scrapers
            </div>
          </div>
          <div className="w-full bg-white/5 border border-white/10 rounded-full h-2 overflow-hidden z-10">
            <div 
              className="bg-gradient-to-r from-primary via-[#ec4899] to-primary h-full transition-all duration-300 ease-out"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {lastResult && !scanning && (
        <div className="bg-card border border-border rounded-lg p-3 text-sm text-green-400 flex items-center gap-2">
          <span>✓</span> {lastResult}
        </div>
      )}

      {/* Daily Brief Pinned Card */}
      {topOpportunity && (
        <div className="border-l-4 border-l-[#6366f1] bg-card p-5 rounded-lg mb-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#818cf8] mb-1">
              📌 Daily Brief • {todayStr}
            </div>
            <h2 className="text-lg font-semibold text-white leading-tight">
              {count24h} buyer signal{count24h === 1 ? "" : "s"} detected in the last 24 hours
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Top Opportunity: <span className="text-white font-medium hover:underline cursor-pointer" onClick={() => {
                const el = document.getElementById(`signal-${topOpportunity.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  el.classList.add("ring-2", "ring-[#6366f1]");
                  setTimeout(() => el.classList.remove("ring-2", "ring-[#6366f1]"), 2000);
                }
              }}>{topOpportunity.title}</span> (Score: <span className="text-destructive font-bold font-mono">{topOpportunity.intent_score}/10</span>)
            </p>
          </div>
          <div className="shrink-0">
            <Badge className="bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/30 px-3 py-1 font-bold text-xs uppercase tracking-wider">
              Priority Action Required
            </Badge>
          </div>
        </div>
      )}

      {/* Dynamic Filters header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-4 text-sm w-full sm:w-auto overflow-x-auto whitespace-nowrap scrollbar-none py-1">
          <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
            <Filter size={16} /> Filters:
          </span>
          <div className="flex items-center gap-2">
            {(["All", "Hot", "Warm", "Cold"] as const).map((intent) => {
              const isActive = activeIntent === intent;
              let activeClass = "";
              let inactiveClass = "";

              if (intent === "All") {
                activeClass = "bg-[#6366f1] text-white hover:bg-[#4f46e5] border-transparent";
                inactiveClass = "text-[#818cf8] border-[#6366f1]/30 bg-transparent hover:bg-[#6366f1]/10";
              } else if (intent === "Hot") {
                activeClass = "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent";
                inactiveClass = "text-destructive border-destructive/30 bg-transparent hover:bg-destructive/10";
              } else if (intent === "Warm") {
                activeClass = "bg-amber-500 text-white hover:bg-amber-600 border-transparent";
                inactiveClass = "text-amber-500 border-amber-500/30 bg-transparent hover:bg-amber-500/10";
              } else if (intent === "Cold") {
                activeClass = "bg-green-500 text-white hover:bg-green-600 border-transparent";
                inactiveClass = "text-green-500 border-green-500/30 bg-transparent hover:bg-green-500/10";
              }

              return (
                <Badge
                  key={intent}
                  id={intent === "Hot" ? "tour-step-2" : undefined}
                  variant="outline"
                  onClick={() => setActiveIntent(intent)}
                  className={`cursor-pointer transition-all active:scale-95 px-3 py-1 font-semibold text-xs border ${
                    isActive ? activeClass : inactiveClass
                  }`}
                >
                  {intent === "All" ? "All" : intent === "Hot" ? "🔴 Hot" : intent === "Warm" ? "🟡 Warm" : "🟢 Cold"}{" "}
                  ({getCountByIntent(intent)})
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Source & Type dropdown filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
          <select
            value={activeSource}
            onChange={(e) => setActiveSource(e.target.value)}
            className="bg-card border border-border rounded-md text-sm px-3 py-1.5 outline-none focus:border-primary text-foreground cursor-pointer"
          >
            <option>All Sources</option>
            <option>Reddit</option>
            <option>Hacker News</option>
            <option>G2</option>
            <option>LinkedIn</option>
            <option>Web</option>
          </select>
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value)}
            className="bg-card border border-border rounded-md text-sm px-3 py-1.5 outline-none focus:border-primary text-foreground cursor-pointer"
          >
            <option>All Types</option>
            <option>Complaint</option>
            <option>Question</option>
            <option>Evaluation</option>
            <option>Switching</option>
          </select>
        </div>
      </div>

      {/* Interactive Search Bar & CSV Export Button */}
      <div className="flex gap-3 w-full">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search signals by title, keywords, companies, or summary..."
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] text-foreground transition-all font-sans"
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none select-none text-xs">
            🔍
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-medium"
            >
              Clear
            </button>
          )}
        </div>
        <Button
          onClick={handleExport}
          className="shrink-0 bg-[#0f0f0f] border border-border text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all text-xs font-semibold px-4 h-10 gap-1.5"
        >
          📥 Export CSV
        </Button>
      </div>

      {/* Signals Feed rendering */}
      <div id="tour-step-1" className="space-y-4">
        {filteredSignals.map((signal, index) => (
          <SignalCard
            key={signal.id}
            id={index === 0 ? "tour-step-3" : undefined}
            signal={signal}
            onSave={() => handleSave(signal.id)}
            onUnsave={() => handleUnsave(signal.id)}
            onDismiss={() => handleDismiss(signal.id)}
            onUpdate={(updated) => {
              setSignals(curr => curr.map(s => s.id === updated.id ? updated : s));
            }}
          />
        ))}
      </div>

      {filteredSignals.length > 0 && (
        <div className="h-24 bg-gradient-to-t from-background to-transparent border-t border-border/10 flex items-center justify-center text-xs text-muted-foreground font-mono select-none pointer-events-none mt-4">
          <span className="animate-pulse">↓ End of Lead Feed — Searching for more signals...</span>
        </div>
      )}

      {filteredSignals.length === 0 && (
        <div className="text-center py-20 border border-dashed border-border rounded-lg bg-black/10">
          <div className="text-5xl mb-4 opacity-50">🔍</div>
          <h3 className="text-lg font-semibold mb-1">No matching signals found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Try adjusting your filters or search terms, or click &quot;Scan Now&quot; in the sidebar to search for new buyer leads.
          </p>
        </div>
      )}

      {/* Custom Browser Notification Permission Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-border rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-center select-none">
            <div className="text-4xl">🔔</div>
            <h3 className="text-xl font-bold text-foreground">Get instant alerts when hot signals are found</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enable push notifications to receive immediate alerts in your browser when high-urgency, hot B2B buying signals are scraped.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button 
                onClick={requestNotificationPermission}
                className="w-full bg-[#6366f1] text-white hover:bg-[#4f46e5]"
              >
                Enable Notifications
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowPermissionModal(false);
                  localStorage.setItem("darkfunnel_push_tour_dismissed", "true");
                }}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Not Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tooltip Tour overlay */}
      {tourStep !== null && (
        <div className="absolute z-50 bg-[#0f0f0f] border border-[#6366f1] p-5 rounded-lg shadow-2xl max-w-xs space-y-3 transition-all duration-300 pointer-events-auto select-none" style={tooltipStyle}>
          <div className="flex justify-between items-start gap-4">
            <span className="text-[10px] font-mono font-bold text-[#818cf8] uppercase tracking-wider">Tour Step {tourStep} of 4</span>
            <button 
              onClick={() => {
                setTourStep(null);
                localStorage.setItem("darkfunnel_tour_completed", "true");
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground font-semibold uppercase tracking-wider underline"
            >
              Skip tour
            </button>
          </div>
          <p className="text-xs font-semibold text-white leading-relaxed">
            {tourStep === 1 && "Your buying signals appear here. Check back often for new prospect leads."}
            {tourStep === 2 && "Filter by urgency level. Focus on Hot signals for immediate high-intent buyers."}
            {tourStep === 3 && "Click to expand full AI analysis. View original snippets, AI reasoning, and direct links."}
            {tourStep === 4 && "Scans run automatically every 6 hours. You can also trigger a manual scan here anytime."}
          </p>
          <div className="flex justify-between items-center pt-2 gap-4">
            <button 
              onClick={() => {
                setTourStep(null);
                localStorage.setItem("darkfunnel_tour_completed", "true");
              }}
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Dismiss
            </button>
            <Button 
              size="sm" 
              onClick={() => {
                if (tourStep < 4) {
                  setTourStep(tourStep + 1);
                } else {
                  setTourStep(null);
                  localStorage.setItem("darkfunnel_tour_completed", "true");
                  toast.success("🎉 Dashboard tour complete! You are ready to close buyers.");
                }
              }}
              className="h-7 text-xs font-semibold bg-[#6366f1] text-white hover:bg-[#4f46e5]"
            >
              {tourStep === 4 ? "Finish" : "Next →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
