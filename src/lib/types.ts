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
  email: string;
  phone: string;
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

export interface Campaign {
  id: string;
  userId?: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface ProspectCampaign {
  prospectId: string;
  campaignId: string;
}

export interface Tag {
  id: string;
  userId?: string;
  name: string;
  color: string;
}

export interface ProspectTag {
  prospectId: string;
  tagId: string;
}

export const TAG_COLORS = [
  { name: 'gray', bg: 'bg-gray-100', text: 'text-gray-800' },
  { name: 'red', bg: 'bg-red-100', text: 'text-red-800' },
  { name: 'orange', bg: 'bg-orange-100', text: 'text-orange-800' },
  { name: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { name: 'green', bg: 'bg-green-100', text: 'text-green-800' },
  { name: 'blue', bg: 'bg-blue-100', text: 'text-blue-800' },
  { name: 'purple', bg: 'bg-purple-100', text: 'text-purple-800' },
  { name: 'pink', bg: 'bg-pink-100', text: 'text-pink-800' },
] as const;

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
