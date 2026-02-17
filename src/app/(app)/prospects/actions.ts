'use server';

import { revalidatePath } from 'next/cache';
import { getRequiredUser } from '@/lib/db/helpers';
import {
  createProspects,
  updateProspect,
  updateProspectStatus,
  deleteProspects,
  updateMessageStatus,
} from '@/lib/db/queries';
import type { Prospect, ProspectStatus, MessageStatus } from '@/lib/types';

export async function addProspectsAction(data: Omit<Prospect, 'id'>[]) {
  const user = await getRequiredUser();
  await createProspects(user.id!, data);
  revalidatePath('/prospects');
  revalidatePath('/');
}

export async function updateProspectAction(
  id: string,
  data: Partial<Prospect>
) {
  const user = await getRequiredUser();
  await updateProspect(user.id!, id, data);
  revalidatePath(`/prospects/${id}`);
  revalidatePath('/prospects');
}

export async function updateStatusAction(ids: string[], status: ProspectStatus) {
  const user = await getRequiredUser();
  await updateProspectStatus(user.id!, ids, status);
  revalidatePath('/prospects');
  revalidatePath('/');
}

export async function deleteProspectsAction(ids: string[]) {
  const user = await getRequiredUser();
  await deleteProspects(user.id!, ids);
  revalidatePath('/prospects');
  revalidatePath('/');
}

export async function updateMessageStatusAction(
  sequenceId: string,
  messageIndex: number,
  status: MessageStatus
) {
  const user = await getRequiredUser();
  const result = await updateMessageStatus(user.id!, sequenceId, messageIndex, status);
  if (!result) throw new Error('Sequence or message not found');
  revalidatePath(`/prospects/${result.prospectId}`);
  revalidatePath('/prospects');
  revalidatePath('/dashboard');
  return result;
}
