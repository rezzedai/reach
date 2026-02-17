# LinkedIn Outreach Platform

AI-powered personalized LinkedIn outreach at scale. Import your connections, generate tailored multi-message sequences, and manage your entire outreach pipeline from a single dashboard.

Built for B2B sales teams at [Three Bears Data](https://threebearsdata.com).

## Features

- **One-Click LinkedIn Import** — Chrome extension scrapes your connections page directly into the platform
- **CSV Upload** — Import from Sales Navigator, LinkedIn data exports, or any spreadsheet
- **AI Sequence Generation** — Generates personalized 4-message outreach sequences per prospect using Claude or Gemini
- **Three Outreach Styles** — Cold, Warm, and Referral modes with distinct tone and cadence
- **Prospect Management** — Search, filter by status/company/campaign/tag/industry/location/date, sort by any column, bulk actions, deduplication, and status tracking
- **Dashboard Analytics** — KPIs, status breakdown, top industries, and recent sequences at a glance
- **Sortable Tables** — Click any column header to sort ascending/descending with visual indicators
- **CSV Export** — Download filtered prospect data as properly-escaped CSV
- **Outreach Tracking** — Track message status (pending/sent/responded/skipped) with timestamps per message
- **Outreach Dashboard** — Dedicated `/dashboard` view showing ready-to-send, follow-ups due, awaiting response, and recently responded
- **Campaigns** — Group prospects into campaigns for targeted outreach with bulk assignment
- **Custom Tags** — Create colored tags for flexible categorization beyond status, with filtering and bulk tagging
- **Generic CSV Import** — Import any CSV with automatic LinkedIn format detection or manual column mapping with preview
- **Email & Phone Fields** — Contact fields beyond LinkedIn for lightweight CRM use
- **Multi-User Support** — Google OAuth with per-user data isolation and API keys
- **Demo Mode** — Full product experience without an AI API key using pre-built sample sequences

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd linkedin-outreach-web
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables below)

# 3. Set up the database
npx drizzle-kit push

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Database (required)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Auth (required)
AUTH_SECRET=                    # Generate with: npx auth secret
AUTH_GOOGLE_ID=                 # Google OAuth client ID
AUTH_GOOGLE_SECRET=             # Google OAuth client secret

# AI Provider (at least one required for live generation)
AI_PROVIDER=gemini              # "gemini" or "anthropic"
MODEL=gemini-2.0-flash          # Model ID (see docs/ARCHITECTURE.md for full list)
GOOGLE_API_KEY=                 # Required if using Gemini
ANTHROPIC_API_KEY=              # Required if using Anthropic
```

> Without an AI API key the platform runs in **demo mode**, using pre-built sample sequences for the full product experience.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| UI | [Tailwind CSS 4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Radix UI](https://radix-ui.com) |
| Database | PostgreSQL via [Supabase](https://supabase.com) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Auth | [NextAuth.js v5](https://authjs.dev) (Google OAuth) |
| AI | [Anthropic Claude](https://docs.anthropic.com), [Google Gemini](https://ai.google.dev) |
| CSV Parsing | [PapaParse](https://www.papaparse.com) |
| Deployment | [Vercel](https://vercel.com) |
| Extension | Chrome Manifest V3 |

## Project Structure

```
linkedin-outreach-web/
├── src/
│   ├── app/
│   │   ├── (app)/                  # Authenticated app pages
│   │   │   ├── page.tsx            # Dashboard
│   │   │   ├── dashboard/         # Outreach tracking dashboard
│   │   │   ├── prospects/          # Prospect list + detail views
│   │   │   ├── generate/           # Sequence generation UI
│   │   │   ├── sequences/          # Sequence list view
│   │   │   ├── settings/           # API key management + extension guide
│   │   │   └── layout.tsx          # App shell with sidebar
│   │   ├── login/                  # Login page
│   │   └── api/
│   │       ├── generate/           # POST — single sequence generation
│   │       ├── generate-batch/     # POST — batch generation (up to 5 min)
│   │       ├── import-connections/ # POST — Chrome extension import endpoint
│   │       ├── auth/[...nextauth]/ # NextAuth route handlers
│   │       └── health/             # GET — AI provider health check
│   ├── lib/
│   │   ├── ai-client.ts           # AI provider abstraction (Anthropic + Gemini)
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── csv-parser.ts          # CSV parsing + deduplication
│   │   ├── models.ts              # AI model catalog + provider routing
│   │   ├── product-knowledge.ts   # Three Bears Data product context
│   │   ├── sample-sequences.ts    # Demo mode fallback templates
│   │   ├── templates.ts           # Prompt variable filling engine
│   │   ├── types.ts               # TypeScript interfaces
│   │   ├── db/
│   │   │   ├── index.ts           # Database connection (postgres.js + Drizzle)
│   │   │   ├── schema.ts          # Table definitions (Drizzle schema)
│   │   │   ├── queries.ts         # All database operations
│   │   │   └── helpers.ts         # Auth helpers (getRequiredUser)
│   │   └── prompts/
│   │       ├── system.ts          # System prompt (product positioning + tone)
│   │       ├── cold-outreach.ts   # Cold outreach generation prompt
│   │       ├── warm-outreach.ts   # Warm outreach generation prompt
│   │       └── referral-outreach.ts # Referral generation prompt
│   └── components/
│       ├── sidebar.tsx            # Main navigation sidebar
│       ├── import-dialog.tsx      # CSV upload dialog
│       ├── manual-add-form.tsx    # Manual prospect entry form
│       ├── session-provider.tsx   # NextAuth session wrapper
│       └── ui/                    # shadcn/ui primitives
├── extension/                     # Chrome extension
│   ├── manifest.json              # Manifest V3 config
│   ├── popup.html / popup.js      # Extension popup UI
│   ├── content.js                 # LinkedIn page content script
│   └── icons/                     # Extension icons
├── drizzle/                       # Generated migration files
├── drizzle.config.ts              # Drizzle Kit config
├── package.json
└── .env.example
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, database schema, AI pipeline |
| [API Reference](docs/API.md) | All endpoints, request/response formats, authentication |
| [Setup & Deployment](docs/SETUP.md) | Local dev, database, OAuth, Vercel deployment |
| [Chrome Extension](docs/CHROME_EXTENSION.md) | Extension installation, usage, and development |

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
npx drizzle-kit push      # Push schema changes to database
npx drizzle-kit generate  # Generate migration files
npx drizzle-kit studio    # Open Drizzle Studio (database GUI)
```

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│   Import     │     │   Organize   │     │    Generate     │     │    Review     │
│              │────>│              │────>│                │────>│              │
│ Extension or │     │ Filter, tag, │     │ AI writes 4-msg│     │ Edit, copy,  │
│ CSV upload   │     │ campaign,sort│     │ sequences      │     │ send on LI   │
│              │     │ deduplicate  │     │                │     │              │
└─────────────┘     └──────────────┘     └────────────────┘     └──────────────┘
```

1. **Import** — Pull contacts from LinkedIn via the Chrome extension or upload a CSV
2. **Organize** — Filter, tag, assign campaigns, sort, and deduplicate your prospects by company, title, industry, status, or custom tags
3. **Generate** — Select prospects, choose a style (Cold/Warm/Referral), and let AI write personalized sequences
4. **Review & Send** — Review generated messages, make edits, then copy and send through LinkedIn

## License

Private. All rights reserved.
