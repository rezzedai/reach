import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { users, accounts, sessions, verificationTokens, accessRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { PersonaId } from '@/lib/sample-sequences';

// Emails that always have access regardless of access_requests table
const ADMIN_EMAILS = ['christianbourlier@gmail.com'];

// Auto-approved emails that bypass the access_requests table but are NOT admins
const WHITELISTED_EMAILS = ['rich@myinterviewcoach.co'];

const PERSONA_ACCESS: Record<string, PersonaId[]> = {
  'christianbourlier@gmail.com': ['three-bears', 'career-coach', 'employment-seeker'],
  'rich@myinterviewcoach.co': ['career-coach'],
};

export function getAllowedPersonas(email: string): PersonaId[] {
  return PERSONA_ACCESS[email] ?? ['three-bears'];
}

async function isEmailApproved(email: string): Promise<boolean> {
  if (ADMIN_EMAILS.includes(email)) return true;
  if (WHITELISTED_EMAILS.includes(email)) return true;

  const request = await db.query.accessRequests.findFirst({
    where: (t, { eq }) => eq(t.email, email),
  });

  return request?.status === 'approved';
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google],
  session: { strategy: 'database' },
  pages: { signIn: '/login' },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await db
          .update(users)
          .set({ apiKey: `key_${nanoid(32)}` })
          .where(eq(users.id, user.id));
      }
    },
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email;
      if (!email) return '/request-access';

      const approved = await isEmailApproved(email);
      if (!approved) {
        return '/request-access?blocked=1';
      }

      return true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
