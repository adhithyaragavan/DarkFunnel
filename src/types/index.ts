export interface Workspace {
  id: string;
  user_email: string;
  product_description: string;
  icp_description: string;
  competitors: string[];
  keywords: string[];
  slack_webhook_url?: string;
  email_digest_enabled: boolean;
  email_digest_time: string;
  created_at: string;
}

export interface Query {
  id: string;
  workspace_id: string;
  query_text: string;
  source: "reddit" | "hackernews" | "g2" | "linkedin" | "web";
  intent_type: "complaint" | "question" | "evaluation" | "switching";
  rationale: string;
  is_active: boolean;
  created_at: string;
}

export interface Signal {
  id: string;
  workspace_id: string;
  query_id?: string;
  source_url: string;
  source_type: "reddit" | "hackernews" | "g2" | "linkedin" | "web";
  title: string;
  raw_content?: string;
  intent_score: number;
  intent_level: "Hot" | "Warm" | "Cold";
  signal_type: "complaint" | "question" | "evaluation" | "switching" | "none";
  summary: string;
  recommended_action: string;
  person_name?: string;
  company_name?: string;
  status: "new" | "saved" | "dismissed" | "contacted" | "responded" | "converted";
  notes?: string;
  scraped_at: string;
  created_at: string;
  demo?: boolean; // For seed data
}

export interface ScanLog {
  id: string;
  workspace_id: string;
  started_at: string;
  completed_at?: string;
  signals_found: number;
  signals_saved: number;
  status: "running" | "completed" | "failed";
}
