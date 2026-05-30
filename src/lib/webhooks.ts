import fs from 'fs';
import path from 'path';
import { Signal } from '@/types';

export interface WebhookLog {
  timestamp: string;
  statusCode: number;
  success: boolean;
}

export interface WebhookConfig {
  webhookUrl: string;
  webhookLogs: WebhookLog[];
}

const CONFIG_FILE = path.join(process.cwd(), 'scratch', 'webhook_config.json');

function ensureConfigDir() {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getWebhookConfig(workspaceId: string): WebhookConfig {
  try {
    ensureConfigDir();
    if (!fs.existsSync(CONFIG_FILE)) {
      return { webhookUrl: '', webhookLogs: [] };
    }
    const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    return data[workspaceId] || { webhookUrl: '', webhookLogs: [] };
  } catch (err) {
    console.error("Error reading webhook config:", err);
    return { webhookUrl: '', webhookLogs: [] };
  }
}

export function saveWebhookConfig(workspaceId: string, webhookUrl: string, logs?: WebhookLog[]) {
  try {
    ensureConfigDir();
    let data: Record<string, WebhookConfig> = {};
    if (fs.existsSync(CONFIG_FILE)) {
      data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
    const current = data[workspaceId] || { webhookUrl: '', webhookLogs: [] };
    data[workspaceId] = {
      webhookUrl,
      webhookLogs: logs !== undefined ? logs : current.webhookLogs
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error saving webhook config:", err);
  }
}

export async function triggerWebhook(workspaceId: string, signal: Signal) {
  const config = getWebhookConfig(workspaceId);
  if (!config.webhookUrl) return;

  const payload = {
    event: "new_signal",
    timestamp: new Date().toISOString(),
    signal: {
      id: signal.id,
      title: signal.title,
      summary: signal.summary,
      intentScore: signal.intent_score,
      intentLevel: signal.intent_level,
      signalType: signal.signal_type,
      source: signal.source_type,
      sourceUrl: signal.source_url,
      recommendedAction: signal.recommended_action,
      personName: signal.person_name ?? null,
      companyName: signal.company_name ?? null,
      createdAt: signal.created_at || signal.scraped_at
    }
  };

  let statusCode = 0;
  let success = false;

  try {
    const res = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    statusCode = res.status;
    success = res.ok;
  } catch (err) {
    console.error("Error sending webhook:", err);
    statusCode = 500;
    success = false;
  }

  // Log delivery
  const logEntry: WebhookLog = {
    timestamp: new Date().toISOString(),
    statusCode,
    success
  };

  const logs = [logEntry, ...config.webhookLogs].slice(0, 10);
  saveWebhookConfig(workspaceId, config.webhookUrl, logs);
}
