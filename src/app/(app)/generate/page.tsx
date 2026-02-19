import { getRequiredUser } from '@/lib/db/helpers';
import { getProspects } from '@/lib/db/queries';
import { getAllowedPersonas } from '@/lib/auth';
import { GenerateClient } from './generate-client';

export default async function GeneratePage() {
  const user = await getRequiredUser();
  const prospects = await getProspects(user.id!);
  const allowedPersonas = getAllowedPersonas(user.email ?? '');
  return <GenerateClient prospects={prospects} allowedPersonas={allowedPersonas} />;
}
