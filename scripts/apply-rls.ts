import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function applyRLS() {
  console.log('🔒 Connecting to production database to apply RLS policies...');

  const sqlStatements = [
    // 1. Enable Row Level Security (RLS) on all tables
    `ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "instagram_accounts" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "reels" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "reel_scores" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "strategies" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "usage_tracking" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "job_queue" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "processed_events" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "instagram_api_hourly" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "stories" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "account_insights_daily" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "audience_history" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "niche_trends_feed" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "trend_analyses" ENABLE ROW LEVEL SECURITY;`,

    // 2. Drop existing policies if any exist to prevent duplicate errors
    `DROP POLICY IF EXISTS "Allow users to select their own profile" ON "users";`,
    `DROP POLICY IF EXISTS "Allow users to update their own profile" ON "users";`,
    `DROP POLICY IF EXISTS "Allow users to insert their own profile" ON "users";`,
    `DROP POLICY IF EXISTS "Allow all users to view plans" ON "plans";`,
    `DROP POLICY IF EXISTS "Allow users to view own subscription" ON "subscriptions";`,
    `DROP POLICY IF EXISTS "Allow users to view own instagram accounts" ON "instagram_accounts";`,
    `DROP POLICY IF EXISTS "Allow users to insert own instagram accounts" ON "instagram_accounts";`,
    `DROP POLICY IF EXISTS "Allow users to update own instagram accounts" ON "instagram_accounts";`,
    `DROP POLICY IF EXISTS "Allow users to delete own instagram accounts" ON "instagram_accounts";`,
    `DROP POLICY IF EXISTS "Allow users to view own reels" ON "reels";`,
    `DROP POLICY IF EXISTS "Allow users to insert own reels" ON "reels";`,
    `DROP POLICY IF EXISTS "Allow users to update own reels" ON "reels";`,
    `DROP POLICY IF EXISTS "Allow users to delete own reels" ON "reels";`,
    `DROP POLICY IF EXISTS "Allow users to view own reel scores" ON "reel_scores";`,
    `DROP POLICY IF EXISTS "Allow users to insert own reel scores" ON "reel_scores";`,
    `DROP POLICY IF EXISTS "Allow users to update own reel scores" ON "reel_scores";`,
    `DROP POLICY IF EXISTS "Allow users to delete own reel scores" ON "reel_scores";`,
    `DROP POLICY IF EXISTS "Allow users to view own strategies" ON "strategies";`,
    `DROP POLICY IF EXISTS "Allow users to insert own strategies" ON "strategies";`,
    `DROP POLICY IF EXISTS "Allow users to update own strategies" ON "strategies";`,
    `DROP POLICY IF EXISTS "Allow users to delete own strategies" ON "strategies";`,
    `DROP POLICY IF EXISTS "Allow users to view own usage tracking" ON "usage_tracking";`,
    `DROP POLICY IF EXISTS "Allow users to view own audit logs" ON "audit_log";`,
    `DROP POLICY IF EXISTS "Allow users to view own instagram api hourly" ON "instagram_api_hourly";`,
    `DROP POLICY IF EXISTS "Allow users to insert own instagram api hourly" ON "instagram_api_hourly";`,
    `DROP POLICY IF EXISTS "Allow users to update own instagram api hourly" ON "instagram_api_hourly";`,
    `DROP POLICY IF EXISTS "Allow users to delete own instagram api hourly" ON "instagram_api_hourly";`,
    `DROP POLICY IF EXISTS "Allow users to view own stories" ON "stories";`,
    `DROP POLICY IF EXISTS "Allow users to insert own stories" ON "stories";`,
    `DROP POLICY IF EXISTS "Allow users to update own stories" ON "stories";`,
    `DROP POLICY IF EXISTS "Allow users to delete own stories" ON "stories";`,
    `DROP POLICY IF EXISTS "Allow users to view own insights" ON "account_insights_daily";`,
    `DROP POLICY IF EXISTS "Allow users to insert own insights" ON "account_insights_daily";`,
    `DROP POLICY IF EXISTS "Allow users to update own insights" ON "account_insights_daily";`,
    `DROP POLICY IF EXISTS "Allow users to delete own insights" ON "account_insights_daily";`,
    `DROP POLICY IF EXISTS "Allow users to view own audience history" ON "audience_history";`,
    `DROP POLICY IF EXISTS "Allow users to insert own audience history" ON "audience_history";`,
    `DROP POLICY IF EXISTS "Allow users to update own audience history" ON "audience_history";`,
    `DROP POLICY IF EXISTS "Allow users to delete own audience history" ON "audience_history";`,
    `DROP POLICY IF EXISTS "Allow users to view own trend analyses" ON "trend_analyses";`,
    `DROP POLICY IF EXISTS "Allow users to insert own trend analyses" ON "trend_analyses";`,
    `DROP POLICY IF EXISTS "Allow users to update own trend analyses" ON "trend_analyses";`,
    `DROP POLICY IF EXISTS "Allow users to delete own trend analyses" ON "trend_analyses";`,
    `DROP POLICY IF EXISTS "Allow all users to view trends feed" ON "niche_trends_feed";`,

    // 3. Create RLS Policies
    `CREATE POLICY "Allow users to select their own profile" ON "users" FOR SELECT USING (id = auth.uid());`,
    `CREATE POLICY "Allow users to update their own profile" ON "users" FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());`,
    `CREATE POLICY "Allow users to insert their own profile" ON "users" FOR INSERT WITH CHECK (id = auth.uid());`,
    `CREATE POLICY "Allow all users to view plans" ON "plans" FOR SELECT TO authenticated, anon USING (true);`,
    `CREATE POLICY "Allow users to view own subscription" ON "subscriptions" FOR SELECT USING (user_id = auth.uid());`,
    `CREATE POLICY "Allow users to view own instagram accounts" ON "instagram_accounts" FOR SELECT USING (user_id = auth.uid());`,
    `CREATE POLICY "Allow users to insert own instagram accounts" ON "instagram_accounts" FOR INSERT WITH CHECK (user_id = auth.uid());`,
    `CREATE POLICY "Allow users to update own instagram accounts" ON "instagram_accounts" FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());`,
    `CREATE POLICY "Allow users to delete own instagram accounts" ON "instagram_accounts" FOR DELETE USING (user_id = auth.uid());`,

    `CREATE POLICY "Allow users to view own reels" ON "reels" FOR SELECT USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to insert own reels" ON "reels" FOR INSERT WITH CHECK (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to update own reels" ON "reels" FOR UPDATE USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    ) WITH CHECK (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to delete own reels" ON "reels" FOR DELETE USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,

    `CREATE POLICY "Allow users to view own reel scores" ON "reel_scores" FOR SELECT USING (
        reel_id IN (
            SELECT r.id FROM reels r
            JOIN instagram_accounts ia ON r.account_id = ia.id
            WHERE ia.user_id = auth.uid()
        )
    );`,
    `CREATE POLICY "Allow users to insert own reel scores" ON "reel_scores" FOR INSERT WITH CHECK (
        reel_id IN (
            SELECT r.id FROM reels r
            JOIN instagram_accounts ia ON r.account_id = ia.id
            WHERE ia.user_id = auth.uid()
        )
    );`,
    `CREATE POLICY "Allow users to update own reel scores" ON "reel_scores" FOR UPDATE USING (
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
    );`,
    `CREATE POLICY "Allow users to delete own reel scores" ON "reel_scores" FOR DELETE USING (
        reel_id IN (
            SELECT r.id FROM reels r
            JOIN instagram_accounts ia ON r.account_id = ia.id
            WHERE ia.user_id = auth.uid()
        )
    );`,

    `CREATE POLICY "Allow users to view own strategies" ON "strategies" FOR SELECT USING (user_id = auth.uid());`,
    `CREATE POLICY "Allow users to insert own strategies" ON "strategies" FOR INSERT WITH CHECK (user_id = auth.uid());`,
    `CREATE POLICY "Allow users to update own strategies" ON "strategies" FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());`,
    `CREATE POLICY "Allow users to delete own strategies" ON "strategies" FOR DELETE USING (user_id = auth.uid());`,

    `CREATE POLICY "Allow users to view own usage tracking" ON "usage_tracking" FOR SELECT USING (user_id = auth.uid());`,
    `CREATE POLICY "Allow users to view own audit logs" ON "audit_log" FOR SELECT USING (user_id = auth.uid());`,

    `CREATE POLICY "Allow users to view own instagram api hourly" ON "instagram_api_hourly" FOR SELECT USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to insert own instagram api hourly" ON "instagram_api_hourly" FOR INSERT WITH CHECK (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to update own instagram api hourly" ON "instagram_api_hourly" FOR UPDATE USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    ) WITH CHECK (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to delete own instagram api hourly" ON "instagram_api_hourly" FOR DELETE USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,

    `CREATE POLICY "Allow users to view own stories" ON "stories" FOR SELECT USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to insert own stories" ON "stories" FOR INSERT WITH CHECK (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to update own stories" ON "stories" FOR UPDATE USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    ) WITH CHECK (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to delete own stories" ON "stories" FOR DELETE USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,

    `CREATE POLICY "Allow users to view own insights" ON "account_insights_daily" FOR SELECT USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to insert own insights" ON "account_insights_daily" FOR INSERT WITH CHECK (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to update own insights" ON "account_insights_daily" FOR UPDATE USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    ) WITH CHECK (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to delete own insights" ON "account_insights_daily" FOR DELETE USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,

    `CREATE POLICY "Allow users to view own audience history" ON "audience_history" FOR SELECT USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to insert own audience history" ON "audience_history" FOR INSERT WITH CHECK (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to update own audience history" ON "audience_history" FOR UPDATE USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    ) WITH CHECK (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,
    `CREATE POLICY "Allow users to delete own audience history" ON "audience_history" FOR DELETE USING (
        account_id IN (SELECT id FROM instagram_accounts WHERE user_id = auth.uid())
    );`,

    `CREATE POLICY "Allow users to view own trend analyses" ON "trend_analyses" FOR SELECT USING (user_id = auth.uid());`,
    `CREATE POLICY "Allow users to insert own trend analyses" ON "trend_analyses" FOR INSERT WITH CHECK (user_id = auth.uid());`,
    `CREATE POLICY "Allow users to update own trend analyses" ON "trend_analyses" FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());`,
    `CREATE POLICY "Allow users to delete own trend analyses" ON "trend_analyses" FOR DELETE USING (user_id = auth.uid());`,

    `CREATE POLICY "Allow all users to view trends feed" ON "niche_trends_feed" FOR SELECT USING (true);`
  ];

  try {
    for (const stmt of sqlStatements) {
      const cleanStmt = stmt.trim();
      if (!cleanStmt) continue;
      await db.execute(sql.raw(cleanStmt));
    }
    console.log('🎉 Successfully applied all Row-Level Security (RLS) policies to your production database! 🚀');
    console.log('Supabase RLS warnings will clear immediately upon next refresh.');
  } catch (error) {
    console.error('❌ Error applying RLS policies:', error);
    throw error;
  }
}

applyRLS()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
