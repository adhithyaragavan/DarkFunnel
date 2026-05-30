export async function sendSlackNotification(webhookUrl: string, signal: {
  title: string;
  intent_level: string;
  intent_score: number;
  signal_type: string;
  summary: string;
  recommended_action: string;
  source_url: string;
  person_name?: string;
  company_name?: string;
}) {
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🔴 Hot Buying Signal Detected",
        emoji: true
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${signal.title}*\n${signal.summary}`
      }
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Intent Score:* ${signal.intent_score}/10`
        },
        {
          type: "mrkdwn",
          text: `*Source:* ${signal.source_url.includes("reddit.com") ? "Reddit" : signal.source_url.includes("ycombinator") ? "Hacker News" : signal.source_url.includes("g2.com") ? "G2" : signal.source_url.includes("linkedin.com") ? "LinkedIn" : "Web"}`
        },
        {
          type: "mrkdwn",
          text: `*Signal Type:* ${signal.signal_type}`
        },
        {
          type: "mrkdwn",
          text: `*Company:* ${signal.company_name || "Unknown"}`
        }
      ]
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `→ *Recommended Action:* ${signal.recommended_action}`
      }
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View Signal →",
            emoji: true
          },
          url: `${dashboardUrl}/feed`,
          style: "primary"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Open Source",
            emoji: true
          },
          url: signal.source_url
        }
      ]
    }
  ];

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.statusText}`);
  }
}

export async function sendSlackSpikeAlert(
  webhookUrl: string,
  currentCount: number,
  topSignal?: { title: string; intent_score: number; intent_level: string }
) {
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "⚡ Unusual B2B Lead Velocity Detected!",
        emoji: true
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Unusual spike alert:* DarkFunnel has detected *${currentCount} signals* in the last 3 hours. This is *more than 2x the normal rate* for your workspace.`
      }
    },
    topSignal ? {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Highest Intent Opportunity Scraped:*\n*${topSignal.title}* (${topSignal.intent_score}/10 ${topSignal.intent_level})`
      }
    } : null,
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "🔍 View Feed Now",
            emoji: true
          },
          url: "https://darkfunnel.app/feed",
          style: "danger"
        }
      ]
    }
  ].filter(Boolean);

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.statusText}`);
  }
}
