import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Lightweight cookie check only — no DB call.
  // Full session verification happens in getRequiredUser() on server components.
  const hasSession =
    request.cookies.has('authjs.session-token') ||
    request.cookies.has('__Secure-authjs.session-token');

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login
     * - /api/auth (NextAuth routes)
     * - /api/import-connections (Chrome extension — uses API key auth)
     * - /api/health
     * - /_next (Next.js internals)
     * - /favicon.ico, /icon*, /apple-icon* (static assets)
     */
    '/((?!login|api/auth|api/import-connections|api/health|_next|favicon\\.ico|icon|apple-icon).*)',
  ],
};
