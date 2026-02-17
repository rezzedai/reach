import { db } from '@/lib/db';
import { prospects, sequences, users, campaigns, prospectCampaigns } from './schema';
import { eq, and, inArray, lte, isNull, isNotNull, gte, sql } from 'drizzle-orm';
import type { Prospect, Sequence, MessageStatus } from '@/lib/types';

// ── Prospects ──

export async function getProspects(userId: string) {
  return db.select().from(prospects).where(eq(prospects.userId, userId));
}

export async function getProspectById(userId: string, id: string) {
  const rows = await db
    .select()
    .from(prospects)
    .where(and(eq(prospects.userId, userId), eq(prospects.id, id)));
  return rows[0] ?? null;
}

export async function createProspects(
  userId: string,
  data: Omit<Prospect, 'id'>[]
) {
  if (data.length === 0) return [];
  return db
    .insert(prospects)
    .values(
      data.map((p) => ({
        userId,
        firstName: p.firstName,
        lastName: p.lastName,
        title: p.title,
        company: p.company,
        companySize: p.companySize,
        industry: p.industry,
        location: p.location,
        linkedinUrl: p.linkedinUrl,
        connectedOn: p.connectedOn,
        notes: p.notes,
        status: p.status,
        importedAt: p.importedAt,
      }))
    )
    .returning();
}

export async function updateProspect(
  userId: string,
  id: string,
  data: Partial<Prospect>
) {
  const { id: _id, ...rest } = data;
  return db
    .update(prospects)
    .set(rest)
    .where(and(eq(prospects.userId, userId), eq(prospects.id, id)));
}

export async function updateProspectStatus(
  userId: string,
  ids: string[],
  status: Prospect['status']
) {
  if (ids.length === 0) return;
  return db
    .update(prospects)
    .set({ status })
    .where(and(eq(prospects.userId, userId), inArray(prospects.id, ids)));
}

export async function deleteProspects(userId: string, ids: string[]) {
  if (ids.length === 0) return;
  return db
    .delete(prospects)
    .where(and(eq(prospects.userId, userId), inArray(prospects.id, ids)));
}

// ── Sequences ──

export async function getSequences(userId: string) {
  return db.select().from(sequences).where(eq(sequences.userId, userId));
}

export async function getSequenceByProspectId(
  userId: string,
  prospectId: string
) {
  const rows = await db
    .select()
    .from(sequences)
    .where(
      and(eq(sequences.userId, userId), eq(sequences.prospectId, prospectId))
    );
  return rows[0] ?? null;
}

export async function createSequence(userId: string, data: Omit<Sequence, 'id'>) {
  // Upsert: replace existing sequence for same prospect
  await db
    .delete(sequences)
    .where(
      and(
        eq(sequences.userId, userId),
        eq(sequences.prospectId, data.prospectId)
      )
    );

  const rows = await db
    .insert(sequences)
    .values({
      userId,
      prospectId: data.prospectId,
      prospectName: data.prospectName,
      company: data.company,
      style: data.style,
      model: data.model,
      provider: data.provider,
      generatedAt: data.generatedAt,
      generationTime: data.generationTime,
      demo: data.demo ?? false,
      messages: data.messages,
    })
    .returning();

  return rows[0];
}

export async function createSequences(
  userId: string,
  data: Omit<Sequence, 'id'>[]
) {
  const results = [];
  for (const seq of data) {
    const row = await createSequence(userId, seq);
    results.push(row);
  }
  return results;
}

export async function deleteSequence(userId: string, id: string) {
  return db
    .delete(sequences)
    .where(and(eq(sequences.userId, userId), eq(sequences.id, id)));
}

// ── Dashboard ──

export async function getDashboardData(userId: string) {
  const allSequences = await db
    .select()
    .from(sequences)
    .where(eq(sequences.userId, userId));

  const allProspects = await db
    .select()
    .from(prospects)
    .where(eq(prospects.userId, userId));

  const prospectMap = new Map(allProspects.map((p) => [p.id, p]));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const readyToSend: { prospectId: string; name: string }[] = [];
  const followUpsDue: { prospectId: string; name: string; dueDate: string }[] = [];
  const awaitingResponse: { prospectId: string; name: string; sentAt: string }[] = [];
  const recentlyResponded: { prospectId: string; name: string; respondedAt: string }[] = [];

  let sentToday = 0;
  let totalSent = 0;
  let totalResponded = 0;

  for (const seq of allSequences) {
    const msgs = seq.messages as { day: number; type: string; subject: string | null; body: string; status?: string; sentAt?: string | null; respondedAt?: string | null }[];
    const prospect = prospectMap.get(seq.prospectId);
    if (!prospect) continue;

    const name = `${prospect.firstName} ${prospect.lastName}`.trim();

    // Count stats
    for (const m of msgs) {
      if (m.status === 'sent' || m.status === 'responded') {
        totalSent++;
        if (m.sentAt && new Date(m.sentAt) >= today) sentToday++;
      }
      if (m.status === 'responded') totalResponded++;
    }

    // Check first message pending = ready to send
    const firstMsg = msgs[0];
    if (firstMsg && (!firstMsg.status || firstMsg.status === 'pending')) {
      readyToSend.push({ prospectId: prospect.id, name });
    }

    // Follow-ups due
    if (prospect.nextFollowUpAt && new Date(prospect.nextFollowUpAt) <= now) {
      followUpsDue.push({
        prospectId: prospect.id,
        name,
        dueDate: prospect.nextFollowUpAt,
      });
    }

    // Awaiting response: has a sent message with no responded message after it
    const lastSent = [...msgs].reverse().find((m) => m.status === 'sent');
    if (lastSent && !msgs.some((m) => m.status === 'responded')) {
      awaitingResponse.push({
        prospectId: prospect.id,
        name,
        sentAt: lastSent.sentAt || '',
      });
    }

    // Recently responded
    const responded = msgs.filter(
      (m) => m.status === 'responded' && m.respondedAt && new Date(m.respondedAt) >= sevenDaysAgo
    );
    if (responded.length > 0) {
      recentlyResponded.push({
        prospectId: prospect.id,
        name,
        respondedAt: responded[responded.length - 1].respondedAt!,
      });
    }
  }

  const responseRate = totalSent > 0 ? Math.round((totalResponded / totalSent) * 100) : 0;

  return {
    stats: {
      activeSequences: allSequences.length,
      sentToday,
      responseRate,
    },
    readyToSend,
    followUpsDue,
    awaitingResponse,
    recentlyResponded,
  };
}

// ── Outreach Tracking ──

export async function updateMessageStatus(
  userId: string,
  sequenceId: string,
  messageIndex: number,
  status: MessageStatus
) {
  const rows = await db
    .select()
    .from(sequences)
    .where(and(eq(sequences.userId, userId), eq(sequences.id, sequenceId)));

  const seq = rows[0];
  if (!seq) return null;

  const messages = [...(seq.messages as Sequence['messages'])];
  const msg = messages[messageIndex];
  if (!msg) return null;

  const now = new Date().toISOString();
  msg.status = status;
  if (status === 'sent') msg.sentAt = now;
  if (status === 'responded') msg.respondedAt = now;

  await db
    .update(sequences)
    .set({ messages })
    .where(eq(sequences.id, sequenceId));

  // Update prospect timestamps
  const lastSent = messages
    .filter((m) => m.status === 'sent' || m.status === 'responded')
    .map((m) => m.sentAt)
    .filter(Boolean)
    .sort()
    .pop();

  const nextPending = messages.find((m) => !m.status || m.status === 'pending');
  let nextFollowUp: string | null = null;
  if (lastSent && nextPending) {
    const sentDate = new Date(lastSent);
    const daysUntilNext = nextPending.day - (msg.day || 0);
    sentDate.setDate(sentDate.getDate() + Math.max(daysUntilNext, 1));
    nextFollowUp = sentDate.toISOString();
  }

  await db
    .update(prospects)
    .set({
      lastContactedAt: lastSent || undefined,
      nextFollowUpAt: nextFollowUp,
    })
    .where(and(eq(prospects.userId, userId), eq(prospects.id, seq.prospectId)));

  return { ...seq, messages };
}

// ── Campaigns ──

export async function getCampaigns(userId: string) {
  return db.select().from(campaigns).where(eq(campaigns.userId, userId));
}

export async function createCampaign(
  userId: string,
  data: { name: string; description?: string }
) {
  const rows = await db
    .insert(campaigns)
    .values({
      userId,
      name: data.name,
      description: data.description || '',
    })
    .returning();
  return rows[0];
}

export async function updateCampaign(
  userId: string,
  id: string,
  data: { name?: string; description?: string }
) {
  return db
    .update(campaigns)
    .set(data)
    .where(and(eq(campaigns.userId, userId), eq(campaigns.id, id)));
}

export async function deleteCampaign(userId: string, id: string) {
  return db
    .delete(campaigns)
    .where(and(eq(campaigns.userId, userId), eq(campaigns.id, id)));
}

export async function addProspectsToCampaign(
  prospectIds: string[],
  campaignId: string
) {
  if (prospectIds.length === 0) return;
  const values = prospectIds.map((prospectId) => ({ prospectId, campaignId }));
  await db.insert(prospectCampaigns).values(values).onConflictDoNothing();
}

export async function removeProspectsFromCampaign(
  prospectIds: string[],
  campaignId: string
) {
  if (prospectIds.length === 0) return;
  await db
    .delete(prospectCampaigns)
    .where(
      and(
        inArray(prospectCampaigns.prospectId, prospectIds),
        eq(prospectCampaigns.campaignId, campaignId)
      )
    );
}

export async function getProspectCampaigns(userId: string) {
  return db
    .select({
      prospectId: prospectCampaigns.prospectId,
      campaignId: prospectCampaigns.campaignId,
      campaignName: campaigns.name,
    })
    .from(prospectCampaigns)
    .innerJoin(campaigns, eq(prospectCampaigns.campaignId, campaigns.id))
    .where(eq(campaigns.userId, userId));
}

// ── Users / API Keys ──

export async function getUserByApiKey(apiKey: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.apiKey, apiKey));
  return rows[0] ?? null;
}

export async function regenerateApiKey(userId: string) {
  const { nanoid } = await import('nanoid');
  const newKey = `key_${nanoid(32)}`;
  await db.update(users).set({ apiKey: newKey }).where(eq(users.id, userId));
  return newKey;
}

export async function getApiKey(userId: string) {
  const rows = await db
    .select({ apiKey: users.apiKey })
    .from(users)
    .where(eq(users.id, userId));
  return rows[0]?.apiKey ?? null;
}
