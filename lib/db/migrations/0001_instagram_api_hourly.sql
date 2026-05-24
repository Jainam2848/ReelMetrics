CREATE TABLE IF NOT EXISTS "instagram_api_hourly" (
	"account_id" uuid NOT NULL,
	"hour_bucket" text NOT NULL,
	"call_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instagram_api_hourly_account_id_hour_bucket_pk" PRIMARY KEY("account_id","hour_bucket")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instagram_api_hourly" ADD CONSTRAINT "instagram_api_hourly_account_id_instagram_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
