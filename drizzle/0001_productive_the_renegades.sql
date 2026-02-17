CREATE TABLE "access_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp NOT NULL,
	"reviewedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospect_campaigns" (
	"prospectId" text NOT NULL,
	"campaignId" text NOT NULL,
	CONSTRAINT "prospect_campaigns_prospectId_campaignId_pk" PRIMARY KEY("prospectId","campaignId")
);
--> statement-breakpoint
CREATE TABLE "prospect_tags" (
	"prospectId" text NOT NULL,
	"tagId" text NOT NULL,
	CONSTRAINT "prospect_tags_prospectId_tagId_pk" PRIMARY KEY("prospectId","tagId")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT 'gray' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "email" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "phone" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_campaigns" ADD CONSTRAINT "prospect_campaigns_prospectId_prospects_id_fk" FOREIGN KEY ("prospectId") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_campaigns" ADD CONSTRAINT "prospect_campaigns_campaignId_campaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_tags" ADD CONSTRAINT "prospect_tags_prospectId_prospects_id_fk" FOREIGN KEY ("prospectId") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_tags" ADD CONSTRAINT "prospect_tags_tagId_tags_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;