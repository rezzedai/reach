CREATE TABLE "accounts" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "prospects" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"firstName" text DEFAULT '' NOT NULL,
	"lastName" text DEFAULT '' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"companySize" text DEFAULT '' NOT NULL,
	"industry" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"linkedinUrl" text DEFAULT '' NOT NULL,
	"connectedOn" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"importedAt" timestamp NOT NULL,
	"lastContactedAt" timestamp,
	"nextFollowUpAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "sequences" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"prospectId" text NOT NULL,
	"prospectName" text DEFAULT '' NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"style" text DEFAULT 'cold' NOT NULL,
	"model" text DEFAULT '' NOT NULL,
	"provider" text DEFAULT '' NOT NULL,
	"generatedAt" text NOT NULL,
	"generationTime" text DEFAULT '' NOT NULL,
	"demo" boolean DEFAULT false NOT NULL,
	"messages" jsonb NOT NULL,
	CONSTRAINT "sequences_prospectId_unique" UNIQUE("prospectId")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"apiKey" text,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_apiKey_unique" UNIQUE("apiKey")
);
--> statement-breakpoint
CREATE TABLE "verificationTokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationTokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequences" ADD CONSTRAINT "sequences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequences" ADD CONSTRAINT "sequences_prospectId_prospects_id_fk" FOREIGN KEY ("prospectId") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;