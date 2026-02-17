'use server';

import { db } from '@/lib/db';
import { accessRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';

const APP_URL = process.env.NEXTAUTH_URL || 'https://reach.rezzed.dev';

export async function approveRequest(id: string, email: string, name: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(accessRequests)
      .set({ status: 'approved', reviewedAt: new Date().toISOString() })
      .where(eq(accessRequests.id, id));

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Reach <noreply@rezzed.dev>',
        to: email,
        subject: 'Your Reach access has been approved',
        html: `
          <h2>Welcome to Reach, ${name}!</h2>
          <p>Your access request has been approved. You can now sign in and start using Reach.</p>
          <p>
            <a href="${APP_URL}/login" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">
              Sign In to Reach
            </a>
          </p>
          <p>If you have any questions, just reply to this email.</p>
        `,
      });
    }

    revalidatePath('/admin/access-requests');
    return { success: true };
  } catch (err) {
    console.error('Approve request error:', err);
    return { success: false, error: 'Failed to approve request.' };
  }
}

export async function denyRequest(id: string, email: string, name: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(accessRequests)
      .set({ status: 'denied', reviewedAt: new Date().toISOString() })
      .where(eq(accessRequests.id, id));

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Reach <noreply@rezzed.dev>',
        to: email,
        subject: 'Your Reach access request',
        html: `
          <h2>Hi ${name},</h2>
          <p>Thank you for your interest in Reach. Unfortunately, we're not able to approve your access request at this time.</p>
          <p>We're carefully managing early access to ensure the best experience for our users. We may reach out in the future as we expand.</p>
          <p>Thank you for understanding.</p>
        `,
      });
    }

    revalidatePath('/admin/access-requests');
    return { success: true };
  } catch (err) {
    console.error('Deny request error:', err);
    return { success: false, error: 'Failed to deny request.' };
  }
}
