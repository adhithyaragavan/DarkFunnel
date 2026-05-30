"use client";

import { useState } from "react";
import { Filter, RefreshCcw, Play, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function FeedHeader({
  workspaceId,
  signalCount,
}: {
  workspaceId: string | null;
  signalCount: number;
}) {
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const triggerScan = async () => {
    if (!workspaceId) return;
    setScanning(true);
    setLastResult(null);
    try {
      const res = await fetch(`/api/scan/${workspaceId}`, { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setLastResult(`Error: ${data.error}`);
      } else {
        setLastResult(
          `Scan complete — ${data.signalsFound} found, ${data.signalsSaved} new signals saved.`
        );
        // Refresh page to show new signals
        window.location.reload();
      }
    } catch {
      setLastResult("Scan failed — check console.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Filter size={16} /> Filters:
          </span>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="hover:bg-secondary cursor-pointer border-transparent bg-white/10"
            >
              All ({signalCount})
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
            >
              🔴 Hot
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer border-amber-500 text-amber-500 hover:bg-amber-500/10"
            >
              🟡 Warm
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer border-green-500 text-green-500 hover:bg-green-500/10"
            >
              🟢 Cold
            </Badge>
          </div>
        </div>

        {workspaceId && (
          <Button
            onClick={triggerScan}
            disabled={scanning}
            variant="default"
            size="sm"
            className="h-8 gap-1.5"
          >
            {scanning ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Scanning...
              </>
            ) : (
              <>
                <Play size={14} /> Run Scan
              </>
            )}
          </Button>
        )}
      </div>

      {scanning && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </div>
            <p className="text-sm font-medium text-primary">
              Scanning the web for signals... this may take up to 2 minutes.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-primary/70">
            <RefreshCcw size={12} className="animate-spin" />
            Processing SERP results
          </div>
        </div>
      )}

      {lastResult && !scanning && (
        <div className="bg-card border border-border rounded-lg p-3 text-sm text-muted-foreground">
          ✓ {lastResult}
        </div>
      )}
    </div>
  );
}

export function FilterBar() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <Filter size={16} /> Filters:
        </span>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="hover:bg-secondary cursor-pointer border-transparent bg-white/10"
          >
            All
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
          >
            🔴 Hot
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer border-amber-500 text-amber-500 hover:bg-amber-500/10"
          >
            🟡 Warm
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer border-green-500 text-green-500 hover:bg-green-500/10"
          >
            🟢 Cold
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select className="bg-card border border-border rounded-md text-sm px-3 py-1.5 outline-none focus:border-primary text-foreground">
          <option>All Sources</option>
          <option>Reddit</option>
          <option>Hacker News</option>
          <option>G2</option>
          <option>LinkedIn</option>
          <option>Web</option>
        </select>
        <select className="bg-card border border-border rounded-md text-sm px-3 py-1.5 outline-none focus:border-primary text-foreground">
          <option>All Types</option>
          <option>Complaint</option>
          <option>Question</option>
          <option>Evaluation</option>
          <option>Switching</option>
        </select>
      </div>
    </div>
  );
}

export function ScanStatusBanner({ isScanning }: { isScanning: boolean }) {
  if (!isScanning) return null;
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </div>
        <p className="text-sm font-medium text-primary">Scanning the web for signals...</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-primary/70">
        <RefreshCcw size={12} className="animate-spin" />
        Processing SERP results
      </div>
    </div>
  );
}
