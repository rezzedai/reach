'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Copy, ExternalLink, Sparkles, Send, MessageCircle, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import { updateProspectAction, updateMessageStatusAction } from '../actions';
import type { ProspectStatus, MessageStatus } from '@/lib/types';

const STATUS_COLORS: Record<ProspectStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  enriched: 'bg-purple-100 text-purple-800',
  sequenced: 'bg-green-100 text-green-800',
  contacted: 'bg-orange-100 text-orange-800',
};

const TYPE_LABELS: Record<string, string> = {
  connection_request: 'Connection Request',
  follow_up_1: 'Follow-up 1',
  follow_up_2: 'Follow-up 2',
  break_up: 'Break-up',
  re_engagement: 'Re-engagement',
  value_add: 'Value Add',
  offer: 'Offer',
  soft_close: 'Soft Close',
  referral_intro: 'Referral Intro',
  value_cta: 'Value + CTA',
  gentle_follow_up: 'Follow-up',
};

const MSG_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  responded: 'bg-green-100 text-green-800',
  skipped: 'bg-yellow-100 text-yellow-800',
};

interface ProspectDetailClientProps {
  prospect: {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    company: string;
    industry: string;
    location: string;
    linkedinUrl: string;
    notes: string;
    status: string;
  };
  sequence: {
    id: string;
    style: string;
    generationTime: string;
    prospectId: string;
    messages: { day: number; type: string; subject: string | null; body: string; status?: MessageStatus; sentAt?: string | null; respondedAt?: string | null }[];
  } | null;
}

export function ProspectDetailClient({ prospect, sequence }: ProspectDetailClientProps) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (field: string, value: string) => {
    startTransition(async () => {
      await updateProspectAction(prospect.id, { [field]: value });
    });
  };

  const copyMessage = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success('Copied to clipboard');
  };

  const handleMessageStatus = (messageIndex: number, status: MessageStatus) => {
    if (!sequence) return;
    startTransition(async () => {
      await updateMessageStatusAction(sequence.id, messageIndex, status);
      toast.success(`Message marked as ${status}`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/prospects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {prospect.firstName} {prospect.lastName}
          </h1>
          <p className="text-muted-foreground">
            {prospect.title}
            {prospect.company ? ` at ${prospect.company}` : ''}
          </p>
        </div>
        <Badge variant="secondary" className={STATUS_COLORS[prospect.status as ProspectStatus]}>
          {prospect.status}
        </Badge>
        {prospect.linkedinUrl && (
          <a href={prospect.linkedinUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-1 h-4 w-4" />
              LinkedIn
            </Button>
          </a>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name</Label>
                <Input
                  defaultValue={prospect.firstName}
                  onBlur={(e) => handleUpdate('firstName', e.target.value)}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  defaultValue={prospect.lastName}
                  onBlur={(e) => handleUpdate('lastName', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                defaultValue={prospect.title}
                onBlur={(e) => handleUpdate('title', e.target.value)}
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                defaultValue={prospect.company}
                onBlur={(e) => handleUpdate('company', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Industry</Label>
                <Input
                  defaultValue={prospect.industry}
                  onBlur={(e) => handleUpdate('industry', e.target.value)}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  defaultValue={prospect.location}
                  onBlur={(e) => handleUpdate('location', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>LinkedIn URL</Label>
              <Input
                defaultValue={prospect.linkedinUrl}
                onBlur={(e) => handleUpdate('linkedinUrl', e.target.value)}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                defaultValue={prospect.notes}
                onBlur={(e) => handleUpdate('notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {sequence ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Sequence</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{sequence.style}</Badge>
                  <span>{sequence.generationTime}</span>
                </div>
              </div>
              {sequence.messages.map((msg, i) => {
                const msgStatus = msg.status || 'pending';
                return (
                  <Card key={i}>
                    <CardContent className="pt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Day {msg.day}</Badge>
                          <span className="text-sm font-medium">
                            {TYPE_LABELS[msg.type] || msg.type}
                          </span>
                          <Badge variant="secondary" className={MSG_STATUS_COLORS[msgStatus]}>
                            {msgStatus}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {msgStatus === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMessageStatus(i, 'sent')}
                                disabled={isPending}
                                title="Mark as sent"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMessageStatus(i, 'skipped')}
                                disabled={isPending}
                                title="Skip"
                              >
                                <SkipForward className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {msgStatus === 'sent' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMessageStatus(i, 'responded')}
                              disabled={isPending}
                              title="Mark as responded"
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyMessage(msg.body)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {msg.sentAt && (
                        <p className="mb-1 text-xs text-muted-foreground">
                          Sent: {new Date(msg.sentAt).toLocaleDateString()}
                        </p>
                      )}
                      {msg.respondedAt && (
                        <p className="mb-1 text-xs text-muted-foreground">
                          Responded: {new Date(msg.respondedAt).toLocaleDateString()}
                        </p>
                      )}
                      {msg.subject && (
                        <p className="mb-1 text-sm font-medium text-muted-foreground">
                          Subject: {msg.subject}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap text-sm">{msg.body}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="mb-3 text-muted-foreground">No sequence generated yet</p>
                <Link href={`/generate?ids=${prospect.id}`}>
                  <Button>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Sequence
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
