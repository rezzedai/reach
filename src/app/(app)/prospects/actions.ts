'use server';

import { revalidatePath } from 'next/cache';
import { getRequiredUser } from '@/lib/db/helpers';
import {
  createProspects,
  updateProspect,
  updateProspectStatus,
  deleteProspects,
  updateMessageStatus,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addProspectsToCampaign,
  removeProspectsFromCampaign,
  createTag,
  deleteTag,
  addTagToProspects,
  removeTagFromProspects,
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

export async function createCampaignAction(name: string, description?: string) {
  const user = await getRequiredUser();
  const campaign = await createCampaign(user.id!, { name, description });
  revalidatePath('/prospects');
  return campaign;
}

export async function updateCampaignAction(id: string, data: { name?: string; description?: string }) {
  const user = await getRequiredUser();
  await updateCampaign(user.id!, id, data);
  revalidatePath('/prospects');
}

export async function deleteCampaignAction(id: string) {
  const user = await getRequiredUser();
  await deleteCampaign(user.id!, id);
  revalidatePath('/prospects');
}

export async function addToCampaignAction(prospectIds: string[], campaignId: string) {
  await addProspectsToCampaign(prospectIds, campaignId);
  revalidatePath('/prospects');
}

export async function removeFromCampaignAction(prospectIds: string[], campaignId: string) {
  await removeProspectsFromCampaign(prospectIds, campaignId);
  revalidatePath('/prospects');
}

export async function createTagAction(name: string, color: string) {
  const user = await getRequiredUser();
  const tag = await createTag(user.id!, { name, color });
  revalidatePath('/prospects');
  return tag;
}

export async function deleteTagAction(id: string) {
  const user = await getRequiredUser();
  await deleteTag(user.id!, id);
  revalidatePath('/prospects');
}

export async function addTagAction(prospectIds: string[], tagId: string) {
  await addTagToProspects(prospectIds, tagId);
  revalidatePath('/prospects');
}

export async function removeTagAction(prospectIds: string[], tagId: string) {
  await removeTagFromProspects(prospectIds, tagId);
  revalidatePath('/prospects');
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
