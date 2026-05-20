import { db } from "@/lib/db";
import { users, auditLog, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  subscription?: {
    id: string;
    userId: string;
    planId: string;
    stripeSubId: string | null;
    stripeCustomerId: string | null;
    status: string | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    cancelAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

/**
 * Service class handling all Core Auth & Profile operations.
 */
export class AuthService {
  /**
   * Fetches the current authenticated user's profile.
   * If a record doesn't exist yet, it safely creates one on the fly (auto-sync).
   */
  static async getCurrentUser(supabase: SupabaseClient): Promise<UserProfile | null> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Query Drizzle database
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      with: {
        subscription: true,
      },
    });

    if (dbUser) {
      return dbUser as unknown as UserProfile;
    }

    // Auto-sync: Create user profile if authenticated in Supabase but not in our db
    try {
      return await db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(users)
          .values({
            id: user.id,
            email: user.email!,
            fullName: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatarUrl: user.user_metadata?.avatar_url || null,
          })
          .returning();

        if (!newUser) {
          throw new Error("Failed to create user profile");
        }

        // Create a default free plan subscription for the new user
        const [newSub] = await tx
          .insert(subscriptions)
          .values({
            userId: newUser.id,
            planId: "free",
            status: "active",
          })
          .returning();

        if (!newSub) {
          throw new Error("Failed to create default free subscription");
        }

        return {
          ...newUser,
          subscription: newSub,
        } as unknown as UserProfile;
      });
    } catch (syncError) {
      console.error("Failed to auto-sync authenticated user to db:", syncError);
      return null;
    }
  }

  /**
   * Updates user profile fields.
   */
  static async updateProfile(
    userId: string,
    data: { fullName?: string | null; avatarUrl?: string | null }
  ): Promise<UserProfile | null> {
    const [updated] = await db
      .update(users)
      .set({
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) return null;

    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    return {
      ...updated,
      subscription: sub || null,
    } as unknown as UserProfile;
  }

  /**
   * Cascade deletes a user account (GDPR Article 17 Right to Erasure).
   * Note: DB level FK cascades delete records from subscriptions, instagram_accounts, etc.
   * Nullifies foreign keys on audit_log so that historical compliance logs remain anonymized.
   */
  static async deleteAccount(userId: string, ipAddress?: string | null): Promise<void> {
    // 1. Log account deletion to audit log before purging the user profile
    await this.logAudit({
      userId,
      action: "user.deleted",
      resourceType: "user",
      resourceId: userId,
      metadata: { message: "GDPR right to erasure requested. User account deleted permanently." },
      ipAddress,
    });

    // 2. Perform DB deletion in transaction
    await db.transaction(async (tx) => {
      await tx.delete(users).where(eq(users.id, userId));
    });

    // 3. Remove user record from Supabase Auth using the administrative service role client
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      throw new Error(`Failed to purge Supabase auth user record: ${error.message}`);
    }
  }

  /**
   * Inserts an audit log entry for system actions, such as login events or security violations.
   */
  static async logAudit(params: {
    userId: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
    ipAddress?: string | null;
  }): Promise<void> {
    try {
      await db.insert(auditLog).values({
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || null,
        metadata: params.metadata || {},
        ipAddress: params.ipAddress || null,
      });
    } catch (err) {
      // Never crash the application flow due to audit logging issues, but log it
      console.error("Audit log insertion failed:", err);
    }
  }
}
