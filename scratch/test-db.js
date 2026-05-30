const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const fileContent = fs.readFileSync(envPath, "utf-8");
  fileContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const k = trimmed.substring(0, idx).trim();
      const v = trimmed.substring(idx + 1).trim();
      process.env[k] = v;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log("Checking signals table for 'deal_value'...");
  const { data: signals, error: sigErr } = await supabaseAdmin
    .from("signals")
    .select("deal_value")
    .limit(1);
  if (sigErr) {
    console.log("❌ deal_value column does not exist or error:", sigErr.message);
  } else {
    console.log("✅ deal_value column exists in 'signals' table!");
  }

  console.log("\nChecking 'market_briefs' table...");
  const { data: briefs, error: briefErr } = await supabaseAdmin
    .from("market_briefs")
    .select("*")
    .limit(1);
  if (briefErr) {
    console.log("❌ market_briefs table does not exist or error:", briefErr.message);
  } else {
    console.log("✅ market_briefs table exists!");
  }

  console.log("\nChecking 'activity_logs' table...");
  const { data: acts, error: actErr } = await supabaseAdmin
    .from("activity_logs")
    .select("*")
    .limit(1);
  if (actErr) {
    console.log("❌ activity_logs table does not exist or error:", actErr.message);
  } else {
    console.log("✅ activity_logs table exists!");
  }
}

test();
