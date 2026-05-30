"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { BellRing, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationRow {
  id: string;
  title: string;
  intent_score: number;
  intent_level: "Hot" | "Warm" | "Cold";
  created_at: string;
}

export function NotificationBell({ isDemo = false }: { isDemo?: boolean }) {
  const [open, setOpen] = useState(false);
  const [count24h, setCount24h] = useState(0);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (isDemo) {
      // Simulate notifications in demo mode using Mock Signals
      const mockRows: NotificationRow[] = [
        {
          id: "sig-1",
          title: "🔥 Buying intent detected on G2 reviews for DarkFunnel",
          intent_score: 9,
          intent_level: "Hot",
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "sig-2",
          title: "💬 Product switching mentioned on Reddit community",
          intent_score: 8,
          intent_level: "Hot",
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "sig-4",
          title: "❓ Pain point questions on Hacker News thread",
          intent_score: 7,
          intent_level: "Warm",
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "sig-5",
          title: "🌐 Evaluative comparison found on Google Search logs",
          intent_score: 5,
          intent_level: "Cold",
          created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
        }
      ];

      const lastRead = localStorage.getItem("darkfunnel_notifications_read_time");
      let count = 0;
      if (lastRead) {
        count = mockRows.filter(
          (n) =>
            new Date(n.created_at).getTime() > new Date(lastRead).getTime() &&
            Date.now() - new Date(n.created_at).getTime() < 24 * 60 * 60 * 1000
        ).length;
      } else {
        count = mockRows.filter(
          (n) => Date.now() - new Date(n.created_at).getTime() < 24 * 60 * 60 * 1000
        ).length;
      }

      setNotifications(mockRows);
      setCount24h(count);
      return;
    }

    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const lastRead = localStorage.getItem("darkfunnel_notifications_read_time");
        
        let count = data.count24h;
        if (lastRead && data.last10) {
          count = (data.last10 as NotificationRow[]).filter(
            (n) =>
              new Date(n.created_at).getTime() > new Date(lastRead).getTime() &&
              Date.now() - new Date(n.created_at).getTime() < 24 * 60 * 60 * 1000
          ).length;
        }

        setNotifications(data.last10 || []);
        setCount24h(count);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    }
  }, [isDemo]);

  useEffect(() => {
    fetchNotifications();

    // Listen to custom scan status completed event to refresh
    const handleScanStatus = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.scanning === false) {
        fetchNotifications();
      }
    };

    window.addEventListener("scan-status", handleScanStatus);
    return () => window.removeEventListener("scan-status", handleScanStatus);
  }, [isDemo, fetchNotifications]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const handleBellClick = () => {
    setOpen(!open);
    // Reset badge to 0 immediately upon opening
    setCount24h(0);
    localStorage.setItem("darkfunnel_notifications_read_time", new Date().toISOString());
  };

  const handleMarkAllRead = () => {
    setCount24h(0);
    localStorage.setItem("darkfunnel_notifications_read_time", new Date().toISOString());
    setOpen(false);
  };

  const handleRowClick = (signalId: string) => {
    setOpen(false);
    // Navigate to signal feed and highlight
    const el = document.getElementById(`signal-${signalId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-[#6366f1]");
      setTimeout(() => el.classList.remove("ring-2", "ring-[#6366f1]"), 2000);
    } else {
      // Fallback: reload feed page with hash
      window.location.href = `/feed#signal-${signalId}`;
    }
  };

  const colors = {
    Hot: "bg-destructive text-destructive-foreground",
    Warm: "bg-amber-500 text-white",
    Cold: "bg-green-500 text-white",
  };

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-full border border-border bg-card hover:bg-card-hover text-muted-foreground hover:text-foreground transition-all duration-200 outline-none focus:ring-1 focus:ring-primary"
      >
        <BellRing size={16} className={count24h > 0 ? "animate-bounce text-[#818cf8]" : ""} />
        {count24h > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white leading-none border border-black animate-pulse">
            {count24h}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-[#0f0f0f] border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white/5">
            <span className="text-xs font-bold text-foreground">Recent Signals</span>
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <Check size={12} /> Mark all read
            </button>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <span className="text-xl block mb-2">📡</span>
                No buying signals detected yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleRowClick(n.id)}
                  className="px-4 py-3 border-b border-border/40 hover:bg-white/5 transition-all duration-150 cursor-pointer flex gap-3 items-start"
                >
                  <span className={`${colors[n.intent_level]} text-[9px] font-bold px-1.5 py-0.5 rounded leading-none shrink-0 font-mono mt-0.5`}>
                    {n.intent_score}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate hover:text-primary transition-colors">
                      {n.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground/75 font-mono">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
