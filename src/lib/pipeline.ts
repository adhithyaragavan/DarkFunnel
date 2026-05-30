import { supabaseAdmin } from "./supabase";
import { serpSearch } from "./brightdata";
import { generateQueries, scoreSignal } from "./gemini";
import { sendSlackNotification, sendSlackSpikeAlert } from "./slack";
import { triggerWebhook } from "./webhooks";
import { Workspace } from "@/types";
import fs from "fs";
import path from "path";
import { logActivity } from "./activity";
import { sendSpikeAlertEmail } from "./email";

export async function runScanPipeline(workspaceId: string): Promise<{
  signalsFound: number;
  signalsSaved: number;
  error?: string;
}> {
  // 1. Fetch workspace
  const { data: workspace, error: wsError } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (wsError || !workspace) {
    return { signalsFound: 0, signalsSaved: 0, error: "Workspace not found" };
  }

  // 2. Create scan log
  const { data: scanLog } = await supabaseAdmin
    .from("scan_logs")
    .insert({
      workspace_id: workspaceId,
      started_at: new Date().toISOString(),
      status: "running",
      signals_found: 0,
      signals_saved: 0,
    })
    .select()
    .single();

  const scanLogId = scanLog?.id;

  let signalsFound = 0;
  let signalsSaved = 0;

  try {
    const ws = workspace as Workspace;

    // 3. Generate or reuse search queries
    let { data: existingQueries } = await supabaseAdmin
      .from("queries")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .limit(20);

    if (!existingQueries || existingQueries.length === 0) {
      console.log("[pipeline] Generating new queries via Gemini...");
      const generated = await generateQueries(
        ws.product_description,
        ws.icp_description,
        ws.competitors as string[]
      );

      if (generated.length > 0) {
        const toInsert = generated
          .map((q: Record<string, unknown>) => ({
            workspace_id: workspaceId,
            query_text: (q.query_text ?? q.query ?? "") as string,
            source: (q.source ?? "web") as string,
            intent_type: (q.intent_type ?? "question") as string,
            rationale: (q.rationale ?? "") as string,
            is_active: true,
          }))
          .filter((q) => q.query_text.length > 0);

        const { data: inserted } = await supabaseAdmin
          .from("queries")
          .insert(toInsert)
          .select();

        existingQueries = inserted ?? [];
      }
    }

    if (!existingQueries || existingQueries.length === 0) {
      throw new Error("No queries to run");
    }

    // 4. Run each query through SERP API
    for (const query of existingQueries.slice(0, 10)) {
      console.log(`[pipeline] Searching: "${query.query_text}"`);

      const results = await serpSearch(query.query_text);

      for (const result of results.slice(0, 5)) {
        const title = result.title ?? "";
        const snippet = result.description ?? result.snippet ?? "";
        const url = result.link ?? result.url ?? "";

        if (!title || !url) continue;

        // Check for duplicate
        const { data: existing } = await supabaseAdmin
          .from("signals")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("source_url", url)
          .maybeSingle();

        if (existing) continue;

        signalsFound++;

        // Rate limit spacing for free tier: 1s between calls
        await sleep(1000);

        // 5. Score with Gemini using title + snippet only
        const scored = await scoreSignal(
          snippet,
          title,
          ws.product_description,
          ws.icp_description,
          ws.competitors as string[]
        );

        if (!scored.isRelevant || scored.intentScore < 3) continue;

        // 6. Determine source type from URL
        const sourceType = detectSourceType(url);

        // 7. Save signal
        const { data: savedSignal } = await supabaseAdmin
          .from("signals")
          .insert({
            workspace_id: workspaceId,
            query_id: query.id,
            source_url: url,
            source_type: sourceType,
            title,
            raw_content: snippet,
            intent_score: scored.intentScore,
            intent_level: scored.intentLevel,
            signal_type: scored.signalType,
            summary: scored.summary,
            recommended_action: scored.recommendedAction,
            person_name: scored.personName ?? null,
            company_name: scored.companyName ?? null,
            status: "new",
            scraped_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (savedSignal) {
          signalsSaved++;

          // Save sentiment metadata locally
          try {
            const metaPath = path.join(process.cwd(), "scratch", "signal_metadata.json");
            let meta: Record<string, Record<string, unknown>> = {};
            if (fs.existsSync(metaPath)) {
              try {
                meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
              } catch {}
            }
            meta[savedSignal.id] = {
              ...meta[savedSignal.id],
              sentiment: scored.sentiment || "neutral"
            };
            fs.mkdirSync(path.dirname(metaPath), { recursive: true });
            fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");

            // Log signal saved in activity logs
            await logActivity(
              workspaceId,
              "Signal saved",
              `${scored.intentLevel} Signal found — ${title.substring(0, 60)}${title.length > 60 ? "..." : ""}`
            );
          } catch (err) {
            console.warn("[pipeline] Failed to write sentiment/activity metadata:", err);
          }

          // 7. Trigger general Webhook on intentScore >= 6
          if (scored.intentScore >= 6) {
            try {
              await triggerWebhook(workspaceId, savedSignal);
            } catch (err) {
              console.warn("[pipeline] General Webhook trigger failed:", err);
            }
          }

          // 8. Send Slack notification on intentScore >= 8
          if (scored.intentScore >= 8 && ws.slack_webhook_url) {
            try {
              await sendSlackNotification(ws.slack_webhook_url, {
                title,
                intent_level: scored.intentLevel,
                intent_score: scored.intentScore,
                signal_type: scored.signalType,
                summary: scored.summary,
                recommended_action: scored.recommendedAction,
                source_url: url,
                person_name: scored.personName,
                company_name: scored.companyName,
              });
            } catch (err) {
              console.warn("[pipeline] Slack notification failed:", err);
            }
          }
        }
      }

      // Rate limit: 500ms between queries
      await sleep(500);
    }

    // 9. Update scan log
    await supabaseAdmin
      .from("scan_logs")
      .update({
        completed_at: new Date().toISOString(),
        status: "completed",
        signals_found: signalsFound,
        signals_saved: signalsSaved,
      })
      .eq("id", scanLogId);

    // Velocity Spike Detection & Activity Logging
    try {

      // Log complete action
      await logActivity(
        workspaceId,
        "Scan completed",
        `Scan completed — ${signalsSaved} signals saved (${signalsFound} found)`
      );

      // Calculate signals in last 3 hours
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const { data: recentSignals } = await supabaseAdmin
        .from("signals")
        .select("id, title, intent_score, intent_level")
        .eq("workspace_id", workspaceId)
        .gte("created_at", threeHoursAgo);

      const currentCount = recentSignals?.length || 0;

      // Calculate historical 3h average
      const { data: allSignalsForAvg } = await supabaseAdmin
        .from("signals")
        .select("created_at")
        .eq("workspace_id", workspaceId);

      let avgCount = 1.5; // default baseline average per 3 hours to avoid divide-by-zero or low-stat alerts
      if (allSignalsForAvg && allSignalsForAvg.length > 0) {
        const dates = allSignalsForAvg.map((s) => new Date(s.created_at).getTime());
        const minDate = Math.min(...dates);
        const lifespanMs = Date.now() - minDate;
        const lifespanHours = Math.max(3, lifespanMs / (3600 * 1000));
        const threeHourWindows = lifespanHours / 3;
        avgCount = Math.max(1.0, allSignalsForAvg.length / threeHourWindows);
      }

      if (currentCount > 2 * avgCount && currentCount >= 3) {
        // 1. Store spike alert in scratch/spike_alerts.json for in-app red banner
        const alertsPath = path.join(process.cwd(), "scratch", "spike_alerts.json");
        let alerts: Record<string, Record<string, unknown>> = {};
        if (fs.existsSync(alertsPath)) {
          try {
            alerts = JSON.parse(fs.readFileSync(alertsPath, "utf-8"));
          } catch {}
        }
        alerts[workspaceId] = {
          active: true,
          count: currentCount,
          timestamp: new Date().toISOString()
        };
        fs.mkdirSync(path.dirname(alertsPath), { recursive: true });
        fs.writeFileSync(alertsPath, JSON.stringify(alerts, null, 2), "utf-8");

        // Log the spike in activity logs
        await logActivity(
          workspaceId,
          "Velocity Spike Alert",
          `⚡ Unusual spike detected — ${currentCount} signals in last 3 hours (average is ${avgCount.toFixed(1)})`
        );

        // 2. Email: "⚡ DarkFunnel Alert: Signal spike detected"
        try {
          const { data: wsData } = await supabaseAdmin.from("workspaces").select("user_email, slack_webhook_url").eq("id", workspaceId).single();
          if (wsData?.user_email) {
            await sendSpikeAlertEmail(wsData.user_email, currentCount, avgCount);
          }

          // 3. Slack: spike notification with count and top signal
          if (wsData?.slack_webhook_url) {
            const topSignal = recentSignals?.sort((a, b) => b.intent_score - a.intent_score)[0];
            await sendSlackSpikeAlert(wsData.slack_webhook_url, currentCount, topSignal);
          }
        } catch (err) {
          console.warn("[pipeline] Failed to trigger spike notifications:", err);
        }
      } else {
        // Reset spike alert if no spike is active
        const alertsPath = path.join(process.cwd(), "scratch", "spike_alerts.json");
        if (fs.existsSync(alertsPath)) {
          try {
            const alerts = JSON.parse(fs.readFileSync(alertsPath, "utf-8"));
            if (alerts[workspaceId]) {
              delete alerts[workspaceId];
              fs.writeFileSync(alertsPath, JSON.stringify(alerts, null, 2), "utf-8");
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn("[pipeline] Velocity spike check failed:", err);
    }

    return { signalsFound, signalsSaved };
  } catch (err) {
    console.error("[pipeline] Error:", err);

    if (scanLogId) {
      await supabaseAdmin
        .from("scan_logs")
        .update({
          completed_at: new Date().toISOString(),
          status: "failed",
          signals_found: signalsFound,
          signals_saved: signalsSaved,
        })
        .eq("id", scanLogId);
    }

    return {
      signalsFound,
      signalsSaved,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function detectSourceType(url: string): string {
  if (url.includes("reddit.com")) return "reddit";
  if (url.includes("news.ycombinator.com")) return "hackernews";
  if (url.includes("g2.com")) return "g2";
  if (url.includes("linkedin.com")) return "linkedin";
  return "web";
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
