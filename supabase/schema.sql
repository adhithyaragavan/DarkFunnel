-- Create workspaces table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    product_description TEXT,
    icp_description TEXT,
    competitors JSONB DEFAULT '[]'::jsonb,
    keywords JSONB DEFAULT '[]'::jsonb,
    slack_webhook_url TEXT,
    email_digest_enabled BOOLEAN DEFAULT true,
    email_digest_time TEXT DEFAULT '09:00',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create queries table
CREATE TABLE queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    source TEXT NOT NULL, -- reddit | hackernews | g2 | linkedin | web
    intent_type TEXT NOT NULL, -- complaint | question | evaluation | switching
    rationale TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create signals table
CREATE TABLE signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    query_id UUID REFERENCES queries(id) ON DELETE SET NULL,
    source_url TEXT UNIQUE NOT NULL,
    source_type TEXT NOT NULL, -- reddit | hackernews | g2 | linkedin | web
    title TEXT NOT NULL,
    raw_content TEXT,
    intent_score INTEGER, -- 1-10
    intent_level TEXT, -- Hot | Warm | Cold
    signal_type TEXT, -- complaint | question | evaluation | switching
    summary TEXT,
    recommended_action TEXT,
    person_name TEXT,
    company_name TEXT,
    status TEXT DEFAULT 'new', -- new | saved | dismissed | contacted | converted
    notes TEXT,
    scraped_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create scan_logs table
CREATE TABLE scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    signals_found INTEGER DEFAULT 0,
    signals_saved INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running' -- running | completed | failed
);
