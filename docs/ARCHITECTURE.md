# Architecture

This document describes the system architecture, data flow, and key design decisions for the LinkedIn Outreach Platform.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Vercel (Production)                          │
│                                                                     │
│  ┌───────────────┐   ┌───────────────────────────────────────────┐ │
│  │  Chrome        │   │  Next.js 16 App Router                    │ │
│  │  Extension     │──>│                                           │ │
│  │  (Manifest V3) │   │  ┌─────────┐  ┌──────────┐  ┌─────────┐ │ │
│  └───────────────┘   │  │  Pages   │  │   API    │  │  Server │ │ │
│                       │  │  (RSC)   │  │  Routes  │  │ Actions │ │ │
│  ┌───────────────┐   │  └────┬─────┘  └────┬─────┘  └────┬────┘ │ │
│  │  Browser       │   │       │             │             │       │ │
│  │  (React 19)    │<──│       └─────────────┼─────────────┘       │ │
│  └───────────────┘   │                     │                     │ │
│                       │              ┌──────┴──────┐              │ │
│                       │              │  Drizzle    │              │ │
│                       │              │  ORM        │              │ │
│                       │              └──────┬──────┘              │ │
│                       └─────────────────────┼────────────────────┘ │
│                                             │                      │
│  ┌──────────────────┐               ┌───────┴──────┐              │
│  │  AI Providers     │               │  PostgreSQL  │              │
│  │  ├─ Anthropic     │               │  (Supabase)  │              │
│  │  └─ Google Gemini │               └──────────────┘              │
│  └──────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────┘
```

## Request Flow

### Authentication Flow

```
Browser ──> Middleware (src/middleware.ts)
               │
               ├── Unprotected routes (/login, /api/auth, /api/health, /api/import-connections)
               │   └── Pass through
               │
               └── Protected routes (everything else)
                   └── NextAuth session check
                       ├── Valid session → proceed
                       └── No session → redirect to /login
```

NextAuth.js v5 is configured with:
- **Provider**: Google OAuth
- **Strategy**: Database sessions (not JWT)
- **Adapter**: Drizzle adapter storing sessions in PostgreSQL
- **Event**: On user creation, an API key (`key_` + 32 random chars) is auto-generated

### Data Flow: Prospect Import

```
Chrome Extension                    CSV Upload
      │                                 │
      │ POST /api/import-connections     │ Client-side parsing
      │ (Bearer API key auth)            │ (PapaParse)
      │                                 │
      └──────────┐            ┌─────────┘
                 │            │
                 ▼            ▼
          ┌─────────────────────┐
          │   createProspects() │
          │   (Drizzle query)   │
          └──────────┬──────────┘
                     │
                     ▼
              ┌──────────────┐
              │  prospects   │
              │  table       │
              └──────────────┘
```

**Chrome Extension path**: The extension sends connections as JSON to `/api/import-connections`. Authentication uses the user's API key via `Authorization: Bearer <key>`. The endpoint parses full names into first/last, extracts company from title strings (handles "at" and "|" patterns), and bulk-inserts.

**CSV Upload path**: Parsing happens client-side using PapaParse. The `csv-parser.ts` module handles automatic header detection (maps 20+ common column names to prospect fields), deduplication against existing prospects (firstName + lastName + company), and returns clean `Prospect[]` objects. These are saved via a Server Action. For generic CSVs that are not in the standard LinkedIn export format, the import flow includes a column mapping step where the user maps their CSV headers to prospect fields. A 5-row preview is shown before the final import is confirmed.

### Data Flow: Sequence Generation

```
┌─────────────┐     ┌───────────────┐     ┌──────────────────┐
│  /generate   │     │ /api/generate  │     │  AI Provider     │
│  page        │────>│ or             │────>│  (Anthropic or   │
│  (client)    │     │ /api/generate  │     │   Gemini)        │
│              │     │ -batch         │     │                  │
└─────────────┘     └───────┬───────┘     └────────┬─────────┘
                            │                      │
                    System prompt +           JSON response
                    Style prompt +            (4 messages)
                    Prospect data                  │
                            │                      │
                            └──────────────────────┘
                                     │
                              parseSequenceResponse()
                                     │
                              ┌──────┴──────┐
                              │  sequences  │
                              │  table      │
                              └─────────────┘
```

**Single generation** (`POST /api/generate`): Takes one prospect + style, returns one sequence.

**Batch generation** (`POST /api/generate-batch`): Takes an array of prospects + style, generates sequences sequentially with a 1-second delay between API calls for rate limiting. Timeout is set to 300 seconds (5 minutes) via `maxDuration`.

**Demo mode fallback**: When no AI API key is configured, the client-side code uses `sample-sequences.ts` to match pre-written templates by industry and title pattern, fills in prospect variables, and returns sequences without hitting any API.

### Data Flow: Outreach Tracking

Message status is tracked via a JSONB read-modify-write pattern on the `sequences` table.

```
updateMessageStatus(sequenceId, messageIndex, status)
        │
        ├── Read sequence.messages (JSONB array) from DB
        │
        ├── Update messages[messageIndex].status
        │   Also sets sentAt or respondedAt depending on new status
        │
        ├── Write updated messages array back to sequences table
        │
        └── Update prospect fields:
            ├── lastContactedAt = now() (when status = 'sent')
            └── nextFollowUpAt  = calculated from next pending message day
```

The dashboard aggregates status counts across all sequences for the user by scanning each sequence's `messages` JSONB array. No separate message rows are written — the sequence record is the single source of truth for outreach state.

## Database Schema

PostgreSQL via Supabase, managed with Drizzle ORM. Schema defined in `src/lib/db/schema.ts`.

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐
│   users       │       │   accounts   │
├──────────────┤       ├──────────────┤
│ id (PK)       │──┐    │ provider (PK)│
│ name          │  │    │ providerAc.. │
│ email (UQ)    │  │    │ (PK)         │
│ emailVerified │  ├───<│ userId (FK)  │
│ image         │  │    │ type         │
│ apiKey (UQ)   │  │    │ access_token │
└───────┬───────┘  │    │ refresh_token│
        │          │    │ expires_at   │
        │          │    └──────────────┘
        │          │
        │          │    ┌──────────────┐
        │          │    │  sessions    │
        │          ├───<│ sessionToken │
        │          │    │ userId (FK)  │
        │          │    │ expires      │
        │          │    └──────────────┘
        │          │
        │          │    ┌──────────────────┐
        │          │    │  prospects        │
        │          ├───<│ id (PK)           │
        │          │    │ userId (FK)       │
        │          │    │ firstName         │
        │          │    │ lastName          │
        │          │    │ title             │
        │          │    │ company           │
        │          │    │ companySize       │
        │          │    │ industry          │
        │          │    │ location          │
        │          │    │ linkedinUrl       │
        │          │    │ connectedOn       │
        │          │    │ notes             │
        │          │    │ email             │
        │          │    │ phone             │
        │          │    │ lastContactedAt   │
        │          │    │ nextFollowUpAt    │
        │          │    │ status (enum)     │
        │          │    │ importedAt        │
        │          │    └──┬──────────┬────┘
        │          │       │          │
        │          │  ┌────┴──────┐ ┌─┴──────────────┐
        │          │  │prospect_  │ │prospect_tags   │
        │          │  │campaigns  │ │                │
        │          │  ├───────────┤ ├────────────────┤
        │          │  │prospectId │ │prospectId (FK) │
        │          │  │(FK, PK)   │ │tagId (FK, PK)  │
        │          │  │campaignId │ └───────┬────────┘
        │          │  │(FK, PK)   │         │
        │          │  └─────┬─────┘  ┌──────┴──────┐
        │          │        │        │    tags      │
        │          │  ┌─────┴──────┐ ├──────────────┤
        │          │  │  campaigns │ │ id (PK)      │
        │          ├─<│ id (PK)    │ │ userId (FK)  │
        │          │  │ userId (FK)│ │ name         │
        │          │  │ name       │ │ color        │
        │          │  │ description│ └──────────────┘
        │          │  │ createdAt  │
        │          │  └────────────┘
        │          │
        │          │    ┌──────────────────┐
        │          │    │  sequences       │
        │          ├───<│ id (PK)          │
        │               │ userId (FK)      │
        │               │ prospectId (FK,UQ)│
        │               │ prospectName     │
        │               │ company          │
        │               │ style (enum)     │
        │               │ model            │
        │               │ provider         │
        │               │ generatedAt      │
        │               │ generationTime   │
        │               │ demo             │
        │               │ messages (JSONB) │
        └──────────────<└──────────────────┘
```

### Table Details

#### `users`
Auth.js standard table extended with `apiKey` for Chrome extension authentication.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | nanoid(21), auto-generated |
| `name` | `text` | From Google OAuth profile |
| `email` | `text` UNIQUE | Google email |
| `emailVerified` | `timestamp` | OAuth verification timestamp |
| `image` | `text` | Google profile image URL |
| `apiKey` | `text` UNIQUE | `key_` + nanoid(32), generated on user creation |

#### `prospects`
Core business table. All queries are scoped by `userId`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | nanoid(10) |
| `userId` | `text` FK | References `users.id`, cascade delete |
| `firstName` | `text` | Required (default `''`) |
| `lastName` | `text` | Required (default `''`) |
| `title` | `text` | Job title |
| `company` | `text` | Company name |
| `companySize` | `text` | Employee count range |
| `industry` | `text` | Industry vertical |
| `location` | `text` | Geographic location |
| `linkedinUrl` | `text` | LinkedIn profile URL |
| `connectedOn` | `text` | Connection date from LinkedIn |
| `notes` | `text` | Free-form notes |
| `email` | `text` | Contact email (default `''`) |
| `phone` | `text` | Contact phone (default `''`) |
| `lastContactedAt` | `timestamp` | Last message sent timestamp |
| `nextFollowUpAt` | `timestamp` | Calculated next follow-up date |
| `status` | `text` enum | `new` → `enriched` → `sequenced` → `contacted` |
| `importedAt` | `timestamp` | ISO string, auto-set on creation |

#### `sequences`
One sequence per prospect (unique constraint on `prospectId`). Regenerating a sequence replaces the existing one (upsert pattern).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | nanoid(10) |
| `userId` | `text` FK | References `users.id`, cascade delete |
| `prospectId` | `text` FK UNIQUE | References `prospects.id`, cascade delete |
| `prospectName` | `text` | Denormalized for display |
| `company` | `text` | Denormalized for display |
| `style` | `text` enum | `cold`, `warm`, or `referral` |
| `model` | `text` | AI model ID used for generation |
| `provider` | `text` | `anthropic` or `gemini` |
| `generatedAt` | `text` | ISO timestamp |
| `generationTime` | `text` | e.g. `"2.3s"` |
| `demo` | `boolean` | `true` if generated from sample templates |
| `messages` | `jsonb` | Array of Message objects (see below) |

#### `messages` JSONB structure

```typescript
interface Message {
  day: number;              // 0, 3, 5, 7, 12, or 14
  type: string;             // "connection_request", "follow_up_1", etc.
  subject: string | null;   // null for Day 0 messages
  body: string;             // Message body text
  status?: 'pending' | 'sent' | 'responded' | 'skipped';
  sentAt?: string | null;
  respondedAt?: string | null;
}
```

#### `campaigns`
Groups of prospects for organizing outreach efforts. One user can have many campaigns.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | nanoid(10), auto-generated |
| `userId` | `text` FK | References `users.id`, cascade delete |
| `name` | `text` | Campaign name |
| `description` | `text` | Optional description (default `''`) |
| `createdAt` | `timestamp` | Auto-set on creation |

#### `prospect_campaigns`
Join table linking prospects to campaigns. A prospect can belong to many campaigns; a campaign can contain many prospects.

| Column | Type | Notes |
|--------|------|-------|
| `prospectId` | `text` FK | References `prospects.id`, cascade delete |
| `campaignId` | `text` FK | References `campaigns.id`, cascade delete |
| (composite PK) | | `(prospectId, campaignId)` |

#### `tags`
User-defined labels for prospects. One user can have many tags.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | nanoid(10), auto-generated |
| `userId` | `text` FK | References `users.id`, cascade delete |
| `name` | `text` | Tag label |
| `color` | `text` | Display color (default `'gray'`) |

#### `prospect_tags`
Join table linking prospects to tags. A prospect can have many tags; a tag can apply to many prospects.

| Column | Type | Notes |
|--------|------|-------|
| `prospectId` | `text` FK | References `prospects.id`, cascade delete |
| `tagId` | `text` FK | References `tags.id`, cascade delete |
| (composite PK) | | `(prospectId, tagId)` |

#### Auth.js tables
`accounts`, `sessions`, and `verificationTokens` follow the standard [Auth.js Drizzle schema](https://authjs.dev/getting-started/adapters/drizzle).

## AI Integration

### Provider Abstraction

The `ai-client.ts` module defines an `AIProvider` interface implemented by two classes:

```
AIProvider (interface)
├── AnthropicProvider  — wraps @anthropic-ai/sdk
└── GeminiProvider     — wraps @google/genai
```

Provider selection is resolved in this order:
1. `MODEL` env var → infer provider from model ID prefix (`claude-*` → anthropic, `gemini-*` → gemini)
2. `AI_PROVIDER` env var → explicit provider selection
3. Default: `gemini` with `gemini-2.0-flash`

### Supported Models

| Model ID | Provider | Label |
|----------|----------|-------|
| `claude-sonnet-4-5-20250929` | Anthropic | Claude Sonnet 4.5 |
| `claude-opus-4-20250514` | Anthropic | Claude Opus 4 |
| `claude-haiku-3-5-20241022` | Anthropic | Claude Haiku 3.5 |
| `gemini-2.0-flash` | Google | Gemini 2.0 Flash |
| `gemini-2.5-flash` | Google | Gemini 2.5 Flash |
| `gemini-2.5-pro` | Google | Gemini 2.5 Pro |
| `gemini-1.5-pro` | Google | Gemini 1.5 Pro |

Any model ID starting with `claude-` or `gemini-` will work, even if not in the catalog.

### Prompt Architecture

Each generation request sends two prompt components to the AI:

```
┌─────────────────────────────────────────────┐
│ System Prompt (prompts/system.ts)            │
│  - Company context (Three Bears Data)        │
│  - Product details (Optimmeasure)            │
│  - Pricing and entry points                  │
│  - Positioning and tone guidelines           │
└─────────────────────────────────────────────┘
                    +
┌─────────────────────────────────────────────┐
│ User Prompt (style-specific)                 │
│  - Prospect data (name, title, company...)   │
│  - Message requirements (word count, timing) │
│  - Output format (JSON structure)            │
│  - Rules (no cliches, no pressure, etc.)     │
└─────────────────────────────────────────────┘
```

**Template variable filling** (`templates.ts`): Before sending to the AI, the user prompt template is populated with prospect data using `{{variable}}` syntax. Supports conditional blocks via `{{#if notes}}...{{/if}}`.

Variables: `{{firstName}}`, `{{lastName}}`, `{{title}}`, `{{company}}`, `{{companySize}}`, `{{industry}}`, `{{location}}`, `{{connectedOn}}`, `{{notes}}`, `{{base12Url}}`

### Outreach Styles

| Style | Messages | Schedule | First Message Type |
|-------|----------|----------|--------------------|
| **Cold** | 4 | Day 0, 3, 7, 14 | `connection_request` |
| **Warm** | 4 | Day 0, 3, 7, 14 | `re_engagement` |
| **Referral** | 3 | Day 0, 5, 12 | `referral_intro` |

### Response Parsing

The AI response is expected to be valid JSON with a `messages` array. The parser (`parseSequenceResponse`) handles:
1. Extracting JSON from markdown code fences (` ```json ... ``` `)
2. Direct JSON parsing
3. Validation that a `messages` array exists

## Multi-Tenant Data Isolation

Every database query is scoped by `userId`:

```typescript
// Example: getProspects is always filtered by user
export async function getProspects(userId: string) {
  return db.select().from(prospects).where(eq(prospects.userId, userId));
}
```

- All prospect and sequence CRUD operations require `userId` as the first parameter
- Foreign keys cascade on delete — deleting a user removes all their data
- The middleware redirects unauthenticated requests before any data access
- Server Actions use `getRequiredUser()` which reads the session and redirects if absent

## Chrome Extension Architecture

```
┌─────────────────────────────────────────┐
│ Chrome Extension (Manifest V3)           │
│                                         │
│  popup.js                               │
│  ├── Reads app URL + API key from       │
│  │   chrome.storage.local               │
│  ├── Injects scraping script into       │
│  │   active LinkedIn tab                │
│  ├── "Scrape to App" → POST to          │
│  │   /api/import-connections            │
│  └── "Download CSV" → local download    │
│                                         │
│  content.js                             │
│  └── Injects a floating badge on        │
│      linkedin.com/mynetwork/invite-     │
│      connect/connections/ pages         │
└─────────────────────────────────────────┘
```

The extension only activates on LinkedIn connection pages. It uses `chrome.scripting.executeScript` to run a DOM scraper in the active tab that extracts name, title, URL, and connection date from each connection card.

## Key Design Decisions

1. **Database sessions over JWT**: More secure for a multi-user SaaS. Sessions can be revoked server-side. Trade-off is an extra DB query per request.

2. **Drizzle ORM over Prisma**: Lighter weight, closer to SQL, and better TypeScript inference. Schema-as-code in `schema.ts` instead of a separate schema file.

3. **Server Actions for mutations**: Prospect CRUD and sequence saving use Next.js Server Actions (`'use server'`) instead of API routes, reducing client-side fetch boilerplate.

4. **API routes for generation**: Generation endpoints are API routes (not Server Actions) because they need streaming/long-timeout support and are called from client-side fetch with progress tracking.

5. **Sequence upsert pattern**: Regenerating a sequence for a prospect deletes the old one first (`createSequence` in `queries.ts`). This keeps the `prospectId` unique constraint and avoids stale data.

6. **JSONB for messages**: Messages are stored as a JSONB array on the sequence record rather than in a separate table. This simplifies queries and keeps the sequence as a single atomic unit.

7. **Client-side CSV parsing**: PapaParse runs in the browser to avoid uploading large files to the server. Only the parsed, validated prospect objects are sent via Server Action.

8. **Dual AI provider support**: The provider abstraction allows switching between Anthropic and Gemini with a single env var change, useful for cost optimization and avoiding rate limits.

9. **Many-to-many via join tables for campaigns and tags**: Campaigns and tags use dedicated join tables (`prospect_campaigns`, `prospect_tags`) with composite primary keys and `onConflictDoNothing` for idempotent assignment. Both tables cascade on delete from either side.
