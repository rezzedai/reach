import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByApiKey, createProspects, getProspects } from '@/lib/db/queries';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Preflight for Chrome extension CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

interface ConnectionPayload {
  name: string;
  title: string;
  url: string;
  connectedOn: string;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  };
}

function parseTitle(rawTitle: string): { jobTitle: string; company: string } {
  let jobTitle = rawTitle;
  let company = '';

  const atMatch = rawTitle.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
  if (atMatch) {
    jobTitle = atMatch[1];
    company = atMatch[2];
  } else if (rawTitle.includes(' | ')) {
    const pipeMatch = rawTitle.match(/^(.+?)\s*\|\s*(.+)$/);
    if (pipeMatch) {
      jobTitle = pipeMatch[1];
      company = pipeMatch[2];
    }
  }

  return { jobTitle, company };
}

/**
 * Authenticate via session (web) or API key (extension).
 * Returns the userId or null.
 */
async function resolveUserId(req: NextRequest): Promise<string | null> {
  // 1. Try API key from Authorization header (Chrome extension)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.slice(7);
    const user = await getUserByApiKey(apiKey);
    return user?.id ?? null;
  }

  // 2. Try session (web app)
  const session = await auth();
  return session?.user?.id ?? null;
}

// POST: Receive connections from the Chrome extension or web
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide a valid API key or sign in.' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const body = await req.json();
    const connections: ConnectionPayload[] = body.connections;

    if (!Array.isArray(connections) || connections.length === 0) {
      return NextResponse.json(
        { error: 'No connections provided' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Deduplicate against existing prospects by LinkedIn URL
    const existing = await getProspects(userId);
    const existingUrls = new Set(
      existing.map((p) => p.linkedinUrl).filter(Boolean)
    );

    const prospectData = connections
      .filter((conn) => !conn.url || !existingUrls.has(conn.url))
      .map((conn) => {
        const { firstName, lastName } = splitName(conn.name);
        const { jobTitle, company } = parseTitle(conn.title || '');

        return {
          firstName,
          lastName,
          title: jobTitle,
          company,
          companySize: '',
          industry: '',
          location: '',
          linkedinUrl: conn.url || '',
          connectedOn: conn.connectedOn || '',
          email: '',
          phone: '',
          notes: '',
          status: 'new' as const,
          importedAt: new Date().toISOString(),
        };
      });

    const duplicates = connections.length - prospectData.length;
    const created = prospectData.length > 0
      ? await createProspects(userId, prospectData)
      : [];

    return NextResponse.json({
      added: created.length,
      duplicates,
      message: `Imported ${created.length} connections.${duplicates > 0 ? ` ${duplicates} duplicates skipped.` : ''}`,
    }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
