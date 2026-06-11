import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts, reels, strategies } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { AuthService } from "@/lib/services/auth.service";

/**
 * GET /api/auth/me/data-export
 * Compiles all historical user activity and metrics into a machine-readable JSON payload
 * strictly conforming to the GDPR Right to Data Portability (spec §11.7).
 * All access tokens and sensitive credentials are encrypted or completely omitted.
 */
export const GET = withRateLimit(
  withAuth(async (request) => {
    const userId = request.user.id;

    try {
      // 1. Fetch connected Instagram accounts
      const accounts = await db.query.instagramAccounts.findMany({
        where: eq(instagramAccounts.userId, userId),
      });

      // 2. Fetch associated Reels
      const accountIds = accounts.map((acc) => acc.id);
      let dbReels: typeof reels.$inferSelect[] = [];

      if (accountIds.length > 0) {
        dbReels = await db.query.reels.findMany({
          where: inArray(reels.accountId, accountIds),
        });
      }

      // 3. Fetch generated strategies
      const dbStrategies = await db.query.strategies.findMany({
        where: eq(strategies.userId, userId),
      });

      // 4. Format user data to strictly conform to spec §11.7 JSON Schema
      const exportData = {
        user: {
          id: request.user.id,
          email: request.user.email,
          fullName: request.user.fullName || "",
          createdAt: request.user.createdAt.toISOString(),
        },
        instagramAccounts: accounts.map((acc) => ({
          id: acc.id,
          igUserId: acc.igUserId,
          username: acc.username,
          followersCount: acc.followersCount,
          lastSyncedAt: acc.lastSyncedAt ? acc.lastSyncedAt.toISOString() : null,
          connectedAt: acc.createdAt.toISOString(),
        })),
        reels: dbReels.map((reel) => ({
          id: reel.id,
          igMediaId: reel.igMediaId,
          caption: reel.caption,
          permalink: reel.permalink || "",
          viewsCount: reel.viewsCount,
          displayViews: reel.displayViews,
          likesCount: reel.likesCount,
          commentsCount: reel.commentsCount,
          sharesCount: reel.sharesCount,
          savesCount: reel.savesCount,
          publicReposts: reel.publicReposts,
          skipRate: reel.skipRate ? Number(reel.skipRate) : 0,
          engagementRate: reel.engagementRate ? Number(reel.engagementRate) : null,
          fetchedAt: (reel.fetchedAt || reel.createdAt).toISOString(),
        })),
        strategies: dbStrategies.map((strat) => {
          // Parse period key from dates or default
          const startStr = strat.periodStart ? strat.periodStart.toISOString().slice(0, 10) : "";
          const endStr = strat.periodEnd ? strat.periodEnd.toISOString().slice(0, 10) : "";
          const periodKey = startStr && endStr ? `${startStr}_to_${endStr}` : strat.strategyType || "unknown";

          // Safe extraction of the content calendar array
          let calendarArray: unknown[] = [];
          if (strat.content && typeof strat.content === "object") {
            const calendar = (strat.content as Record<string, unknown>).calendar || 
                           (strat.content as Record<string, unknown>).contentCalendar;
            if (Array.isArray(calendar)) {
              calendarArray = calendar;
            } else if (Array.isArray(strat.content)) {
              calendarArray = strat.content;
            }
          }

          return {
            id: strat.id,
            periodKey,
            strategyType: strat.strategyType || "weekly",
            status: "completed", // default status
            contentCalendar: calendarArray,
            generatedAt: (strat.generatedAt || strat.createdAt).toISOString(),
          };
        }),
      };

      // Log successful export event
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
      await AuthService.logAudit({
        userId,
        action: "user.data_exported",
        resourceType: "user",
        resourceId: userId,
        metadata: {
          accountsCount: accounts.length,
          reelsCount: dbReels.length,
          strategiesCount: dbStrategies.length,
        },
        ipAddress,
      });

      return apiSuccess(exportData);
    } catch (err) {
      return apiError(
        "INTERNAL_ERROR",
        "An unexpected error occurred while compiling GDPR portability export.",
        err instanceof Error ? err.message : undefined
      );
    }
  })
);
