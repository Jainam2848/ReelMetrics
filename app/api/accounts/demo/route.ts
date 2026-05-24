/**
 * Onboarding Demo Seeding Endpoint — POST /api/accounts/demo
 *
 * Links the pre-seeded "alice_reels" profile and her reels/scores/strategies
 * to the currently authenticated user. This allows instant sandbox exploration
 * for testing and onboarding.
 */

import { NextRequest } from "next/server";
import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts, strategies, reels, users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

export const POST = withRateLimit(
  withAuth(async (request) => {
    const userId = request.user.id;

    try {
      // 1. Find the pre-seeded "alice_reels" account
      const demoAccount = await db
        .select()
        .from(instagramAccounts)
        .where(eq(instagramAccounts.username, "alice_reels"))
        .limit(1)
        .then((res) => res[0]);

      if (!demoAccount) {
        // Fallback: if seed wasn't run or deleted, let's create a demo account for the user
        const demoAccounts = await db
          .insert(instagramAccounts)
          .values({
            userId,
            igUserId: "demo_alice_17841400",
            username: "alice_reels",
            followersCount: 1250,
            syncStatus: "completed",
            lastSyncedAt: new Date(),
          })
          .returning();

        const newDemo = demoAccounts[0];
        if (!newDemo) {
          throw new Error("Failed to create demo account");
        }

        // Seed 2 mock reels for this user to make sure there's data
        const [reel1] = await db
          .insert(reels)
          .values({
            accountId: newDemo.id,
            igMediaId: "demo_media_1",
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
          account: newDemo,
        });
      }

      // 2. Link the existing "alice_reels" account to the currently logged in user
      await db
        .update(instagramAccounts)
        .set({ userId })
        .where(eq(instagramAccounts.id, demoAccount.id));

      // 3. Update related strategies to also belong to the current user
      await db
        .update(strategies)
        .set({ userId })
        .where(eq(strategies.accountId, demoAccount.id));

      return apiSuccess({
        message: "Demo sandbox account connected successfully!",
        accountId: demoAccount.id,
        username: demoAccount.username,
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
