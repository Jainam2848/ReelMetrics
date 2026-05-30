/**
 * Single Strategy Endpoint — GET /api/strategies/[id]
 * 
 * Fetches the full detailed content strategy JSON body by its primary key.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { strategies } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const GET = withRateLimit(
  withAuth(async (request, context) => {
    const { id } = (await context.params) as { id: string };

    // 1. Fetch from database verifying ownership
    const [strategy] = await db
      .select()
      .from(strategies)
      .where(
        and(
          eq(strategies.id, id),
          eq(strategies.userId, request.user.id)
        )
      )
      .limit(1);

    if (!strategy) {
      return apiError("RESOURCE_NOT_FOUND", "Strategy not found or access denied");
    }

    return apiSuccess(strategy);
  })
);

export const PATCH = withRateLimit(
  withAuth(async (request, context) => {
    const { id } = (await context.params) as { id: string };

    try {
      const body = await request.json();
      const { content } = body as { content: any };

      if (!content) {
        return apiError("VALIDATION_ERROR", "Content object is required");
      }

      // 1. Check ownership
      const [existing] = await db
        .select({ id: strategies.id, content: strategies.content })
        .from(strategies)
        .where(
          and(
            eq(strategies.id, id),
            eq(strategies.userId, request.user.id)
          )
        )
        .limit(1);

      if (!existing) {
        return apiError("RESOURCE_NOT_FOUND", "Strategy not found or access denied");
      }

      // 2. Merge content properties
      const updatedContent = {
        ...(existing.content as Record<string, any> ?? {}),
        ...content,
      };

      const [updated] = await db
        .update(strategies)
        .set({
          content: updatedContent,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(strategies.id, id),
            eq(strategies.userId, request.user.id)
          )
        )
        .returning();

      return apiSuccess(updated);
    } catch (error) {
      console.error("Failed to update strategy:", error);
      return apiError("INTERNAL_ERROR", "Failed to update strategy");
    }
  })
);

