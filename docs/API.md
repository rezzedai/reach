# API Reference

All API endpoints are served under `/api/`. Protected endpoints require either a valid NextAuth session or an API key.

## Authentication

### Session Auth (Web App)
All pages and most API routes are protected by NextAuth middleware. The browser session cookie is sent automatically.

### API Key Auth (Chrome Extension)
The `/api/import-connections` endpoint accepts API key authentication:

```
Authorization: Bearer key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

API keys are generated automatically when a user signs up and can be regenerated from the Settings page. Each key is unique per user and prefixed with `key_`.

---

## Endpoints

### `POST /api/generate`

Generate a personalized outreach sequence for a single prospect.

**Auth**: Session required

**Request Body**:
```json
{
  "prospect": {
    "id": "abc123",
    "firstName": "Jane",
    "lastName": "Smith",
    "title": "VP of Marketing",
    "company": "Acme Corp",
    "companySize": "500-1000",
    "industry": "Technology",
    "location": "San Francisco, CA",
    "linkedinUrl": "https://linkedin.com/in/janesmith",
    "connectedOn": "2024-01-15",
    "notes": "",
    "status": "new",
    "importedAt": "2024-06-01T12:00:00.000Z"
  },
  "style": "cold"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prospect` | `Prospect` | Yes | Full prospect object |
| `style` | `string` | No | `"cold"` (default), `"warm"`, or `"referral"` |

**Response** `200 OK`:
```json
{
  "id": "xY9k2mN3pQ",
  "prospectId": "abc123",
  "prospectName": "Jane Smith",
  "company": "Acme Corp",
  "style": "cold",
  "model": "gemini-2.0-flash",
  "provider": "gemini",
  "generatedAt": "2024-06-01T12:30:00.000Z",
  "generationTime": "2.3s",
  "messages": [
    {
      "day": 0,
      "type": "connection_request",
      "subject": null,
      "body": "Hi Jane — I noticed Acme Corp has been..."
    },
    {
      "day": 3,
      "type": "follow_up_1",
      "subject": "Quick thought on tech attribution",
      "body": "Jane — I was looking at some research..."
    },
    {
      "day": 7,
      "type": "follow_up_2",
      "subject": "5-min assessment for Acme Corp",
      "body": "Jane — One of our clients in a similar space..."
    },
    {
      "day": 14,
      "type": "break_up",
      "subject": "Last note from me",
      "body": "Jane — I don't want to be another person..."
    }
  ]
}
```

**Error Responses**:

| Status | Body | Cause |
|--------|------|-------|
| `401` | `{ "error": "Unauthorized" }` | Missing or invalid session |
| `400` | `{ "error": "Invalid prospect data" }` | Missing `prospect.id` or `prospect.firstName` |
| `500` | `{ "error": "API key not configured..." }` | No AI API key in environment |
| `500` | `{ "error": "<provider error>" }` | AI provider returned an error |

---

### `POST /api/generate-batch`

Generate sequences for multiple prospects in a single request. Sequences are generated sequentially with a 1-second delay between calls.

**Auth**: Session required

**Timeout**: 300 seconds (5 minutes)

**Request Body**:
```json
{
  "prospects": [
    { "id": "abc123", "firstName": "Jane", "lastName": "Smith", ... },
    { "id": "def456", "firstName": "John", "lastName": "Doe", ... }
  ],
  "style": "warm"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prospects` | `Prospect[]` | Yes | Array of prospect objects |
| `style` | `string` | No | `"cold"` (default), `"warm"`, or `"referral"` |

**Response** `200 OK`:
```json
{
  "results": [
    {
      "id": "xY9k2mN3pQ",
      "prospectId": "abc123",
      "prospectName": "Jane Smith",
      ...
    }
  ],
  "errors": [
    {
      "prospectId": "def456",
      "prospectName": "John Doe",
      "error": "Rate limit exceeded"
    }
  ]
}
```

The response always includes both `results` (successful generations) and `errors` (failed generations). Partial success is possible — some prospects may succeed while others fail.

**Error Responses**:

| Status | Body | Cause |
|--------|------|-------|
| `401` | `{ "error": "Unauthorized" }` | Missing or invalid session |
| `400` | `{ "error": "Must provide at least one prospect" }` | Empty or missing `prospects` array |
| `500` | `{ "error": "Batch generation failed" }` | Unhandled error |

---

### `POST /api/import-connections`

Import LinkedIn connections from the Chrome extension or web client.

**Auth**: API key (Bearer token) or session

**CORS**: Enabled (`Access-Control-Allow-Origin: *`) for Chrome extension cross-origin requests.

**Request Body**:
```json
{
  "connections": [
    {
      "name": "Jane Smith",
      "title": "VP of Marketing at Acme Corp",
      "url": "https://www.linkedin.com/in/janesmith",
      "connectedOn": "Connected 2 weeks ago"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `connections` | `ConnectionPayload[]` | Yes | Array of scraped connections |
| `connections[].name` | `string` | Yes | Full name (split into firstName/lastName) |
| `connections[].title` | `string` | No | Title string (parsed for job title + company) |
| `connections[].url` | `string` | No | LinkedIn profile URL |
| `connections[].connectedOn` | `string` | No | Connection date text from LinkedIn |

**Title parsing**: The endpoint extracts company from title strings:
- `"VP of Marketing at Acme Corp"` → title: `"VP of Marketing"`, company: `"Acme Corp"`
- `"VP of Marketing | Acme Corp"` → title: `"VP of Marketing"`, company: `"Acme Corp"`
- `"VP of Marketing"` → title: `"VP of Marketing"`, company: `""`

**Response** `200 OK`:
```json
{
  "added": 15,
  "duplicates": 0,
  "message": "Imported 15 connections."
}
```

**Error Responses**:

| Status | Body | Cause |
|--------|------|-------|
| `401` | `{ "error": "Unauthorized. Provide a valid API key or sign in." }` | Invalid API key and no session |
| `400` | `{ "error": "No connections provided" }` | Empty or missing `connections` array |
| `400` | `{ "error": "Invalid request body" }` | Malformed JSON |

---

### `OPTIONS /api/import-connections`

CORS preflight handler for the Chrome extension.

**Response** `200 OK` with CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

### `GET /api/health`

Returns the current AI provider configuration and status. Useful for debugging.

**Auth**: None required

**Response** `200 OK`:
```json
{
  "provider": "gemini",
  "providerName": "Google Gemini",
  "model": "gemini-2.0-flash",
  "modelLabel": "Gemini 2.0 Flash",
  "configured": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `provider` | `string` | Provider key (`"gemini"` or `"anthropic"`) |
| `providerName` | `string` | Display name |
| `model` | `string` | Model ID currently in use |
| `modelLabel` | `string` | Human-readable model name |
| `configured` | `boolean` | Whether the API key is set |

---

### `GET/POST /api/auth/*`

NextAuth.js route handlers. These are managed entirely by the NextAuth library and handle:
- `GET /api/auth/signin` — Sign-in page redirect
- `GET /api/auth/signout` — Sign-out
- `POST /api/auth/callback/google` — Google OAuth callback
- `GET /api/auth/session` — Current session info

See [NextAuth.js documentation](https://authjs.dev) for details.

---

## Server Actions

In addition to API routes, the app uses Next.js Server Actions for mutations that originate from the web UI. These are not HTTP endpoints — they are called directly from React components.

### Prospect Actions (`src/app/(app)/prospects/actions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `addProspectsAction` | `(data: Omit<Prospect, 'id'>[]) → void` | Bulk create prospects |
| `updateProspectAction` | `(id: string, data: Partial<Prospect>) → void` | Update a single prospect |
| `updateStatusAction` | `(ids: string[], status: ProspectStatus) → void` | Bulk update status |
| `deleteProspectsAction` | `(ids: string[]) → void` | Bulk delete prospects |
| `updateMessageStatusAction` | `(sequenceId: string, messageIndex: number, status: MessageStatus) → Sequence` | Mark a message as sent/responded/skipped, updates prospect timestamps |
| `createCampaignAction` | `(name: string, description?: string) → Campaign` | Create a new campaign |
| `updateCampaignAction` | `(id: string, data: { name?: string; description?: string }) → void` | Update campaign details |
| `deleteCampaignAction` | `(id: string) → void` | Delete a campaign |
| `addToCampaignAction` | `(prospectIds: string[], campaignId: string) → void` | Add prospects to a campaign |
| `removeFromCampaignAction` | `(prospectIds: string[], campaignId: string) → void` | Remove prospects from a campaign |
| `createTagAction` | `(name: string, color: string) → Tag` | Create a new tag |
| `deleteTagAction` | `(id: string) → void` | Delete a tag |
| `addTagAction` | `(prospectIds: string[], tagId: string) → void` | Add a tag to prospects |

### Generate Actions (`src/app/(app)/generate/actions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `saveSequencesAction` | `(sequences: Omit<Sequence, 'id'>[], prospectIds: string[]) → void` | Save generated sequences and update prospect status to `sequenced` |

### Settings Actions (`src/app/(app)/settings/actions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `regenerateApiKeyAction` | `() → string` | Generate a new API key, returns the new key |
| `migrateLocalDataAction` | `(prospects, sequences) → { prospects: number, sequences: number }` | Migrate data from local storage to database |

---

## TypeScript Types

### `Prospect`

```typescript
interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  companySize: string;
  industry: string;
  location: string;
  linkedinUrl: string;
  connectedOn: string;
  email: string;
  phone: string;
  notes: string;
  status: 'new' | 'enriched' | 'sequenced' | 'contacted';
  importedAt: string;
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
}
```

### `Sequence`

```typescript
interface Sequence {
  id: string;
  prospectId: string;
  prospectName: string;
  company: string;
  style: 'cold' | 'warm' | 'referral';
  model: string;
  provider: string;
  generatedAt: string;
  generationTime: string;
  demo?: boolean;
  messages: Message[];
}
```

### `Message`

```typescript
interface Message {
  day: number;
  type: string;
  subject: string | null;
  body: string;
  status?: 'pending' | 'sent' | 'responded' | 'skipped';
  sentAt?: string | null;
  respondedAt?: string | null;
}
```

### `MessageStatus`

```typescript
type MessageStatus = 'pending' | 'sent' | 'responded' | 'skipped';
```

### `Campaign`

```typescript
interface Campaign {
  id: string;
  userId?: string;
  name: string;
  description: string;
  createdAt: string;
}
```

### `Tag`

```typescript
interface Tag {
  id: string;
  userId?: string;
  name: string;
  color: string;
}
```

### `TAG_COLORS`

Available tag colors: `gray`, `red`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`. Each has associated Tailwind CSS classes for background and text.
