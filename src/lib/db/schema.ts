import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  primaryKey,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';
import { nanoid } from 'nanoid';

// ── Auth.js standard tables ──

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid(21)),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  apiKey: text('apiKey').unique(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationTokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ── App tables ──

export const prospects = pgTable('prospects', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid(10)),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  firstName: text('firstName').notNull().default(''),
  lastName: text('lastName').notNull().default(''),
  title: text('title').notNull().default(''),
  company: text('company').notNull().default(''),
  companySize: text('companySize').notNull().default(''),
  industry: text('industry').notNull().default(''),
  location: text('location').notNull().default(''),
  linkedinUrl: text('linkedinUrl').notNull().default(''),
  connectedOn: text('connectedOn').notNull().default(''),
  notes: text('notes').notNull().default(''),
  status: text('status', {
    enum: ['new', 'enriched', 'sequenced', 'contacted'],
  })
    .notNull()
    .default('new'),
  importedAt: timestamp('importedAt', { mode: 'string' })
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  lastContactedAt: timestamp('lastContactedAt', { mode: 'string' }),
  nextFollowUpAt: timestamp('nextFollowUpAt', { mode: 'string' }),
});

export const sequences = pgTable('sequences', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid(10)),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  prospectId: text('prospectId')
    .notNull()
    .references(() => prospects.id, { onDelete: 'cascade' })
    .unique(),
  prospectName: text('prospectName').notNull().default(''),
  company: text('company').notNull().default(''),
  style: text('style', { enum: ['cold', 'warm', 'referral'] })
    .notNull()
    .default('cold'),
  model: text('model').notNull().default(''),
  provider: text('provider').notNull().default(''),
  generatedAt: text('generatedAt')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  generationTime: text('generationTime').notNull().default(''),
  demo: boolean('demo').notNull().default(false),
  messages: jsonb('messages').$type<
    { day: number; type: string; subject: string | null; body: string; status?: 'pending' | 'sent' | 'responded' | 'skipped'; sentAt?: string | null; respondedAt?: string | null }[]
  >().notNull(),
});
