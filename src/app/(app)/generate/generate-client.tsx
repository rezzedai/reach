'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { sampleSequences } from '@/lib/sample-sequences';
import { fillTemplate } from '@/lib/templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Prospect, OutreachStyle, Sequence } from '@/lib/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { saveSequencesAction } from './actions';

interface GenerateClientProps {
  prospects: Prospect[];
}

function GenerateContent({ prospects }: GenerateClientProps) {
  const searchParams = useSearchParams();
  const preselectedIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];

  const [selected, setSelected] = useState<Set<string>>(new Set(preselectedIds));
  const [style, setStyle] = useState<OutreachStyle>('cold');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{
    success: Sequence[];
    errors: { prospectId: string; prospectName: string; error: string }[];
  } | null>(null);

  const selectedProspects = useMemo(
    () => prospects.filter((p) => selected.has(p.id)),
    [prospects, selected]
  );

  const toggleProspect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const findSampleSequence = (prospect: Prospect, outreachStyle: OutreachStyle): Sequence => {
    const match = sampleSequences.find((s) => {
      if (s.style !== outreachStyle) return false;
      if (s.industry !== '*' && s.industry.toLowerCase() !== prospect.industry.toLowerCase()) return false;
      if (s.titlePattern !== '.*' && !new RegExp(s.titlePattern, 'i').test(prospect.title)) return false;
      return true;
    });

    const template = match || sampleSequences.find((s) => s.style === outreachStyle) || sampleSequences[0];

    return {
      id: nanoid(10),
      prospectId: prospect.id,
      prospectName: `${prospect.firstName} ${prospect.lastName}`,
      company: prospect.company,
      style: outreachStyle,
      model: 'demo',
      provider: 'demo',
      generatedAt: new Date().toISOString(),
      generationTime: '0.1s',
      demo: true,
      messages: template.messages.map((m) => ({
        ...m,
        subject: m.subject ? fillTemplate(m.subject, prospect) : null,
        body: fillTemplate(m.body, prospect),
      })),
    };
  };

  const handleGenerate = async () => {
    if (selected.size === 0) {
      toast.error('Select at least one prospect');
      return;
    }

    setGenerating(true);
    setProgress({ current: 0, total: selectedProspects.length });
    setResults(null);

    try {
      const response = await fetch('/api/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospects: selectedProspects, style }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 500 && errorData.error?.includes('API key')) {
          toast.info('Using demo mode (no API key configured)');
          const demoSequences = selectedProspects.map((p) => findSampleSequence(p, style));
          await saveSequencesAction(
            demoSequences,
            demoSequences.map((s) => s.prospectId)
          );
          setResults({ success: demoSequences, errors: [] });
          return;
        }
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();
      if (data.results?.length > 0) {
        await saveSequencesAction(
          data.results,
          data.results.map((s: Sequence) => s.prospectId)
        );
      }
      setResults({ success: data.results || [], errors: data.errors || [] });

      if (data.results?.length > 0) {
        toast.success(`Generated ${data.results.length} sequence(s)`);
      }
      if (data.errors?.length > 0) {
        toast.error(`${data.errors.length} failed`);
      }
    } catch {
      toast.info('Using demo mode');
      const demoSequences = selectedProspects.map((p) => findSampleSequence(p, style));
      await saveSequencesAction(
        demoSequences,
        demoSequences.map((s) => s.prospectId)
      );
      setResults({ success: demoSequences, errors: [] });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generate Sequences</h1>
        <p className="text-sm text-muted-foreground">
          Select prospects and generate personalized outreach sequences
        </p>
      </div>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Generation Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.success.length > 0 && (
              <div className="space-y-2">
                {results.success.map((seq) => (
                  <div key={seq.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{seq.prospectName}</p>
                      <p className="text-sm text-muted-foreground">
                        {seq.messages.length} messages, {seq.style} style
                        {seq.demo && ' (demo)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{seq.generationTime}</Badge>
                      <Link href={`/prospects/${seq.prospectId}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {results.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">
                  {results.errors.length} failed:
                </p>
                {results.errors.map((err) => (
                  <div key={err.prospectId} className="flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span>{err.prospectName}: {err.error}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Link href="/sequences">
                <Button>View All Sequences</Button>
              </Link>
              <Button variant="outline" onClick={() => { setResults(null); setSelected(new Set()); }}>
                Generate More
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!results && (
        <>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium">Outreach Style</label>
              <Select value={style} onValueChange={(v) => setStyle(v as OutreachStyle)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold">Cold Outreach</SelectItem>
                  <SelectItem value="warm">Warm Outreach</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1" />
            <div className="text-sm text-muted-foreground">
              {selected.size} prospect{selected.size !== 1 ? 's' : ''} selected
            </div>
            <Button onClick={handleGenerate} disabled={generating || selected.size === 0}>
              <Sparkles className="mr-2 h-4 w-4" />
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </div>

          {generating && (
            <div className="space-y-2">
              <Progress value={undefined} className="animate-pulse" />
              <p className="text-sm text-muted-foreground">
                Generating sequences for {progress.total} prospect{progress.total !== 1 ? 's' : ''}...
              </p>
            </div>
          )}

          {prospects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="mb-2 font-medium">No prospects</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Import prospects first before generating sequences
                </p>
                <Link href="/prospects">
                  <Button>Go to Prospects</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected(new Set(prospects.map((p) => p.id)))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </Button>
              </div>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {prospects.map((prospect) => (
                  <div
                    key={prospect.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${
                      selected.has(prospect.id) ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                    }`}
                    onClick={() => toggleProspect(prospect.id)}
                  >
                    <Checkbox checked={selected.has(prospect.id)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {prospect.firstName} {prospect.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {prospect.title}
                        {prospect.company ? ` at ${prospect.company}` : ''}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {prospect.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function GenerateClient({ prospects }: GenerateClientProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Loading...</p></div>}>
      <GenerateContent prospects={prospects} />
    </Suspense>
  );
}
