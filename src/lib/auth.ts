import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { users, accounts, sessions, verificationTokens, accessRequests } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
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
    orderBy: (t) => desc(t.createdAt),
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
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            await db
              .update(users)
              .set({ apiKey: `key_${nanoid(32)}` })
              .where(eq(users.id, user.id));
            return;
          } catch (err) {
            console.error(`API key generation attempt ${attempt + 1} failed for user ${user.id}:`, err);
            if (attempt === 2) {
              console.error(`API key generation failed permanently for user ${user.id}. User will need manual key provisioning.`);
            }
          }
        }
      }
    },
  },
  callbacks: {
    async signIn({ user }) {
      try {
        const email = user.email;
        if (!email) return '/request-access';

        const approved = await isEmailApproved(email);
        if (!approved) {
          return '/request-access?blocked=1';
        }

        return true;
      } catch (err) {
        console.error('Sign-in approval check failed:', err);
        return '/request-access?error=auth_check_failed';
      }
    },
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
