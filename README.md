# 🌑 DarkFunnel — Find Buyers Before They Find You

DarkFunnel monitors Reddit, Hacker News, G2, LinkedIn and the open web in real time — surfacing people who are actively researching a solution like yours before they ever visit your website.

Built for the Bright Data Web Data UNLOCKED Hackathon 2026.

## How It Works
1. Describe your product and list your competitors.
2. Gemini AI generates 20 optimized search queries.
3. Bright Data SERP API scans the web every 6 hours.
4. Gemini scores each result for buying intent (1-10).
5. Hot signals appear in your feed with AI-recommended actions.
6. Get daily email digests and instant Slack alerts.

## Tech Stack
- Next.js 14 + Tailwind CSS + shadcn/ui
- Supabase (database)
- Google Gemini 2.5 Pro (query generation + signal scoring)
- Bright Data SERP API (web intelligence)
- Jina Reader (content extraction)
- Resend (email digests)
- Vercel (hosting + cron jobs)

## Setup
1. Clone the repo.
2. Copy `.env.example` to `.env.local` and fill in your keys.
3. Run the Supabase schema: `supabase/schema.sql`.
4. Run `npm install`.
5. Run `npm run dev`.

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_API_KEY`
- `BRIGHTDATA_API_KEY`
- `BRIGHTDATA_SERP_ZONE`
- `RESEND_API_KEY`

## License
MIT
