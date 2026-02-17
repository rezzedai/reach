import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { accessRequests } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { AccessRequestsClient } from './access-requests-client';

const ADMIN_EMAILS = ['christianbourlier@gmail.com'];

export default async function AdminAccessRequestsPage() {
  const session = await auth();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect('/');
  }

  const requests = await db
    .select()
    .from(accessRequests)
    .orderBy(desc(accessRequests.createdAt));

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Access Requests</h1>
        <p className="text-sm text-muted-foreground">
          Review and manage access requests for Reach.
        </p>
      </div>
      <AccessRequestsClient requests={requests as Parameters<typeof AccessRequestsClient>[0]['requests']} />
    </div>
  );
}
