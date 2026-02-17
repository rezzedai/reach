import Papa from 'papaparse';
import { nanoid } from 'nanoid';
import type { Prospect } from './types';

const COLUMN_MAP: Record<string, keyof Prospect> = {
  'first name': 'firstName',
  'last name': 'lastName',
  'title': 'title',
  'job title': 'title',
  'company': 'company',
  'company name': 'company',
  'company size': 'companySize',
  '# of employees': 'companySize',
  'number of employees': 'companySize',
  'industry': 'industry',
  'location': 'location',
  'geography': 'location',
  'linkedin url': 'linkedinUrl',
  'profile url': 'linkedinUrl',
  'linkedin profile url': 'linkedinUrl',
  'url': 'linkedinUrl',
  'connected on': 'connectedOn',
  'connection date': 'connectedOn',
  'email': 'email',
  'email address': 'email',
  'e-mail': 'email',
  'phone': 'phone',
  'phone number': 'phone',
  'mobile': 'phone',
  'notes': 'notes',
};

// Known LinkedIn export headers (normalized)
const LINKEDIN_HEADERS = ['first name', 'last name', 'url', 'connected on'];

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/['"]/g, '');
}

function mapRow(row: Record<string, string>, headerMap: Record<string, keyof Prospect>): Prospect {
  const prospect: Prospect = {
    id: nanoid(10),
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    companySize: '',
    industry: '',
    location: '',
    linkedinUrl: '',
    connectedOn: '',
    email: '',
    phone: '',
    notes: '',
    status: 'new',
    importedAt: new Date().toISOString(),
  };

  for (const [csvHeader, value] of Object.entries(row)) {
    const normalized = normalizeHeader(csvHeader);
    const fieldName = headerMap[normalized];
    if (fieldName && value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prospect as any)[fieldName] = value.trim();
    }
  }

  return prospect;
}

/** The mappable prospect fields for generic CSV import */
export const MAPPABLE_FIELDS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'title', label: 'Title' },
  { key: 'company', label: 'Company' },
  { key: 'companySize', label: 'Company Size' },
  { key: 'industry', label: 'Industry' },
  { key: 'location', label: 'Location' },
  { key: 'linkedinUrl', label: 'LinkedIn URL' },
  { key: 'connectedOn', label: 'Connected On' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'notes', label: 'Notes' },
] as const;

export type MappableField = (typeof MAPPABLE_FIELDS)[number]['key'];

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
}

/** Parse raw CSV content into headers + rows without mapping */
export function parseCSVRaw(content: string): ParsedCSV {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  if (result.data.length === 0) {
    throw new Error('No records found in CSV file');
  }

  return {
    headers: Object.keys(result.data[0]),
    rows: result.data,
  };
}

/** Detect if the CSV is a LinkedIn export by checking for known headers */
export function isLinkedInFormat(headers: string[]): boolean {
  const normalized = headers.map(normalizeHeader);
  return LINKEDIN_HEADERS.every((h) => normalized.includes(h));
}

/** Auto-suggest column mappings based on header names */
export function suggestMappings(headers: string[]): Record<string, MappableField | ''> {
  const mappings: Record<string, MappableField | ''> = {};
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    const field = COLUMN_MAP[normalized];
    mappings[header] = (field as MappableField) || '';
  }
  return mappings;
}

/** Apply user-defined column mappings to raw rows and produce Prospect[] */
export function applyMappings(
  rows: Record<string, string>[],
  mappings: Record<string, MappableField | ''>
): Prospect[] {
  // Build a header→field map from the user mappings
  const headerMap: Record<string, keyof Prospect> = {};
  for (const [header, field] of Object.entries(mappings)) {
    if (field) {
      headerMap[normalizeHeader(header)] = field;
    }
  }

  return rows
    .map((row) => mapRow(row, headerMap))
    .filter((p) => p.firstName || p.lastName);
}

export function parseCSVString(content: string): Prospect[] {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  if (result.data.length === 0) {
    throw new Error('No records found in CSV file');
  }

  const csvHeaders = Object.keys(result.data[0]);
  const headerMap: Record<string, keyof Prospect> = {};
  for (const header of csvHeaders) {
    const normalized = normalizeHeader(header);
    if (COLUMN_MAP[normalized]) {
      headerMap[normalized] = COLUMN_MAP[normalized];
    }
  }

  return result.data
    .map((row) => mapRow(row, headerMap))
    .filter((p) => p.firstName && p.lastName);
}

export function deduplicateProspects(
  existing: Prospect[],
  newProspects: Prospect[]
): { added: Prospect[]; duplicates: Prospect[] } {
  const added: Prospect[] = [];
  const duplicates: Prospect[] = [];

  for (const prospect of newProspects) {
    const isDuplicate = existing.some(
      (p) =>
        p.firstName.toLowerCase() === prospect.firstName.toLowerCase() &&
        p.lastName.toLowerCase() === prospect.lastName.toLowerCase() &&
        p.company.toLowerCase() === prospect.company.toLowerCase()
    );
    if (isDuplicate) {
      duplicates.push(prospect);
    } else {
      added.push(prospect);
    }
  }

  return { added, duplicates };
}
