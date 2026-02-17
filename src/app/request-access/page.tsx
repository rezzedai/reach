import { RequestForm } from './request-form';

interface Props {
  searchParams: Promise<{ blocked?: string }>;
}

export default async function RequestAccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const isBlocked = params.blocked === '1';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <RequestForm isBlocked={isBlocked} />
    </div>
  );
}
