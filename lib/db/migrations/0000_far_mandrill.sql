CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid,
	"metadata" jsonb,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ig_user_id" text NOT NULL,
	"username" text NOT NULL,
	"access_token_enc" "bytea",
	"token_expires_at" timestamp with time zone,
	"token_version" integer DEFAULT 1 NOT NULL,
	"followers_count" integer DEFAULT 0 NOT NULL,
	"last_synced_at" timestamp with time zone,
	"sync_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instagram_accounts_ig_user_id_unique" UNIQUE("ig_user_id")
);
--> statement-breakpoint
CREATE TABLE "job_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_type" text NOT NULL,
	"payload" jsonb,
	"status" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"last_heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL,
	"scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"error_message" text,
	"dead_letter" boolean DEFAULT false NOT NULL,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price_monthly" integer NOT NULL,
	"max_accounts" integer NOT NULL,
	"max_reels" integer NOT NULL,
	"ai_tier" text NOT NULL,
	"features" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processed_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "reel_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reel_id" uuid NOT NULL,
	"overall_score" integer,
	"hook_score" integer,
	"skip_rate_score" integer,
	"retention_score" integer,
	"cta_score" integer,
	"visual_score" integer,
	"audio_score" integer,
	"trend_score" integer,
	"caption_score" integer,
	"timing_score" integer,
	"ai_analysis" jsonb,
	"model_version" text,
	"tokens_used" integer,
	"cost_usd" numeric(10, 6),
	"scored_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"ig_media_id" text NOT NULL,
	"caption" text,
	"media_url" text,
	"permalink" text,
	"timestamp" timestamp with time zone NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"display_views" integer DEFAULT 0 NOT NULL,
	"metric_source" text,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"shares_count" integer DEFAULT 0 NOT NULL,
	"saves_count" integer DEFAULT 0 NOT NULL,
	"public_reposts" integer DEFAULT 0 NOT NULL,
	"skip_rate" numeric(5, 2),
	"reach" integer DEFAULT 0 NOT NULL,
	"engagement_rate" numeric(10, 4),
	"fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reels_ig_media_id_unique" UNIQUE("ig_media_id")
);
--> statement-breakpoint
CREATE TABLE "strategies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"strategy_type" text,
	"content" jsonb,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"model_version" text,
	"tokens_used" integer,
	"cost_usd" numeric(10, 6),
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" text NOT NULL,
	"stripe_sub_id" text,
	"stripe_customer_id" text,
	"status" text,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_month" text NOT NULL,
	"ai_calls_count" integer DEFAULT 0 NOT NULL,
	"ai_tokens_used" integer DEFAULT 0 NOT NULL,
	"ai_cost_usd" numeric(10, 6) DEFAULT '0' NOT NULL,
	"reels_analyzed" integer DEFAULT 0 NOT NULL,
	"strategies_gen" integer DEFAULT 0 NOT NULL,
	"api_calls_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_accounts" ADD CONSTRAINT "instagram_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reel_scores" ADD CONSTRAINT "reel_scores_reel_id_reels_id_fk" FOREIGN KEY ("reel_id") REFERENCES "public"."reels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reels" ADD CONSTRAINT "reels_account_id_instagram_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_account_id_instagram_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
-- 1. Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--> statement-breakpoint
-- 2. Triggers for all 11 tables
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
--> statement-breakpoint
CREATE TRIGGER set_plans_updated_at BEFORE UPDATE ON "plans" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
--> statement-breakpoint
CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON "subscriptions" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
--> statement-breakpoint
CREATE TRIGGER set_instagram_accounts_updated_at BEFORE UPDATE ON "instagram_accounts" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
--> statement-breakpoint
CREATE TRIGGER set_reels_updated_at BEFORE UPDATE ON "reels" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
--> statement-breakpoint
CREATE TRIGGER set_reel_scores_updated_at BEFORE UPDATE ON "reel_scores" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
--> statement-breakpoint
CREATE TRIGGER set_strategies_updated_at BEFORE UPDATE ON "strategies" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
--> statement-breakpoint
CREATE TRIGGER set_job_queue_updated_at BEFORE UPDATE ON "job_queue" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
--> statement-breakpoint
CREATE TRIGGER set_usage_tracking_updated_at BEFORE UPDATE ON "usage_tracking" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
--> statement-breakpoint
CREATE TRIGGER set_audit_log_updated_at BEFORE UPDATE ON "audit_log" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
--> statement-breakpoint
CREATE TRIGGER set_processed_events_updated_at BEFORE UPDATE ON "processed_events" FOR EACH ROW EXECUTE FUNCTION update_updated_at();

--> statement-breakpoint
-- 3. Custom Query Indexes and Partial Indexes
CREATE INDEX IF NOT EXISTS "idx_reels_account_id" ON "reels"("account_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reel_scores_reel_id" ON "reel_scores"("reel_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_instagram_accounts_user_id" ON "instagram_accounts"("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_id" ON "subscriptions"("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_strategies_user_id" ON "strategies"("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reels_timestamp" ON "reels"("account_id", "timestamp" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_job_queue_pending" ON "job_queue"("status", "scheduled_at") WHERE status = 'pending';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_job_queue_locked" ON "job_queue"("locked_at") WHERE status = 'processing';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_job_queue_heartbeat" ON "job_queue"("last_heartbeat_at") WHERE status = 'processing';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_usage_tracking_period" ON "usage_tracking"("user_id", "period_month");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_log_created_at" ON "audit_log"("created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_job_queue_idempotency" ON "job_queue"("idempotency_key") WHERE idempotency_key IS NOT NULL;

--> statement-breakpoint
-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "instagram_accounts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "reels" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "reel_scores" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "strategies" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "usage_tracking" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "job_queue" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "processed_events" ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
-- 5. RLS Policies
CREATE POLICY "Allow users to select their own profile" ON "users" FOR SELECT USING (id = auth.uid());
--> statement-breakpoint
CREATE POLICY "Allow users to update their own profile" ON "users" FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
--> statement-breakpoint
CREATE POLICY "Allow users to insert their own profile" ON "users" FOR INSERT WITH CHECK (id = auth.uid());
--> statement-breakpoint
CREATE POLICY "Allow all users to view plans" ON "plans" FOR SELECT TO authenticated, anon USING (true);
--> statement-breakpoint
CREATE POLICY "Allow users to view own subscription" ON "subscriptions" FOR SELECT USING (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY "Allow users to view own instagram accounts" ON "instagram_accounts" FOR SELECT USING (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY "Allow users to insert own instagram accounts" ON "instagram_accounts" FOR INSERT WITH CHECK (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY "Allow users to update own instagram accounts" ON "instagram_accounts" FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY "Allow users to delete own instagram accounts" ON "instagram_accounts" FOR DELETE USING (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY "Allow users to view own reels" ON "reels" FOR SELECT USING (
    account_id IN (
        SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
);
--> statement-breakpoint
CREATE POLICY "Allow users to insert own reels" ON "reels" FOR INSERT WITH CHECK (
    account_id IN (
        SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
);
--> statement-breakpoint
CREATE POLICY "Allow users to update own reels" ON "reels" FOR UPDATE USING (
    account_id IN (
        SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
) WITH CHECK (
    account_id IN (
        SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
);
--> statement-breakpoint
CREATE POLICY "Allow users to delete own reels" ON "reels" FOR DELETE USING (
    account_id IN (
        SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
);
--> statement-breakpoint
CREATE POLICY "Allow users to view own reel scores" ON "reel_scores" FOR SELECT USING (
    reel_id IN (
        SELECT r.id FROM reels r
        JOIN instagram_accounts ia ON r.account_id = ia.id
        WHERE ia.user_id = auth.uid()
    )
);
--> statement-breakpoint
CREATE POLICY "Allow users to insert own reel scores" ON "reel_scores" FOR INSERT WITH CHECK (
    reel_id IN (
        SELECT r.id FROM reels r
        JOIN instagram_accounts ia ON r.account_id = ia.id
        WHERE ia.user_id = auth.uid()
    )
);
--> statement-breakpoint
CREATE POLICY "Allow users to update own reel scores" ON "reel_scores" FOR UPDATE USING (
    reel_id IN (
        SELECT r.id FROM reels r
        JOIN instagram_accounts ia ON r.account_id = ia.id
        WHERE ia.user_id = auth.uid()
    )
) WITH CHECK (
    reel_id IN (
        SELECT r.id FROM reels r
        JOIN instagram_accounts ia ON r.account_id = ia.id
        WHERE ia.user_id = auth.uid()
    )
);
--> statement-breakpoint
CREATE POLICY "Allow users to delete own reel scores" ON "reel_scores" FOR DELETE USING (
    reel_id IN (
        SELECT r.id FROM reels r
        JOIN instagram_accounts ia ON r.account_id = ia.id
        WHERE ia.user_id = auth.uid()
    )
);
--> statement-breakpoint
CREATE POLICY "Allow users to view own strategies" ON "strategies" FOR SELECT USING (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY "Allow users to insert own strategies" ON "strategies" FOR INSERT WITH CHECK (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY "Allow users to update own strategies" ON "strategies" FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY "Allow users to delete own strategies" ON "strategies" FOR DELETE USING (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY "Allow users to view own usage tracking" ON "usage_tracking" FOR SELECT USING (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY "Allow users to view own audit logs" ON "audit_log" FOR SELECT USING (user_id = auth.uid());

--> statement-breakpoint
-- 6. Plans Seed Data
INSERT INTO "plans" ("id", "name", "price_monthly", "max_accounts", "max_reels", "ai_tier", "features")
VALUES
  ('free', 'Free', 0, 1, 10, 'basic', '{"reels_skip_rate": false, "competitor_analysis": false, "weekly_strategies": false}'::jsonb),
  ('creator', 'Creator', 3900, 2, 50, 'standard', '{"reels_skip_rate": true, "competitor_analysis": false, "weekly_strategies": true}'::jsonb),
  ('pro', 'Pro', 8900, 5, 200, 'advanced', '{"reels_skip_rate": true, "competitor_analysis": true, "weekly_strategies": true}'::jsonb),
  ('agency', 'Agency', 24900, 20, 1000, 'custom', '{"reels_skip_rate": true, "competitor_analysis": true, "weekly_strategies": true}'::jsonb)
ON CONFLICT ("id") DO NOTHING;