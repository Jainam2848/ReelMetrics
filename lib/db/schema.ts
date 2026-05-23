import { pgTable, uuid, text, timestamp, integer, boolean, decimal, customType, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
  fetchedAt: timestamp('fetched_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

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

// 11. processed_events
export const processedEvents = pgTable('processed_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull().unique(), // Stripe event ID / hash
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Relations ─────────────────────────────────────────────────────────────

// users relations
export const usersRelations = relations(users, ({ many, one }) => ({
  instagramAccounts: many(instagramAccounts),
  strategies: many(strategies),
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
  strategies: many(strategies),
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
