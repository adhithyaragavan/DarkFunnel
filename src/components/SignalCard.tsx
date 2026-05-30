"use client";

import { useEffect, useState } from "react";
import { Signal } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Bookmark, X, MessageSquare, HelpCircle, Activity, ArrowRightLeft, ChevronDown, ChevronUp, Share2, FileText, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function IntentBadge({ level, score }: { level: Signal["intent_level"]; score: number }) {
  const colors = {
    Hot: "bg-destructive text-destructive-foreground hover:bg-destructive",
    Warm: "bg-amber-500 text-white hover:bg-amber-500",
    Cold: "bg-green-500 text-white hover:bg-green-500",
  };

  return (
    <Badge className={`${colors[level]} px-4 py-1.5 text-lg font-bold shadow-none shrink-0 rounded-md`}>
      <span className="font-mono mr-1.5">{score}/10</span> {level}
    </Badge>
  );
}

export function SourceIcon({ source }: { source: Signal["source_type"] }) {
  const mapping: Record<string, string> = {
    reddit: "Reddit",
    hackernews: "Hacker News",
    g2: "G2",
    linkedin: "LinkedIn",
    web: "Web",
  };

  const favicons: Record<string, string> = {
    reddit: "https://www.google.com/s2/favicons?domain=reddit.com&sz=32",
    hackernews: "https://www.google.com/s2/favicons?domain=news.ycombinator.com&sz=32",
    g2: "https://www.google.com/s2/favicons?domain=g2.com&sz=32",
    linkedin: "https://www.google.com/s2/favicons?domain=linkedin.com&sz=32",
    web: "https://www.google.com/s2/favicons?domain=google.com&sz=32",
  };

  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-white/5 px-2.5 py-1 rounded-md shrink-0 select-none">
      {favicons[source] && (
        <img 
          src={favicons[source]} 
          alt={mapping[source]} 
          className="w-3.5 h-3.5 object-contain rounded-sm"
        />
      )}
      {mapping[source]}
    </div>
  );
}

export function SignalTypeTag({ type }: { type: Signal["signal_type"] }) {
  const icons = {
    complaint: <MessageSquare size={14} className="text-destructive" />,
    question: <HelpCircle size={14} className="text-amber-500" />,
    evaluation: <Activity size={14} className="text-primary" />,
    switching: <ArrowRightLeft size={14} className="text-green-500" />,
    none: null,
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border px-2 py-1 rounded-full uppercase tracking-wider font-semibold shrink-0 select-none">
      {icons[type]}
      {type}
    </div>
  );
}

export function SignalCard({
  signal,
  onSave,
  onDismiss,
  id,
  onUpdate,
}: {
  signal: Signal;
  onSave: () => void;
  onDismiss: () => void;
  id?: string;
  onUpdate?: (updated: Signal) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteText, setNoteText] = useState(signal.notes || "");

  // Sync notes text state on signal data reload
  useEffect(() => {
    setNoteText(signal.notes || "");
  }, [signal.notes]);

  const intentStyles = {
    Hot: "shadow-[inset_4px_0_0_#ef4444,0_0_20px_rgba(239,68,68,0.05)] hover:shadow-[inset_4px_0_0_#ef4444,0_0_25px_rgba(239,68,68,0.08)]",
    Warm: "shadow-[inset_4px_0_0_#f59e0b] hover:shadow-[inset_4px_0_0_#f59e0b,0_0_15px_rgba(245,158,11,0.03)]",
    Cold: "shadow-[inset_4px_0_0_#22c55e] hover:shadow-[inset_4px_0_0_#22c55e,0_0_15px_rgba(34,197,94,0.03)]",
  };

  // Pulse "NEW" badge for signals found in last 60 minutes
  const isNew = new Date().getTime() - new Date(signal.scraped_at || signal.created_at).getTime() < 60 * 60 * 1000;

  // 3. SIGNAL AGE WARNING: stale if older than 7 days
  const isStale = new Date().getTime() - new Date(signal.created_at).getTime() > 7 * 24 * 60 * 60 * 1000;

  // Extract hostname preview safely
  let domain = "";
  try {
    domain = new URL(signal.source_url).hostname;
    if (domain.startsWith("www.")) {
      domain = domain.substring(4);
    }
  } catch {
    domain = signal.source_url;
  }

  // 2. SHARE SIGNAL
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const levelPrefix = signal.intent_level === "Hot" ? "🔴 Hot Signal" : signal.intent_level === "Warm" ? "🟡 Warm Signal" : "🟢 Cold Signal";
    const shareText = `${levelPrefix} via DarkFunnel
${signal.title}
${signal.summary}
→ ${signal.recommended_action}
Source: ${signal.source_url}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        toast.success("Copied to clipboard");
      }).catch(() => {
        toast.error("Clipboard permission denied");
      });
    } else {
      toast.error("Clipboard copy not supported by browser");
    }
  };

  // 4. RESCAN INDIVIDUAL SIGNAL
  const handleRescan = async () => {
    if (isRescanning) return;
    setIsRescanning(true);
    toast.info("Rescanning signal URL...");

    // Fallback simulation for demo/mock profile mode
    const isMockId = signal.id.startsWith("sig-") || !signal.id.includes("-");
    if (isMockId) {
      setTimeout(() => {
        setIsRescanning(false);
        const randomScore = Math.min(10, Math.max(1, signal.intent_score + (Math.random() > 0.5 ? 1 : -1)));
        const randomLevel: "Hot" | "Warm" | "Cold" = randomScore >= 8 ? "Hot" : randomScore >= 5 ? "Warm" : "Cold";
        
        const updated = {
          ...signal,
          intent_score: randomScore,
          intent_level: randomLevel,
          scraped_at: new Date().toISOString()
        };

        if (onUpdate) onUpdate(updated);
        // Fire scan-status event to refresh stats everywhere
        window.dispatchEvent(new CustomEvent("scan-status", { detail: { scanning: false } }));
        toast.success("Signal refreshed");
      }, 1200);
      return;
    }

    try {
      const res = await fetch(`/api/signal/${signal.id}/rescan`, {
        method: "POST"
      });
      if (res.ok) {
        const updated = await res.json();
        if (onUpdate) onUpdate(updated);
        // Fire scan-status event to refresh stats everywhere
        window.dispatchEvent(new CustomEvent("scan-status", { detail: { scanning: false } }));
        toast.success("Signal refreshed");
      } else {
        toast.error("Failed to refresh signal");
      }
    } catch (err) {
      console.error("Rescan failed:", err);
      toast.error("Failed to refresh signal");
    } finally {
      setIsRescanning(false);
    }
  };

  // 5. SIGNAL NOTES IN FEED - Auto save note on blur
  const handleSaveNote = async () => {
    if (noteText === (signal.notes || "")) return;

    const isMockId = signal.id.startsWith("sig-") || !signal.id.includes("-");
    if (isMockId) {
      const updated = {
        ...signal,
        notes: noteText
      };
      if (onUpdate) onUpdate(updated);
      
      const mockNotes = JSON.parse(localStorage.getItem("darkfunnel_mock_notes") || "{}");
      mockNotes[signal.id] = noteText;
      localStorage.setItem("darkfunnel_mock_notes", JSON.stringify(mockNotes));
      
      toast.success("Note saved");
      return;
    }

    try {
      const res = await fetch(`/api/signal/${signal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText })
      });
      if (res.ok) {
        const updated = await res.json();
        if (onUpdate) onUpdate(updated);
        toast.success("Note saved");
      } else {
        toast.error("Failed to save note");
      }
    } catch (err) {
      console.error("Failed to save note:", err);
      toast.error("Failed to save note");
    }
  };

  return (
    <div
      id={id || `signal-${signal.id}`}
      onClick={() => setExpanded(!expanded)}
      className={`bg-card border border-border p-5 rounded-lg transition-all hover:bg-card-hover cursor-pointer select-none group relative overflow-hidden ${
        intentStyles[signal.intent_level]
      }`}
    >
      {/* Background glow for Hot signals */}
      {signal.intent_level === "Hot" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full blur-3xl pointer-events-none" />
      )}

      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <IntentBadge level={signal.intent_level} score={signal.intent_score} />
          <SourceIcon source={signal.source_type} />
          <SignalTypeTag type={signal.signal_type} />
          
          {/* pulsing New alert */}
          {isNew && (
            <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-bold px-2 py-0.5 animate-pulse uppercase tracking-wider gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              New Lead
            </Badge>
          )}

          {/* Stale Alert Warning */}
          {isStale && (
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 animate-pulse uppercase tracking-wider gap-1 select-none font-sans">
              ⚠️ 7 days old — stale
            </Badge>
          )}
        </div>

        {/* Dynamic header time, refresh, and notes buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs text-muted-foreground font-mono font-medium">
            {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
          </div>
          
          {/* Rescan Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRescan();
            }}
            disabled={isRescanning}
            className="text-muted-foreground hover:text-primary transition-all p-1 rounded hover:bg-white/5 disabled:opacity-50"
            title="Rescan individual signal"
          >
            <RefreshCw size={13} className={isRescanning ? "animate-spin text-primary" : ""} />
          </button>

          {/* Notes Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNoteEditor(!showNoteEditor);
            }}
            className={`text-muted-foreground hover:text-primary transition-all p-1 rounded hover:bg-white/5 ${showNoteEditor ? "text-primary bg-white/5" : ""}`}
            title="Edit inline notes"
          >
            <FileText size={13} />
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold leading-snug text-foreground group-hover:text-primary transition-colors flex justify-between items-start gap-2">
        <span>{signal.title}</span>
        <button className="text-muted-foreground hover:text-foreground shrink-0 pt-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </h3>

      <div className="text-xs text-muted-foreground/75 font-mono mb-2 truncate">
        {domain}
      </div>
      
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
        {signal.summary}
      </p>

      {/* Recommended sales action */}
      <div className="bg-primary/[0.08] border border-primary/25 rounded-md p-3.5 mb-4">
        <div className="text-[10px] font-bold tracking-widest text-primary uppercase mb-1 font-mono">
          RECOMMENDED ACTION
        </div>
        <p className="text-sm font-semibold text-white flex items-center gap-2 leading-relaxed">
          <span className="text-primary text-base font-bold">→</span> {signal.recommended_action}
        </p>
      </div>

      {/* Note Editor Area */}
      {showNoteEditor && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="mt-3 p-3 bg-[#141414] border border-border rounded-lg space-y-2 animate-in fade-in slide-in-from-top-1 duration-150 cursor-default"
        >
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={handleSaveNote}
            placeholder="Type outreach notes here (auto-saves on focus loss)..."
            className="w-full bg-[#080808] border border-border rounded p-2 text-xs outline-none focus:border-primary text-foreground min-h-[60px] resize-y"
          />
          <div className="text-[10px] text-muted-foreground text-right font-mono select-none">
            Auto-saves on focus loss
          </div>
        </div>
      )}

      {/* Active Note Preview */}
      {signal.notes && !showNoteEditor && (
        <div className="mt-3 p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-md flex gap-2 items-start text-xs text-amber-300 select-text">
          <span className="select-none mt-0.5">📝</span>
          <p className="flex-1 leading-normal italic font-medium">
            &ldquo;{signal.notes}&rdquo;
          </p>
        </div>
      )}

      {/* Collapsible details section */}
      {expanded && (
        <div
          onClick={(e) => e.stopPropagation()} // Stop event bubbling so clicks on details won't collapse the card!
          className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 cursor-default"
        >
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
              🔥 Full AI Analysis & Reasoning
            </h4>
            <p className="text-sm text-foreground bg-white/5 p-3 rounded-lg border border-border leading-relaxed">
              {signal.summary}
            </p>
          </div>

          {signal.raw_content && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                💬 Original Raw Content Snippet
              </h4>
              <p className="text-xs font-mono text-muted-foreground bg-black/40 p-3 rounded-lg border border-border max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed scrollbar-thin">
                {signal.raw_content}
              </p>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              🌐 Source URL Preview
            </h4>
            <div className="text-xs font-mono text-muted-foreground bg-white/5 p-3 rounded-lg border border-border flex items-center justify-between gap-4 overflow-hidden">
              <span className="truncate flex-1">{signal.source_url}</span>
              <div className="flex items-center gap-2 shrink-0">
                {/* Share Signal Action Button */}
                <button
                  onClick={handleShare}
                  className="text-primary hover:underline font-semibold flex items-center gap-1 bg-[#6366f1]/10 px-2.5 py-1 rounded border border-[#6366f1]/20 hover:bg-[#6366f1]/20 transition-all text-xs"
                >
                  <Share2 size={12} /> Share Signal
                </button>
                <a
                  href={signal.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-semibold"
                >
                  Visit Origin Site
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom info & actions bar */}
      <div
        onClick={(e) => e.stopPropagation()} // Stop bubble so buttons won't trigger expand
        className="flex items-center justify-between mt-4 pt-4 border-t border-border"
      >
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {signal.person_name && (
            <Badge variant="secondary" className="bg-white/5 text-muted-foreground border border-border/40 hover:bg-white/5 px-2.5 py-0.5 font-medium rounded-full">
              <span className="mr-1 select-none text-[11px]">👤</span> {signal.person_name}
            </Badge>
          )}
          {signal.company_name && (
            <Badge variant="secondary" className="bg-white/5 text-muted-foreground border border-border/40 hover:bg-white/5 px-2.5 py-0.5 font-medium rounded-full">
              <span className="mr-1 select-none text-[11px]">🏢</span> {signal.company_name}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a 
            href={signal.source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-transparent text-xs font-medium whitespace-nowrap transition-all outline-none hover:bg-white/5 h-8 gap-1.5 px-3 text-muted-foreground hover:text-foreground"
          >
            <ExternalLink size={13} /> Open Link
          </a>
          
          {signal.status !== "saved" && (
            <Button
              size="sm"
              onClick={onSave}
              className="h-8 text-xs font-semibold bg-[#6366f1] text-white hover:bg-[#4f46e5] border-transparent"
            >
              <Bookmark size={13} className="mr-1.5" /> Save
            </Button>
          )}

          {signal.status === "saved" && (
            <Badge variant="secondary" className="bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/20 text-xs py-1 h-8">
              Saved Lead
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-all shrink-0"
          >
            <X size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
