/**
 * Onboarding Demo Seeding Endpoint — POST /api/accounts/demo
 *
 * Privately clones the pre-seeded "alice_reels" profile and her reels/scores/strategies
 * for the currently authenticated user. This ensures a fully isolated sandbox environment
 * for each user, preventing any cross-user account hijacking or state interference.
 */

import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts, strategies, reels, reelScores } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const POST = withRateLimit(
  withAuth(async (request) => {
    const userId = request.user.id;
    console.log("[POST /api/accounts/demo] Received seeding request for user:", userId);

    if (process.env.NODE_ENV === "production") {
      console.warn("[POST /api/accounts/demo] Denied: Production environment check active.");
      return apiError("FORBIDDEN", "Sandbox demo is disabled in production environments.");
    }

    // Parse niche and goal parameters from request body for custom database personalization
    let body: { niche?: string; goal?: string } = {};
    try {
      body = await request.json().catch(() => ({}));
    } catch {
      // Gracefully handle empty or malformed requests
    }
    const niche = body.niche || null;
    const goal = body.goal || null;
    console.log("[POST /api/accounts/demo] Personalization parameters - niche:", niche, "goal:", goal);

    try {
      // 1. Check if the user already has their own sandbox demo account
      const existingDemo = await db
        .select()
        .from(instagramAccounts)
        .where(
          and(
            eq(instagramAccounts.userId, userId),
            eq(instagramAccounts.username, "alice_reels")
          )
        )
        .limit(1)
        .then((res) => res[0]);

      if (existingDemo) {
        return apiSuccess({
          message: "Demo sandbox account already connected!",
          accountId: existingDemo.id,
          username: existingDemo.username,
        });
      }

      // 2. Find the master pre-seeded "alice_reels" account to copy from
      // The master account is defined by the seeded igUserId: "17841400000000001"
      const masterAccount = await db
        .select()
        .from(instagramAccounts)
        .where(eq(instagramAccounts.igUserId, "17841400000000001"))
        .limit(1)
        .then((res) => res[0]);

      if (!masterAccount) {
        // Fallback: If seed wasn't run or master deleted, create a private demo account
        const [newDemo] = await db
          .insert(instagramAccounts)
          .values({
            userId,
            igUserId: `demo_alice_${userId}`, // unique igUserId per user to avoid collision
            username: "alice_reels",
            followersCount: 1250,
            syncStatus: "completed",
            lastSyncedAt: new Date(),
            niche,
            goal,
          })
          .returning();

        const newDemoAccount = newDemo;
        if (!newDemoAccount) {
          throw new Error("Failed to create demo account");
        }

        // Seed 2 mock reels for this private demo account to ensure exploratory data is loaded
        await db
          .insert(reels)
          .values({
            accountId: newDemoAccount.id,
            igMediaId: `demo_media_1_${userId}`,
            caption: "Unboxing the new tech gear! 📦🔥 #tech #unboxing",
            mediaUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e",
            permalink: "https://www.instagram.com/reel/demo1/",
            timestamp: new Date(),
            viewsCount: 1200,
            totalViews: 1200,
            displayViews: 1200,
            metricSource: "unified_views",
            likesCount: 120,
            commentsCount: 15,
            sharesCount: 25,
            savesCount: 10,
            reach: 1100,
            skipRate: "42.50",
            engagementRate: "14.1667",
          })
          .returning();

        return apiSuccess({
          message: "Demo account generated and connected successfully",
          account: newDemoAccount,
        });
      }

      // 3. Clone the master account privately for the current user.
      const [userDemoAccount] = await db
        .insert(instagramAccounts)
        .values({
          userId,
          igUserId: `demo_${userId}_17841400000000001`, // unique per user to prevent constraint conflict
          username: masterAccount.username,
          followersCount: masterAccount.followersCount,
          syncStatus: "completed",
          lastSyncedAt: new Date(),
          niche,
          goal,
        })
        .returning();

      if (!userDemoAccount) {
        throw new Error("Failed to clone demo account");
      }

      // 4. Fetch and clone all reels belonging to the master account
      const masterReels = await db
        .select()
        .from(reels)
        .where(eq(reels.accountId, masterAccount.id));

      for (const mReel of masterReels) {
        const [userReel] = await db
          .insert(reels)
          .values({
            accountId: userDemoAccount.id,
            igMediaId: `demo_${userId}_${mReel.igMediaId}`, // unique per user
            caption: mReel.caption,
            mediaUrl: mReel.mediaUrl,
            permalink: mReel.permalink,
            timestamp: mReel.timestamp,
            viewsCount: mReel.viewsCount,
            totalViews: mReel.totalViews,
            displayViews: mReel.displayViews,
            metricSource: mReel.metricSource,
            likesCount: mReel.likesCount,
            commentsCount: mReel.commentsCount,
            sharesCount: mReel.sharesCount,
            savesCount: mReel.savesCount,
            publicReposts: mReel.publicReposts,
            skipRate: mReel.skipRate,
            reach: mReel.reach,
            engagementRate: mReel.engagementRate,
            fetchedAt: mReel.fetchedAt,
          })
          .returning();

        if (userReel) {
          // Fetch and clone the scores for this reel
          const masterScores = await db
            .select()
            .from(reelScores)
            .where(eq(reelScores.reelId, mReel.id));

          for (const mScore of masterScores) {
            await db.insert(reelScores).values({
              reelId: userReel.id,
              overallScore: mScore.overallScore,
              hookScore: mScore.hookScore,
              skipRateScore: mScore.skipRateScore,
              retentionScore: mScore.retentionScore,
              ctaScore: mScore.ctaScore,
              visualScore: mScore.visualScore,
              audioScore: mScore.audioScore,
              trendScore: mScore.trendScore,
              captionScore: mScore.captionScore,
              timingScore: mScore.timingScore,
              aiAnalysis: mScore.aiAnalysis,
              modelVersion: mScore.modelVersion,
              tokensUsed: mScore.tokensUsed,
              costUsd: mScore.costUsd,
              scoredAt: mScore.scoredAt,
            });
          }
        }
      }

      // 5. Fetch and clone the strategies belonging to the master account
      const masterStrategies = await db
        .select()
        .from(strategies)
        .where(eq(strategies.accountId, masterAccount.id));

      for (const mStrategy of masterStrategies) {
        await db.insert(strategies).values({
          userId,
          accountId: userDemoAccount.id,
          strategyType: mStrategy.strategyType,
          content: mStrategy.content,
          periodStart: mStrategy.periodStart,
          periodEnd: mStrategy.periodEnd,
          modelVersion: mStrategy.modelVersion,
          tokensUsed: mStrategy.tokensUsed,
          costUsd: mStrategy.costUsd,
          generatedAt: mStrategy.generatedAt,
        });
      }

      return apiSuccess({
        message: "Demo sandbox account connected successfully!",
        accountId: userDemoAccount.id,
        username: userDemoAccount.username,
      });
    } catch (error) {
      console.error("[demo-account] Error seeding demo account:", error);
      return apiError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Failed to link demo account"
      );
    }
  })
);
