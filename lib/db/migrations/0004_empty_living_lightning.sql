CREATE TABLE "account_insights_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"reach" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"profile_views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_date_unique" UNIQUE("account_id","date")
);
--> statement-breakpoint
CREATE TABLE "audience_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"total_followers" integer NOT NULL,
	"new_followers" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_timestamp_unique" UNIQUE("account_id","timestamp")
);
--> statement-breakpoint
CREATE TABLE "instagram_api_hourly" (
	"account_id" uuid NOT NULL,
	"hour_bucket" text NOT NULL,
	"call_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instagram_api_hourly_account_id_hour_bucket_pk" PRIMARY KEY("account_id","hour_bucket")
);
--> statement-breakpoint
CREATE TABLE "niche_trends_feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"niche" text NOT NULL,
	"trend_signals" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "niche_trends_feed_niche_unique" UNIQUE("niche")
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"ig_media_id" text NOT NULL,
	"caption" text,
	"media_url" text,
	"permalink" text,
	"timestamp" timestamp with time zone NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"reach" integer DEFAULT 0 NOT NULL,
	"replies" integer DEFAULT 0 NOT NULL,
	"exits" integer DEFAULT 0 NOT NULL,
	"completion_rate" numeric(10, 4),
	"data_trust_label" text DEFAULT 'Verified Source' NOT NULL,
	"fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stories_ig_media_id_unique" UNIQUE("ig_media_id")
);
--> statement-breakpoint
CREATE TABLE "trend_analyses" (
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
ALTER TABLE "reels" ADD COLUMN "data_trust_label" text DEFAULT 'Verified Source' NOT NULL;--> statement-breakpoint
ALTER TABLE "account_insights_daily" ADD CONSTRAINT "account_insights_daily_account_id_instagram_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audience_history" ADD CONSTRAINT "audience_history_account_id_instagram_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_api_hourly" ADD CONSTRAINT "instagram_api_hourly_account_id_instagram_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_account_id_instagram_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_analyses" ADD CONSTRAINT "trend_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_analyses" ADD CONSTRAINT "trend_analyses_account_id_instagram_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_queue" ADD CONSTRAINT "job_queue_idempotency_key_unique" UNIQUE("idempotency_key");