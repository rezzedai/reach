export type ProspectStatus = 'new' | 'enriched' | 'sequenced' | 'contacted';
export type OutreachStyle = 'cold' | 'warm' | 'referral';

export interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  companySize: string;
  industry: string;
  location: string;
  linkedinUrl: string;
  connectedOn: string;
  notes: string;
  status: ProspectStatus;
  importedAt: string;
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
}

export type MessageStatus = 'pending' | 'sent' | 'responded' | 'skipped';

export interface Message {
  day: number;
  type: string;
  subject: string | null;
  body: string;
  status?: MessageStatus;
  sentAt?: string | null;
  respondedAt?: string | null;
}

export interface Sequence {
  id: string;
  prospectId: string;
  prospectName: string;
  company: string;
  style: OutreachStyle;
  model: string;
  provider: string;
  generatedAt: string;
  generationTime: string;
  demo?: boolean;
  messages: Message[];
}
