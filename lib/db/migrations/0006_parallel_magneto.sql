CREATE TABLE "trend_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"niche" text NOT NULL,
	"platform" text DEFAULT 'instagram' NOT NULL,
	"signal_type" text NOT NULL,
	"day_key" text NOT NULL,
	"signal_data" jsonb NOT NULL,
	"source" text DEFAULT 'llm' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trend_signals_day_key_unique" UNIQUE("day_key")
);
--> statement-breakpoint
CREATE INDEX "idx_trend_signals_niche_type_created" ON "trend_signals" USING btree ("niche","signal_type","created_at" DESC);