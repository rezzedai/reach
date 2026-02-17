'use server';

import { db } from '@/lib/db';
import { accessRequests } from '@/lib/db/schema';
import { Resend } from 'resend';

const ADMIN_EMAIL = 'rezzed.dev@gmail.com';

export async function submitAccessRequest(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const reason = (formData.get('reason') as string)?.trim();

  if (!name || !email || !reason) {
    return { success: false, error: 'All fields are required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    // Check if this email already has a request
    const existing = await db.query.accessRequests.findFirst({
      where: (t, { eq }) => eq(t.email, email),
    });

    if (existing) {
      if (existing.status === 'approved') {
        return { success: false, error: 'This email already has access. Please sign in.' };
      }
      if (existing.status === 'pending') {
        return { success: false, error: 'A request for this email is already pending.' };
      }
      // denied — allow re-request
    }

    await db.insert(accessRequests).values({ name, email, reason });

    // Send notification email to admin
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Reach Access Requests <noreply@rezzed.dev>',
        to: ADMIN_EMAIL,
        subject: `New access request from ${name}`,
        html: `
          <h2>New Access Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Reason:</strong></p>
          <p>${reason.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><a href="${process.env.NEXTAUTH_URL || 'https://reach.rezzed.dev'}/admin/access-requests">Review in Admin Panel</a></p>
        `,
      });
    }

    return { success: true };
  } catch (err) {
    console.error('Access request error:', err);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
