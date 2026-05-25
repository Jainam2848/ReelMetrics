CREATE TABLE IF NOT EXISTS "niche_trends_feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"niche" text NOT NULL UNIQUE,
	"trend_signals" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trend_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"niche_trend_score" integer NOT NULL,
	"trend_verdict" text NOT NULL,
	"trend_pillars" jsonb NOT NULL,
	"sound_recommendations" jsonb NOT NULL,
	"hook_mutations" jsonb NOT NULL,
	"actionable_blueprints" jsonb NOT NULL,
	"model_version" text,
	"tokens_used" integer,
	"cost_usd" numeric(10, 6),
	"source" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trend_analyses" ADD CONSTRAINT "trend_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trend_analyses" ADD CONSTRAINT "trend_analyses_account_id_instagram_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
