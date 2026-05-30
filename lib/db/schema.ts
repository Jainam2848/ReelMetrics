import { pgTable, uuid, text, timestamp, integer, boolean, decimal, customType, jsonb, primaryKey, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { TrendPillar, SoundRecommendation, HookMutation, ActionableBlueprint } from '@/lib/ai/prompts/trends';

// ─── Custom Column Types ───────────────────────────────────────────────────

// Custom type for PostgreSQL BYTEA binary column, mapping to Node Buffer
export const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
  toDriver(value) {
    return value;
  },
  fromDriver(value) {
    // In node-postgres, bytea is returned as a Buffer
    return value as Buffer;
  }
});

// ─── Tables ────────────────────────────────────────────────────────────────

// 1. users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 2. plans
export const plans = pgTable('plans', {
  id: text('id').primaryKey(), // 'free', 'creator', 'pro', 'agency'
  name: text('name').notNull(),
  priceMonthly: integer('price_monthly').notNull(),
  maxAccounts: integer('max_accounts').notNull(),
  maxReels: integer('max_reels').notNull(),
  aiTier: text('ai_tier').notNull(),
  features: jsonb('features').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 3. subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  planId: text('plan_id')
    .notNull()
    .references(() => plans.id),
  stripeSubId: text('stripe_sub_id'),
  stripeCustomerId: text('stripe_customer_id'),
  status: text('status'),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAt: timestamp('cancel_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 4. instagram_accounts
export const instagramAccounts = pgTable('instagram_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  igUserId: text('ig_user_id').notNull().unique(),
  username: text('username').notNull(),
  accessTokenEnc: bytea('access_token_enc'),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  tokenVersion: integer('token_version').notNull().default(1),
  followersCount: integer('followers_count').notNull().default(0),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  syncStatus: text('sync_status'),
  niche: text('niche'),
  goal: text('goal'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 5. reels
export const reels = pgTable('reels', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => instagramAccounts.id, { onDelete: 'cascade' }),
  igMediaId: text('ig_media_id').notNull().unique(),
  caption: text('caption'),
  mediaUrl: text('media_url'),
  permalink: text('permalink'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  viewsCount: integer('views_count').notNull().default(0),
  totalViews: integer('total_views').notNull().default(0),
  displayViews: integer('display_views').notNull().default(0),
  metricSource: text('metric_source'), // 'legacy_plays' | 'unified_views'
  likesCount: integer('likes_count').notNull().default(0),
  commentsCount: integer('comments_count').notNull().default(0),
  sharesCount: integer('shares_count').notNull().default(0),
  savesCount: integer('saves_count').notNull().default(0),
  publicReposts: integer('public_reposts').notNull().default(0),
  skipRate: decimal('skip_rate', { precision: 5, scale: 2 }),
  reach: integer('reach').notNull().default(0),
  engagementRate: decimal('engagement_rate', { precision: 10, scale: 4 }),
  dataTrustLabel: text('data_trust_label').notNull().default('Verified Source'),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 5b. stories
export const stories = pgTable('stories', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => instagramAccounts.id, { onDelete: 'cascade' }),
  igMediaId: text('ig_media_id').notNull().unique(),
  caption: text('caption'),
  mediaUrl: text('media_url'),
  permalink: text('permalink'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  impressions: integer('impressions').notNull().default(0),
  reach: integer('reach').notNull().default(0),
  replies: integer('replies').notNull().default(0),
  exits: integer('exits').notNull().default(0),
  completionRate: decimal('completion_rate', { precision: 10, scale: 4 }),
  dataTrustLabel: text('data_trust_label').notNull().default('Verified Source'),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 5c. account_insights_daily
export const accountInsightsDaily = pgTable('account_insights_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => instagramAccounts.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  reach: integer('reach').notNull().default(0),
  impressions: integer('impressions').notNull().default(0),
  profileViews: integer('profile_views').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('account_date_unique').on(table.accountId, table.date)
]);

// 5d. audience_history
export const audienceHistory = pgTable('audience_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => instagramAccounts.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  totalFollowers: integer('total_followers').notNull(),
  newFollowers: integer('new_followers').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('account_timestamp_unique').on(table.accountId, table.timestamp)
]);

// 6. reel_scores
export const reelScores = pgTable('reel_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  reelId: uuid('reel_id')
    .notNull()
    .references(() => reels.id, { onDelete: 'cascade' }),
  overallScore: integer('overall_score'),
  hookScore: integer('hook_score'),
  skipRateScore: integer('skip_rate_score'),
  retentionScore: integer('retention_score'),
  ctaScore: integer('cta_score'),
  visualScore: integer('visual_score'),
  audioScore: integer('audio_score'),
  trendScore: integer('trend_score'),
  captionScore: integer('caption_score'),
  timingScore: integer('timing_score'),
  aiAnalysis: jsonb('ai_analysis').$type<Record<string, unknown>>(),
  modelVersion: text('model_version'),
  tokensUsed: integer('tokens_used'),
  costUsd: decimal('cost_usd', { precision: 10, scale: 6 }),
  scoredAt: timestamp('scored_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 7. strategies
export const strategies = pgTable('strategies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id')
    .notNull()
    .references(() => instagramAccounts.id, { onDelete: 'cascade' }),
  strategyType: text('strategy_type'), // "weekly" | "monthly" | "campaign"
  content: jsonb('content').$type<Record<string, unknown>>(),
  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),
  modelVersion: text('model_version'),
  tokensUsed: integer('tokens_used'),
  costUsd: decimal('cost_usd', { precision: 10, scale: 6 }),
  generatedAt: timestamp('generated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 8. job_queue
export const jobQueue = pgTable('job_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobType: text('job_type').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  status: text('status').notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
  priority: integer('priority').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(3),
  retryCount: integer('retry_count').notNull().default(0),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  lockedBy: text('locked_by'),
  lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }).notNull().defaultNow(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  deadLetter: boolean('dead_letter').notNull().default(false),
  idempotencyKey: text('idempotency_key').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 9. usage_tracking
export const usageTracking = pgTable('usage_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  periodMonth: text('period_month').notNull(), // e.g. "2026-05"
  aiCallsCount: integer('ai_calls_count').notNull().default(0),
  aiTokensUsed: integer('ai_tokens_used').notNull().default(0),
  aiCostUsd: decimal('ai_cost_usd', { precision: 10, scale: 6 }).notNull().default('0'),
  reelsAnalyzed: integer('reels_analyzed').notNull().default(0),
  strategiesGen: integer('strategies_gen').notNull().default(0),
  apiCallsCount: integer('api_calls_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 10. audit_log
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'set null' }), // GDPR immutable anonymized audit trail
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 11. instagram_api_hourly — per-account Graph API call counter (rolling UTC hour)
export const instagramApiHourly = pgTable(
  'instagram_api_hourly',
  {
    accountId: uuid('account_id')
      .notNull()
      .references(() => instagramAccounts.id, { onDelete: 'cascade' }),
    hourBucket: text('hour_bucket').notNull(),
    callCount: integer('call_count').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.accountId, table.hourBucket] }),
  ]
);

// 12. processed_events
export const processedEvents = pgTable('processed_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull().unique(), // Stripe event ID / hash
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 13. niche_trends_feed
export const nicheTrendsFeed = pgTable('niche_trends_feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  niche: text('niche').notNull().unique(),
  trendSignals: text('trend_signals').notNull(),
  semanticTags: text('semantic_tags').array(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 13b. trend_signals
export const trendSignals = pgTable('trend_signals', {
  id: uuid('id').primaryKey().defaultRandom(),
  niche: text('niche').notNull(),
  platform: text('platform').notNull().default('instagram'),
  signalType: text('signal_type').notNull(), // 'hashtag' | 'audio' | 'format' | 'editing_pattern' | 'topic'
  dayKey: text('day_key').notNull().unique(), // e.g. "tech:instagram:audio:Synth-Beats:2026-05-30"
  signalData: jsonb('signal_data').notNull().$type<Record<string, any>>(),
  source: text('source').notNull().default('llm'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_trend_signals_niche_type_created').on(table.niche, table.signalType, table.createdAt),
]);

// 14. trend_analyses
export const trendAnalyses = pgTable('trend_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id')
    .notNull()
    .references(() => instagramAccounts.id, { onDelete: 'cascade' }),
  nicheTrendScore: integer('niche_trend_score').notNull(),
  trendVerdict: text('trend_verdict').notNull(),
  trendPillars: jsonb('trend_pillars').notNull().$type<TrendPillar[]>(),
  soundRecommendations: jsonb('sound_recommendations').notNull().$type<SoundRecommendation[]>(),
  hookMutations: jsonb('hook_mutations').notNull().$type<HookMutation[]>(),
  actionableBlueprints: jsonb('actionable_blueprints').notNull().$type<ActionableBlueprint[]>(),
  modelVersion: text('model_version'),
  tokensUsed: integer('tokens_used'),
  costUsd: decimal('cost_usd', { precision: 10, scale: 6 }),
  source: text('source').notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Relations ─────────────────────────────────────────────────────────────

// users relations
export const usersRelations = relations(users, ({ many, one }) => ({
  instagramAccounts: many(instagramAccounts),
  strategies: many(strategies),
  trendAnalyses: many(trendAnalyses),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  usageTracking: many(usageTracking),
  auditLogs: many(auditLog),
}));

// plans relations
export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

// subscriptions relations
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
}));

// instagram_accounts relations
export const instagramAccountsRelations = relations(instagramAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [instagramAccounts.userId],
    references: [users.id],
  }),
  reels: many(reels),
  stories: many(stories),
  accountInsightsDaily: many(accountInsightsDaily),
  audienceHistory: many(audienceHistory),
  strategies: many(strategies),
  trendAnalyses: many(trendAnalyses),
  apiHourlyUsage: many(instagramApiHourly),
}));

export const instagramApiHourlyRelations = relations(instagramApiHourly, ({ one }) => ({
  account: one(instagramAccounts, {
    fields: [instagramApiHourly.accountId],
    references: [instagramAccounts.id],
  }),
}));

// reels relations
export const reelsRelations = relations(reels, ({ one }) => ({
  account: one(instagramAccounts, {
    fields: [reels.accountId],
    references: [instagramAccounts.id],
  }),
  scores: one(reelScores, {
    fields: [reels.id],
    references: [reelScores.reelId],
  }),
}));

// stories relations
export const storiesRelations = relations(stories, ({ one }) => ({
  account: one(instagramAccounts, {
    fields: [stories.accountId],
    references: [instagramAccounts.id],
  }),
}));

// account_insights_daily relations
export const accountInsightsDailyRelations = relations(accountInsightsDaily, ({ one }) => ({
  account: one(instagramAccounts, {
    fields: [accountInsightsDaily.accountId],
    references: [instagramAccounts.id],
  }),
}));

// audience_history relations
export const audienceHistoryRelations = relations(audienceHistory, ({ one }) => ({
  account: one(instagramAccounts, {
    fields: [audienceHistory.accountId],
    references: [instagramAccounts.id],
  }),
}));

// reel_scores relations
export const reelScoresRelations = relations(reelScores, ({ one }) => ({
  reel: one(reels, {
    fields: [reelScores.reelId],
    references: [reels.id],
  }),
}));

// strategies relations
export const strategiesRelations = relations(strategies, ({ one }) => ({
  user: one(users, {
    fields: [strategies.userId],
    references: [users.id],
  }),
  account: one(instagramAccounts, {
    fields: [strategies.accountId],
    references: [instagramAccounts.id],
  }),
}));

// trend_analyses relations
export const trendAnalysesRelations = relations(trendAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [trendAnalyses.userId],
    references: [users.id],
  }),
  account: one(instagramAccounts, {
    fields: [trendAnalyses.accountId],
    references: [instagramAccounts.id],
  }),
}));

// usage_tracking relations
export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(users, {
    fields: [usageTracking.userId],
    references: [users.id],
  }),
}));

// audit_log relations
export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));
