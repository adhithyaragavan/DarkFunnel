import { Resend } from "resend";
import { Signal } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailDigest(
  toEmail: string,
  signals: Signal[]
) {
  const hot = signals.filter((s) => s.intent_level === "Hot");
  const warm = signals.filter((s) => s.intent_level === "Warm");
  const cold = signals.filter((s) => s.intent_level === "Cold");

  const signalRow = (s: Signal) => `
    <tr style="border-bottom:1px solid #222;">
      <td style="padding:12px 8px;">
        <span style="
          background:${s.intent_level === "Hot" ? "#ef4444" : s.intent_level === "Warm" ? "#f59e0b" : "#10b981"};
          color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;
        ">${s.intent_score}/10 ${s.intent_level.toUpperCase()}</span>
      </td>
      <td style="padding:12px 8px;">
        <a href="${s.source_url}" style="color:#6366f1;text-decoration:none;font-weight:600;">${s.title}</a>
        <p style="color:#888;font-size:13px;margin:4px 0 0;">${s.summary}</p>
      </td>
      <td style="padding:12px 8px;color:#aaa;font-size:12px;">
        ${s.source_type.toUpperCase()}
      </td>
      <td style="padding:12px 8px;color:#ccc;font-size:12px;max-width:200px;">
        ${s.recommended_action}
      </td>
    </tr>
  `;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#080808;color:#f0f0f0;font-family:system-ui,sans-serif;margin:0;padding:0;">
  <div style="max-width:760px;margin:0 auto;padding:40px 24px;">
    <div style="margin-bottom:32px;">
      <h1 style="font-size:24px;font-weight:700;margin:0 0 8px;">🌑 DarkFunnel Daily Digest</h1>
      <p style="color:#888;margin:0;">${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
    </div>

    <div style="display:flex;gap:16px;margin-bottom:32px;">
      <div style="background:#1a1a1a;border:1px solid #222;border-radius:8px;padding:16px 24px;flex:1;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:#ef4444;">${hot.length}</div>
        <div style="color:#888;font-size:12px;">🔥 Hot Signals</div>
      </div>
      <div style="background:#1a1a1a;border:1px solid #222;border-radius:8px;padding:16px 24px;flex:1;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:#f59e0b;">${warm.length}</div>
        <div style="color:#888;font-size:12px;">🟡 Warm Signals</div>
      </div>
      <div style="background:#1a1a1a;border:1px solid #222;border-radius:8px;padding:16px 24px;flex:1;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:#10b981;">${cold.length}</div>
        <div style="color:#888;font-size:12px;">🟢 Cold Signals</div>
      </div>
    </div>

    ${signals.length === 0 ? `
      <div style="text-align:center;padding:40px;background:#1a1a1a;border-radius:8px;">
        <div style="font-size:40px;">🔍</div>
        <p style="color:#888;">No signals found in the last 24 hours. Scans will continue automatically.</p>
      </div>
    ` : `
      <table style="width:100%;border-collapse:collapse;background:#1a1a1a;border:1px solid #222;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="border-bottom:1px solid #333;">
            <th style="padding:12px 8px;text-align:left;color:#888;font-size:12px;font-weight:600;">SCORE</th>
            <th style="padding:12px 8px;text-align:left;color:#888;font-size:12px;font-weight:600;">SIGNAL</th>
            <th style="padding:12px 8px;text-align:left;color:#888;font-size:12px;font-weight:600;">SOURCE</th>
            <th style="padding:12px 8px;text-align:left;color:#888;font-size:12px;font-weight:600;">ACTION</th>
          </tr>
        </thead>
        <tbody>
          ${signals.map(signalRow).join("")}
        </tbody>
      </table>
    `}

    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #222;text-align:center;">
      <p style="color:#555;font-size:12px;margin:0;">DarkFunnel — B2B Buying Intent Intelligence</p>
    </div>
  </div>
</body>
</html>
  `;

  await resend.emails.send({
    from: "DarkFunnel <digest@darkfunnel.app>",
    to: toEmail,
    subject: `🌑 DarkFunnel: ${signals.length} signals today (${hot.length} 🔥 hot)`,
    html,
  });
}

export async function sendWeeklySummaryEmail(
  toEmail: string,
  signals: Signal[],
  strategicFocus: string
) {
  const hot = signals.filter((s) => s.intent_level === "Hot");
  const saved = signals.filter((s) => s.status === "saved");
  const converted = signals.filter((s) => s.status === "converted");

  const top3 = [...signals]
    .sort((a, b) => b.intent_score - a.intent_score)
    .slice(0, 3);

  const sourceCounts: Record<string, number> = {};
  for (const s of signals) {
    sourceCounts[s.source_type] = (sourceCounts[s.source_type] ?? 0) + 1;
  }
  const trendingSource = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  const signalCardRow = (s: Signal) => `
    <div style="background:#141414; border: 1px solid #222; border-radius: 8px; padding: 20px; margin-bottom: 16px; text-align: left;">
      <div style="margin-bottom: 12px; font-family: sans-serif;">
        <span style="background:#ef4444; color:white; font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px; text-transform:uppercase;">
          ${s.intent_score}/10 ${s.intent_level}
        </span>
        <span style="color:#888; font-size:11px; font-weight:600; text-transform:uppercase; font-family:monospace; margin-left: 8px;">
          ${s.source_type.toUpperCase()}
        </span>
      </div>
      <h3 style="color:#ffffff; font-size:16px; margin:0 0 8px; font-weight:600;">${s.title}</h3>
      <p style="color:#aaa; font-size:13px; line-height:1.5; margin:0 0 12px;">${s.summary}</p>
      <div style="background:rgba(99, 102, 241, 0.08); border-left: 3px solid #6366f1; padding: 10px 14px; border-radius: 4px;">
        <div style="color:#6366f1; font-size:10px; font-weight:700; text-transform:uppercase; font-family:monospace; margin-bottom: 2px;">Recommended Action</div>
        <p style="color:#fff; font-size:12px; font-weight:600; margin:0;">${s.recommended_action}</p>
      </div>
    </div>
  `;

  const today = new Date();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekRange = `${oneWeekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#080808; color:#f0f0f0; font-family:system-ui,sans-serif; margin:0; padding:0;">
  <div style="max-width:680px; margin:0 auto; padding:40px 24px;">
    <div style="text-align:center; margin-bottom:40px;">
      <span style="font-size:32px;">🌑</span>
      <h1 style="font-size:26px; font-weight:800; margin:8px 0 4px; color:#ffffff;">DarkFunnel Weekly Intelligence</h1>
      <p style="color:#888; font-size:12px; margin:0; font-weight:600; text-transform:uppercase; font-family:monospace;">${weekRange}</p>
    </div>

    <table style="width:100%; border-collapse:collapse; margin-bottom:32px;">
      <tr>
        <td style="padding:4px; width:25%;">
          <div style="background:#141414; border:1px solid #222; border-radius:8px; padding:16px 8px; text-align:center;">
            <div style="font-size:24px; font-weight:800; color:#fff;">${signals.length}</div>
            <div style="color:#666; font-size:11px; font-weight:600; text-transform:uppercase; margin-top:2px;">Total</div>
          </div>
        </td>
        <td style="padding:4px; width:25%;">
          <div style="background:#141414; border:1px solid #222; border-radius:8px; padding:16px 8px; text-align:center;">
            <div style="font-size:24px; font-weight:800; color:#ef4444;">${hot.length}</div>
            <div style="color:#666; font-size:11px; font-weight:600; text-transform:uppercase; margin-top:2px;">Hot</div>
          </div>
        </td>
        <td style="padding:4px; width:25%;">
          <div style="background:#141414; border:1px solid #222; border-radius:8px; padding:16px 8px; text-align:center;">
            <div style="font-size:24px; font-weight:800; color:#6366f1;">${saved.length}</div>
            <div style="color:#666; font-size:11px; font-weight:600; text-transform:uppercase; margin-top:2px;">Saved</div>
          </div>
        </td>
        <td style="padding:4px; width:25%;">
          <div style="background:#141414; border:1px solid #222; border-radius:8px; padding:16px 8px; text-align:center;">
            <div style="font-size:24px; font-weight:800; color:#10b981;">${converted.length}</div>
            <div style="color:#666; font-size:11px; font-weight:600; text-transform:uppercase; margin-top:2px;">Converted</div>
          </div>
        </td>
      </tr>
    </table>

    <div style="background:#141414; border:1px solid #222; border-radius:8px; padding:24px; margin-bottom:32px; text-align: left;">
      <h2 style="color:#6366f1; font-size:12px; font-weight:800; text-transform:uppercase; margin:0 0 8px; font-family:monospace; tracking-wider;">🧠 Weekly Strategic Recommendation</h2>
      <p style="color:#e0e0e0; font-size:14px; line-height:1.6; margin:0; font-style:italic;">
        "${strategicFocus}"
      </p>
    </div>

    <div style="background:#141414; border:1px solid #222; border-radius:8px; padding:16px 24px; margin-bottom:32px; text-align: left;">
      <span style="color:#888; font-size:12px; font-weight:700; text-transform:uppercase; font-family:monospace;">🔥 Top Trending Source:</span>
      <span style="color:#fff; font-size:13px; font-weight:700; background:#222; padding:4px 10px; border-radius:4px; text-transform:uppercase; font-family:monospace; float: right;">
        ${trendingSource.toUpperCase()}
      </span>
      <div style="clear: both;"></div>
    </div>

    <div style="margin-bottom:32px;">
      <h2 style="color:#ffffff; font-size:14px; font-weight:800; text-transform:uppercase; margin:0 0 16px; font-family:monospace; tracking-wider; border-bottom:1px solid #222; padding-bottom:8px; text-align: left;">
        📌 Top 3 Hottest Opportunities
      </h2>
      ${top3.length === 0 ? `
        <p style="color:#666; text-align:center; font-size:13px; padding:20px 0;">No high-priority signals recorded this week.</p>
      ` : top3.map(signalCardRow).join("")}
    </div>

    <div style="margin-top:40px; padding-top:24px; border-top:1px solid #222; text-align:center;">
      <a href="https://darkfunnel.app/feed" style="background:#6366f1; color:#fff; padding:12px 24px; border-radius:6px; font-size:13px; font-weight:700; text-decoration:none; display:inline-block; margin-bottom:20px;">
        View All Signals →
      </a>
      <p style="color:#444; font-size:11px; margin:0;">DarkFunnel B2B Intent Scraper • All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: "DarkFunnel <onboarding@resend.dev>",
      to: toEmail,
      subject: `🌑 DarkFunnel Weekly: ${signals.length} signals, ${hot.length} hot opportunities`,
      html,
    });
  } catch (err) {
    console.warn("Failed to send weekly summary email, trying default Resend onboarding address:", err);
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: toEmail,
      subject: `🌑 DarkFunnel Weekly: ${signals.length} signals, ${hot.length} hot opportunities`,
      html,
    });
  }
}

export async function sendSpikeAlertEmail(
  toEmail: string,
  currentCount: number,
  avgCount: number
) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#080808; color:#f0f0f0; font-family:system-ui,sans-serif; margin:0; padding:0;">
  <div style="max-width:600px; margin:0 auto; padding:40px 24px; text-align: center;">
    <div style="font-size:40px; margin-bottom: 20px;">⚡</div>
    <h1 style="font-size:24px; font-weight:800; margin:0 0 12px; color:#ffffff;">Unusual Signal Velocity Detected</h1>
    <p style="color:#ef4444; font-size:16px; font-weight:bold; margin:0 0 24px;">
      ${currentCount} signals captured in the last 3 hours!
    </p>
    <div style="background:#141414; border: 1px solid #222; border-radius: 8px; padding: 20px; text-align: left; margin-bottom: 32px;">
      <p style="color:#aaa; font-size:14px; line-height:1.6; margin:0;">
        DarkFunnel's live scraper has detected an active signal velocity spike for your product. The current volume of <strong>${currentCount} signals</strong> in the last 3 hours is more than <strong>2x the historical average</strong> of ${avgCount.toFixed(1)} signals per 3-hour window.
      </p>
      <p style="color:#aaa; font-size:14px; line-height:1.6; margin:12px 0 0;">
        This indicates a sudden surge in interest, questions, or competitive reviews related to your market space. We highly recommend reviewing your Signal Feed immediately to act on these opportunities.
      </p>
    </div>
    <a href="https://darkfunnel.app/feed" style="background:#ef4444; color:#fff; padding:12px 24px; border-radius:6px; font-size:13px; font-weight:700; text-decoration:none; display:inline-block; margin-bottom:20px;">
      Open Signal Feed Now →
    </a>
    <p style="color:#444; font-size:11px; margin:0;">DarkFunnel • Real-Time B2B Signal Scraper</p>
  </div>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: "DarkFunnel <alerts@darkfunnel.app>",
      to: toEmail,
      subject: `⚡ DarkFunnel Alert: Signal spike detected`,
      html,
    });
  } catch {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: toEmail,
      subject: `⚡ DarkFunnel Alert: Signal spike detected`,
      html,
    });
  }
}
