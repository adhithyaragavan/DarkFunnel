"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, Bookmark, BarChart2, Settings, Search, Loader2, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function Sidebar() {
  const pathname = usePathname();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [feedCount, setFeedCount] = useState<number | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [totalSignals, setTotalSignals] = useState<number>(0);
  const [hotSignals, setHotSignals] = useState<number>(0);
  const [lastScan, setLastScan] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/workspace/status");
      const data = await res.json();
      if (data.workspaceId) {
        setWorkspaceId(data.workspaceId);
        setFeedCount(data.feedCount);
        setSavedCount(data.savedCount);
        setUserEmail(data.userEmail || "Active Workspace");
        setTotalSignals(data.totalSignals || 0);
        setHotSignals(data.hotSignals || 0);
        if (data.lastScan) {
          setLastScan(formatDistanceToNow(new Date(data.lastScan), { addSuffix: true }));
        }
      } else {
        // Calculate mock counts for demo mode using localStorage statuses
        setUserEmail("Demo Profile");
        const localStatuses = JSON.parse(localStorage.getItem("darkfunnel_mock_statuses") || "{}");
        
        const initialMockSignals = [
          { id: "sig-1", status: "new", intent: "Hot" },
          { id: "sig-2", status: "new", intent: "Hot" },
          { id: "sig-3", status: "saved", intent: "Warm" },
          { id: "sig-4", status: "new", intent: "Warm" },
          { id: "sig-5", status: "new", intent: "Cold" },
        ];
        
        let feed = 0;
        let saved = 0;
        let total = 0;
        let hot = 0;
        
        for (const s of initialMockSignals) {
          const currentStatus = localStatuses[s.id] || s.status;
          if (currentStatus === "dismissed") {
            continue;
          }
          total++;
          if (s.intent === "Hot") {
            hot++;
          }
          if (currentStatus === "saved") {
            saved++;
          } else {
            feed++;
          }
        }
        
        setFeedCount(feed);
        setSavedCount(saved);
        setTotalSignals(total);
        setHotSignals(hot);
      }
    } catch (e) {
      console.error("Failed to load workspace status", e);
    }
  };

  useEffect(() => {
    load();

    // Listen to custom window events for scan status
    const handleScanStatus = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.scanning !== undefined) {
        setScanning(customEvent.detail.scanning);
      }
      // If a scan finished, reload counts
      if (customEvent.detail?.scanning === false) {
        load();
      }
    };

    window.addEventListener("scan-status", handleScanStatus);

    return () => {
      window.removeEventListener("scan-status", handleScanStatus);
    };
  }, []);

  const triggerScan = async () => {
    if (!workspaceId || scanning) return;
    setScanning(true);
    // Notify other components (like FeedUI) in real-time!
    window.dispatchEvent(new CustomEvent("scan-status", { detail: { scanning: true } }));
    toast.info("Scan running in background", { id: "bg-scan" });
    
    try {
      const res = await fetch(`/api/scan/${workspaceId}`, { method: "POST" });
      const data = await res.json();
      
      // Notify scanning complete
      window.dispatchEvent(new CustomEvent("scan-status", { detail: { scanning: false } }));
      
      if (data.error) {
        toast.error("Scan failed — please try again");
      } else {
        toast.success("Scan complete");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch {
      window.dispatchEvent(new CustomEvent("scan-status", { detail: { scanning: false } }));
      toast.error("Scan failed — please try again");
    }
  };

  // Keyboard shortcut scan trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        activeEl.getAttribute("contenteditable") === "true"
      );
      if (isTyping) return;

      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        triggerScan();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, scanning]);

  const links = [
    { href: "/feed", label: "Signal Feed", icon: Home, count: feedCount },
    { href: "/saved", label: "Pipeline", icon: Bookmark, count: savedCount },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0f0f0f] border-r border-border flex flex-col h-screen sticky top-0 z-20">
      <div className="p-6 flex flex-col gap-2">
        <Link href="/feed" className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌑</span>
            <span className="font-bold text-xl tracking-tight text-foreground">DarkFunnel</span>
          </div>
          {userEmail && (
            <span className="text-[10px] font-mono text-muted-foreground font-semibold px-0.5 truncate max-w-[200px]">
              {userEmail}
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm font-medium",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                {link.label}
              </div>
              {link.count !== undefined && link.count !== null && link.count > 0 && (
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all",
                  isActive
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-white/5 border-border text-muted-foreground"
                )}>
                  {link.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider line separating nav from scan section */}
      <div className="mx-4 my-2 border-t border-border/60" />

      <div className="p-4 mt-auto space-y-4">
        {workspaceId ? (
          <div className="space-y-3">
            {/* X signals • Y hot stats */}
            <div className="text-[10px] font-mono text-muted-foreground font-bold flex items-center justify-center gap-1.5 select-none bg-white/5 border border-border py-1.5 px-3 rounded-md">
              <span>{totalSignals} signals</span>
              <span className="text-border/60">•</span>
              <span className="text-destructive font-bold">{hotSignals} hot</span>
            </div>

            <button
              id="tour-step-4"
              onClick={triggerScan}
              disabled={scanning}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground py-2 px-4 rounded-md font-medium text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none h-10 select-none"
            >
              {scanning ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Scan Now
                  <kbd className="text-[10px] font-bold text-primary-foreground/80 bg-white/10 px-1.5 py-0.5 rounded border border-white/10 shrink-0 ml-1 select-none pointer-events-none">S</kbd>
                </>
              )}
            </button>
          </div>
        ) : (
          <Link
            href="/onboard"
            className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-foreground py-2 px-4 rounded-md font-medium text-sm transition-all"
          >
            <Sparkles size={16} />
            Set Up Workspace
          </Link>
        )}

        <div className="text-center space-y-1">
          {lastScan && !scanning && (
            <p className="text-[10px] text-muted-foreground">
              Last scan: {lastScan}
            </p>
          )}
          {scanning && (
            <p className="text-[10px] text-primary animate-pulse font-medium">
              Live scanning in progress...
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            Powered by{" "}
            <a
              href="https://brightdata.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              Bright Data
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}
