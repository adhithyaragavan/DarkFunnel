"use client";

import { useEffect, useState } from "react";
import { IntentBadge, SourceIcon } from "@/components/SignalCard";
import { Signal } from "@/types";
import { MOCK_SIGNALS } from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";
import { Plus, User, Building, MessageSquare, Clipboard, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type KanbanStatus = "saved" | "contacted" | "responded" | "converted";

const COLUMNS: { id: KanbanStatus; label: string; accent: string; bg: string; placeholder: string }[] = [
  { 
    id: "saved", 
    label: "Saved Leads", 
    accent: "border-t-primary", 
    bg: "bg-primary/5",
    placeholder: "Leads saved from signal feed appear here."
  },
  { 
    id: "contacted", 
    label: "Contacted", 
    accent: "border-t-amber-500", 
    bg: "bg-amber-500/5",
    placeholder: "Drag here once initial outreach is sent."
  },
  { 
    id: "responded", 
    label: "Responded", 
    accent: "border-t-indigo-500", 
    bg: "bg-indigo-500/5",
    placeholder: "Drag here when lead replies back."
  },
  { 
    id: "converted", 
    label: "Converted", 
    accent: "border-t-green-500", 
    bg: "bg-green-500/5",
    placeholder: "Drag here to close as won B2B deal!"
  },
];

export function SavedClient({ initialSignals }: { initialSignals: Signal[] }) {
  const [signals, setSignals] = useState<Signal[]>(initialSignals);
  const [isDemo, setIsDemo] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Converted Deal Value Modal states
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertingSignalId, setConvertingSignalId] = useState<string | null>(null);
  const [dealValueInput, setDealValueInput] = useState("");

  useEffect(() => {
    // Determine if we are in demo mode
    if (initialSignals.length === 0) {
      setIsDemo(true);
      const localStatuses = JSON.parse(localStorage.getItem("darkfunnel_mock_statuses") || "{}");
      const localNotes = JSON.parse(localStorage.getItem("darkfunnel_mock_notes") || "{}");
      
      const mockSaved = MOCK_SIGNALS.map((s) => {
        const status = localStatuses[s.id] || s.status;
        const notes = localNotes[s.id] || s.notes || "";
        return { ...s, status: status as Signal["status"], notes };
      }).filter((s) => ["saved", "contacted", "responded", "converted"].includes(s.status));
      
      setSignals(mockSaved);
    } else {
      setIsDemo(false);
    }
  }, [initialSignals]);

  // Handle Drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Drag Start
  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  // Handle Drop
  const handleDrop = async (columnStatus: KanbanStatus) => {
    if (!draggedId) return;
    const currentId = draggedId;
    setDraggedId(null);

    if (columnStatus === "converted") {
      setConvertingSignalId(currentId);
      setDealValueInput("");
      setShowConvertModal(true);
      return;
    }

    executeStatusUpdate(currentId, columnStatus);
  };

  const executeStatusUpdate = async (signalId: string, status: KanbanStatus, dealValue?: number) => {
    // Dynamic UI Update
    setSignals((curr) =>
      curr.map((s) => (s.id === signalId ? { ...s, status } : s))
    );

    toast.success(`Moved lead to ${status.toUpperCase()}`);

    if (isDemo || signalId.startsWith("sig-")) {
      // Mock local storage update
      const localStatuses = JSON.parse(localStorage.getItem("darkfunnel_mock_statuses") || "{}");
      localStatuses[signalId] = status;
      localStorage.setItem("darkfunnel_mock_statuses", JSON.stringify(localStatuses));

      if (dealValue !== undefined) {
        const localDeals = JSON.parse(localStorage.getItem("darkfunnel_mock_deals") || "{}");
        localDeals[signalId] = dealValue;
        localStorage.setItem("darkfunnel_mock_deals", JSON.stringify(localDeals));
      }
      
      window.dispatchEvent(new CustomEvent("scan-status", { detail: {} }));
      return;
    }

    try {
      const res = await fetch(`/api/signal/${signalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, deal_value: dealValue }),
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("scan-status", { detail: {} }));
      } else {
        toast.error("Failed to update status in database");
      }
    } catch {
      toast.error("Status update request failed");
    }
  };

  // Update Notes
  const handleNotesUpdate = async (id: string, notesText: string) => {
    setSignals((curr) =>
      curr.map((s) => (s.id === id ? { ...s, notes: notesText } : s))
    );

    if (isDemo || id.startsWith("sig-")) {
      const localNotes = JSON.parse(localStorage.getItem("darkfunnel_mock_notes") || "{}");
      localNotes[id] = notesText;
      localStorage.setItem("darkfunnel_mock_notes", JSON.stringify(localNotes));
      toast.success("Notes saved locally");
      return;
    }

    try {
      const res = await fetch(`/api/signal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText }),
      });
      if (res.ok) {
        toast.success("Lead notes updated successfully");
      } else {
        toast.error("Failed to save notes");
      }
    } catch {
      toast.error("Notes update request failed");
    }
  };

  const totalLeads = signals.length;
  const convertedCount = signals.filter((s) => s.status === "converted").length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Dynamic Conversion Performance Metric Banner */}
      <div className="bg-white/[0.02] border border-border rounded-xl p-4 flex items-center justify-between mb-6 select-none relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div>
          <h2 className="text-base font-bold text-foreground">Pipeline Conversion Performance</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Won B2B deals relative to total active prospect pipelines.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold text-primary animate-pulse">{conversionRate}%</div>
          <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Conversion Rate</div>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full items-start">
        {COLUMNS.map((col) => {
          const colSignals = signals.filter((s) => s.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
              className={`rounded-xl border border-border/80 flex flex-col min-h-[600px] pb-6 relative transition-all ${col.bg}`}
            >
              {/* Column Header with Top accent border */}
              <div className={`p-4 border-t-2 ${col.accent} bg-black/40 rounded-t-xl flex justify-between items-center border-b border-border/40 select-none`}>
                <span className="font-bold text-sm text-foreground">{col.label}</span>
                <span className="text-[10px] font-mono bg-white/5 border border-border px-2 py-0.5 rounded-full text-muted-foreground">
                  {colSignals.length}
                </span>
              </div>

              {/* Card List */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[520px] scrollbar-thin">
                {colSignals.map((signal) => (
                  <KanbanCard
                    key={signal.id}
                    signal={signal}
                    onDragStart={() => handleDragStart(signal.id)}
                    onNotesSave={(notes) => handleNotesUpdate(signal.id, notes)}
                  />
                ))}

                {colSignals.length === 0 && (
                  <div className="text-center py-16 px-4 border border-dashed border-border/40 rounded-lg flex flex-col justify-center items-center select-none h-full">
                    <Clipboard className="text-muted-foreground/30 w-8 h-8 mb-2" />
                    <p className="text-[10px] text-muted-foreground/80 leading-normal max-w-[140px] mx-auto">
                      {col.placeholder}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Converted Deal Value Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0f0f0f] border border-border rounded-xl p-6 max-w-sm w-full space-y-5 shadow-2xl relative select-none">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">🎉 Convert Lead</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                What was the closed B2B deal value? Enter the numerical amount below (optional).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Deal Value ($ USD)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={dealValueInput}
                onChange={(e) => setDealValueInput(e.target.value)}
                className="w-full bg-[#080808] border border-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary text-foreground font-semibold font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowConvertModal(false);
                  setConvertingSignalId(null);
                }}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (convertingSignalId) {
                    const val = Number(dealValueInput) || 0;
                    executeStatusUpdate(convertingSignalId, "converted", val);
                  }
                  setShowConvertModal(false);
                  setConvertingSignalId(null);
                }}
                className="bg-green-500 hover:bg-green-600 text-white text-xs h-8 font-bold px-4 border-transparent"
              >
                Close Deal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KanbanCard({
  signal,
  onDragStart,
  onNotesSave,
}: {
  signal: Signal;
  onDragStart: () => void;
  onNotesSave: (notes: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [notesText, setNotesText] = useState(signal.notes || "");

  const handleBlur = () => {
    setIsEditing(false);
    onNotesSave(notesText);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-card border border-border p-4 rounded-lg hover:border-primary/40 hover:bg-card-hover transition-all cursor-grab active:cursor-grabbing select-none relative group overflow-hidden"
    >
      <div className="flex items-center justify-between mb-2">
        <IntentBadge level={signal.intent_level} score={signal.intent_score} />
        <SourceIcon source={signal.source_type} />
      </div>

      <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
        {signal.title}
      </h4>

      {/* Info details */}
      <div className="space-y-1 mb-3 text-[10px] text-muted-foreground font-semibold">
        {signal.company_name && (
          <div className="flex items-center gap-1">
            <Building size={12} className="text-primary shrink-0" />
            <span className="truncate">{signal.company_name}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <User size={12} className="text-primary shrink-0" />
          <span>{signal.person_name || "Anonymous Lead"}</span>
        </div>
        <div className="text-[9px] text-muted-foreground font-mono">
          Saved {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
        </div>
      </div>

      {/* Inline Notes Editor */}
      <div className="pt-2.5 border-t border-border/60">
        <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-primary mb-1">
          <MessageSquare size={10} />
          <span>Outreach Notes</span>
        </div>
        {isEditing ? (
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            placeholder="Type notes and click outside to save..."
            className="w-full text-[10px] font-mono bg-black/40 border border-border p-2 rounded outline-none focus:border-primary text-foreground leading-normal"
            rows={2}
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="text-[10px] text-muted-foreground bg-white/5 border border-border/40 p-2 rounded hover:bg-white/10 transition-colors cursor-pointer min-h-[34px] flex items-center justify-between gap-2"
          >
            <span className="truncate flex-1 font-medium">{notesText || "Click to add notes..."}</span>
            <Plus size={10} className="opacity-40 shrink-0" />
          </div>
        )}
      </div>
      
      {/* Open link indicator */}
      <a 
        href={signal.source_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white/5 border border-border rounded hover:bg-white/10"
      >
        <ArrowRight size={10} className="text-muted-foreground" />
      </a>
    </div>
  );
}
