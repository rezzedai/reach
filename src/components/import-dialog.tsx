'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, FileUp, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  parseCSVString,
  parseCSVRaw,
  isLinkedInFormat,
  suggestMappings,
  applyMappings,
  deduplicateProspects,
  MAPPABLE_FIELDS,
} from '@/lib/csv-parser';
import type { MappableField, ParsedCSV } from '@/lib/csv-parser';
import type { Prospect } from '@/lib/types';
import { toast } from 'sonner';

type Step = 'upload' | 'mapping' | 'preview';

interface ImportDialogProps {
  existingProspects: Prospect[];
  onImport: (prospects: Prospect[]) => void;
}

export function ImportDialog({ existingProspects, onImport }: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
  const [mappings, setMappings] = useState<Record<string, MappableField | ''>>({});
  const [previewData, setPreviewData] = useState<Prospect[]>([]);

  const reset = () => {
    setStep('upload');
    setParsedCSV(null);
    setMappings({});
    setPreviewData([]);
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) reset();
  };

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const raw = parseCSVRaw(content);

          if (isLinkedInFormat(raw.headers)) {
            // LinkedIn format — auto-import like before
            const parsed = parseCSVString(content);
            const { added, duplicates } = deduplicateProspects(existingProspects, parsed);

            if (added.length === 0) {
              toast.info('No new prospects', {
                description: `${duplicates.length} duplicate(s) skipped.`,
              });
              return;
            }

            onImport(added);
            setOpen(false);
            reset();

            const msg = duplicates.length > 0
              ? `${added.length} imported, ${duplicates.length} duplicates skipped`
              : `${added.length} prospects imported`;
            toast.success('Import complete', { description: msg });
          } else {
            // Generic CSV — show mapping step
            setParsedCSV(raw);
            setMappings(suggestMappings(raw.headers));
            setStep('mapping');
          }
        } catch (err) {
          toast.error('Import failed', {
            description: err instanceof Error ? err.message : 'Could not parse CSV',
          });
        }
      };
      reader.readAsText(file);
    },
    [existingProspects, onImport]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const updateMapping = (header: string, field: MappableField | '') => {
    setMappings((prev) => ({ ...prev, [header]: field }));
  };

  const hasMappedName = Object.values(mappings).includes('firstName') || Object.values(mappings).includes('lastName');

  const handleGoToPreview = () => {
    if (!parsedCSV) return;
    const mapped = applyMappings(parsedCSV.rows, mappings);
    setPreviewData(mapped);
    setStep('preview');
  };

  const handleImportMapped = () => {
    const { added, duplicates } = deduplicateProspects(existingProspects, previewData);

    if (added.length === 0) {
      toast.info('No new prospects', {
        description: `${duplicates.length} duplicate(s) skipped.`,
      });
      return;
    }

    onImport(added);
    setOpen(false);
    reset();

    const msg = duplicates.length > 0
      ? `${added.length} imported, ${duplicates.length} duplicates skipped`
      : `${added.length} prospects imported`;
    toast.success('Import complete', { description: msg });
  };

  // Fields already assigned to another header
  const usedFields = new Set(Object.values(mappings).filter(Boolean));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className={step === 'upload' ? 'sm:max-w-md' : 'sm:max-w-2xl'}>
        {step === 'upload' && (
          <>
            <DialogHeader>
              <DialogTitle>Import Prospects</DialogTitle>
              <DialogDescription>
                Upload a CSV from Sales Navigator, LinkedIn data export, or any spreadsheet.
                LinkedIn exports are auto-detected. Other CSVs get a column mapping step.
              </DialogDescription>
            </DialogHeader>
            <div
              className={`flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <FileUp className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop a CSV file, or click to browse
              </p>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
                onChange={handleFileInput}
              />
              <Button variant="outline" asChild>
                <label htmlFor="csv-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Supported: LinkedIn exports (auto-mapped), or any CSV with name/company columns.
              Duplicates are automatically detected.
            </p>
          </>
        )}

        {step === 'mapping' && parsedCSV && (
          <>
            <DialogHeader>
              <DialogTitle>Map Columns</DialogTitle>
              <DialogDescription>
                Map your CSV columns to prospect fields. At least First Name or Last Name is required.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {parsedCSV.headers.map((header) => {
                const currentValue = mappings[header] || '';
                return (
                  <div key={header} className="flex items-center gap-3">
                    <span className="w-40 truncate text-sm font-medium" title={header}>
                      {header}
                    </span>
                    <span className="text-muted-foreground text-sm">&rarr;</span>
                    <Select
                      value={currentValue || 'skip'}
                      onValueChange={(v) => updateMapping(header, v === 'skip' ? '' : v as MappableField)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip (don&apos;t import)</SelectItem>
                        {MAPPABLE_FIELDS.map((f) => (
                          <SelectItem
                            key={f.key}
                            value={f.key}
                            disabled={usedFields.has(f.key) && currentValue !== f.key}
                          >
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={parsedCSV.rows[0]?.[header] ?? ''}>
                      {parsedCSV.rows[0]?.[header] ?? ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={reset}>
                <ArrowLeft className="mr-1 h-3 w-3" />
                Back
              </Button>
              <Button size="sm" onClick={handleGoToPreview} disabled={!hasMappedName}>
                Preview
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <DialogHeader>
              <DialogTitle>Preview Import</DialogTitle>
              <DialogDescription>
                {previewData.length} prospect{previewData.length !== 1 ? 's' : ''} will be imported. Showing first 5 rows.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[350px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 5).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{`${p.firstName} ${p.lastName}`.trim() || '\u2014'}</TableCell>
                      <TableCell>{p.title || '\u2014'}</TableCell>
                      <TableCell>{p.company || '\u2014'}</TableCell>
                      <TableCell>{p.email || '\u2014'}</TableCell>
                      <TableCell>{p.location || '\u2014'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep('mapping')}>
                <ArrowLeft className="mr-1 h-3 w-3" />
                Back to Mapping
              </Button>
              <Button size="sm" onClick={handleImportMapped}>
                Import {previewData.length} Prospect{previewData.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
