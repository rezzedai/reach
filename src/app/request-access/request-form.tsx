'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitAccessRequest } from './actions';
import { CheckCircle } from 'lucide-react';

interface RequestFormProps {
  isBlocked?: boolean;
}

export function RequestForm({ isBlocked }: RequestFormProps) {
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const result = await submitAccessRequest(formData);

    setPending(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error ?? 'Something went wrong.');
    }
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
          <h2 className="mb-2 text-xl font-semibold">Request submitted</h2>
          <p className="text-sm text-muted-foreground">
            Your request has been submitted. You&apos;ll hear back within 24 hours.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Request Access</CardTitle>
        {isBlocked ? (
          <CardDescription className="text-amber-600">
            Your email doesn&apos;t have access yet. Submit a request below and we&apos;ll review it within 24 hours.
          </CardDescription>
        ) : (
          <CardDescription>
            Reach is currently invite-only. Tell us a bit about yourself and we&apos;ll get back to you within 24 hours.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Your full name" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reason">How do you plan to use Reach?</Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder="Tell us about your use case..."
              rows={4}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Submitting...' : 'Request Access'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
