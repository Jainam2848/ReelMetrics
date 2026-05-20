import { db } from "../lib/db";
import { users, subscriptions, instagramAccounts, reels, strategies, auditLog } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { AuthService } from "../lib/services/auth.service";
import { apiSuccess, apiError } from "../lib/api/response";
import { uuidSchema, paginationSchema, dateRangeSchema } from "../lib/validators/common";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log("\n==================================================");
  console.log("🏃 STARTING AUTH & CORE API INTEGRATION TEST SUITE");
  console.log("==================================================\n");

  // ─── 1. TEST ZOD COMMON VALIDATORS ────────────────────────────────────────
  console.log("--- 1. Testing Zod Validators ---");
  
  // UUID Schema
  const validUuid = "10f2b1a2-3ae7-4e4a-8f67-ae8806d4b5ce";
  const invalidUuid = "not-a-uuid-at-all";
  assert(uuidSchema.safeParse(validUuid).success, "Valid UUID should parse successfully");
  assert(!uuidSchema.safeParse(invalidUuid).success, "Invalid UUID should fail validation");

  // Pagination Schema
  const validPagination = paginationSchema.parse({ page: "2", limit: "15", order: "asc" });
  assert(validPagination.page === 2, "Pagination should coerce page string to number");
  assert(validPagination.limit === 15, "Pagination should coerce limit string to number");
  assert(validPagination.order === "asc", "Pagination should accept 'asc' order");

  const invalidPagination = paginationSchema.safeParse({ limit: "999", order: "invalid" });
  assert(!invalidPagination.success, "Pagination should fail on extreme limit and invalid order");

  // Date Range Schema
  const validRange = dateRangeSchema.safeParse({ from: "2026-05-20T00:00:00Z", to: "2026-05-21T00:00:00Z" });
  assert(validRange.success, "Valid date range (from <= to) should succeed");

  const invalidRange = dateRangeSchema.safeParse({ from: "2026-05-21T00:00:00Z", to: "2026-05-20T00:00:00Z" });
  assert(!invalidRange.success, "Invalid date range (from > to) should fail validation");


  // ─── 2. TEST API RESPONSE ENVELOPES ───────────────────────────────────────
  console.log("\n--- 2. Testing API Success and Error Envelopes ---");
  
  const successRes = apiSuccess({ foo: "bar" }, { page: 1, limit: 10, total: 100 });
  const successJson = await successRes.json();
  assert(successRes.status === 200, "Success response should have HTTP 200 status");
  assert(successJson.success === true, "Success response success property should be true");
  assert(successJson.data.foo === "bar", "Success payload should match original data");
  assert(successJson.meta.total === 100, "Success metadata should contain pagination fields");

  const errorRes = apiError("RATE_LIMIT_EXCEEDED", "Too many requests. Please cool down.");
  const errorJson = await errorRes.json();
  assert(errorRes.status === 429, "Rate limit exceeded response should have HTTP 429 status");
  assert(errorJson.success === false, "Error response success property should be false");
  assert(errorJson.error.code === "RATE_LIMIT_EXCEEDED", "Error payload should match standard error code");
  assert(errorJson.error.message === "Too many requests. Please cool down.", "Error message should match custom text");


  // ─── 3. TEST AUTH SERVICE CRUD & AUDIT LOGGING ─────────────────────────────
  console.log("\n--- 3. Testing Auth Service and Auditing ---");

  // Insert a test user
  const testUserId = "99999999-9999-9999-9999-999999999999";
  const testEmail = "gdpr.test@example.com";

  // Clean up if previous crashed run left it behind
  await db.delete(users).where(eq(users.id, testUserId));

  console.log("Creating test user record...");
  const [createdUser] = await db.insert(users).values({
    id: testUserId,
    email: testEmail,
    fullName: "GDPR Test Candidate",
    avatarUrl: "https://avatar.url/me",
  }).returning();

  if (!createdUser) {
    throw new Error("❌ createdUser is undefined");
  }

  assert(createdUser.fullName === "GDPR Test Candidate", "User profile created successfully");

  // Update Profile
  console.log("Updating test user profile...");
  const updatedUser = await AuthService.updateProfile(testUserId, {
    fullName: "GDPR Erased Candidate",
  });
  assert(updatedUser?.fullName === "GDPR Erased Candidate", "Profile name updated successfully");

  // Audit Logging
  console.log("Inserting audit log entry...");
  await AuthService.logAudit({
    userId: testUserId,
    action: "test.audit_logged",
    resourceType: "test",
    resourceId: testUserId,
    metadata: { testKey: "testValue" },
    ipAddress: "127.0.0.1",
  });

  const audits = await db.select().from(auditLog).where(eq(auditLog.userId, testUserId));
  assert(audits.length === 1, "Audit log record inserted successfully");
  const firstAudit = audits[0];
  if (!firstAudit) {
    throw new Error("❌ firstAudit is undefined");
  }
  assert(firstAudit.action === "test.audit_logged", "Audit log action matches");
  assert(firstAudit.ipAddress === "127.0.0.1", "Audit log IP address matches");


  // ─── 4. TEST GDPR CASCADE ACCOUNT DELETIONS ───────────────────────────────
  console.log("\n--- 4. Testing GDPR Cascade Account Deletions ---");

  // Connect dependency rows to verify cascade trigger deletion
  console.log("Inserting connected Instagram account...");
  const [igAccount] = await db.insert(instagramAccounts).values({
    userId: testUserId,
    igUserId: "ig_test_user_gdpr",
    username: "ig_gdpr_dev",
  }).returning();

  if (!igAccount) {
    throw new Error("❌ igAccount is undefined");
  }

  console.log("Inserting connected Reels...");
  await db.insert(reels).values({
    accountId: igAccount.id,
    igMediaId: "ig_media_gdpr_test",
    timestamp: new Date(),
    viewsCount: 150,
  }).returning();

  console.log("Inserting connected Strategies...");
  await db.insert(strategies).values({
    userId: testUserId,
    accountId: igAccount.id,
    strategyType: "weekly",
  }).returning();

  console.log("Inserting connected Subscriptions...");
  await db.insert(subscriptions).values({
    userId: testUserId,
    planId: "free",
    status: "active",
  }).returning();

  // Assert rows are active
  const startAccounts = await db.select().from(instagramAccounts).where(eq(instagramAccounts.userId, testUserId));
  const startSubscriptions = await db.select().from(subscriptions).where(eq(subscriptions.userId, testUserId));
  const startReels = await db.select().from(reels).where(eq(reels.accountId, igAccount.id));
  const startStrategies = await db.select().from(strategies).where(eq(strategies.userId, testUserId));

  assert(startAccounts.length === 1, "Connected Instagram Account exists before deletion");
  assert(startSubscriptions.length === 1, "Subscription exists before deletion");
  assert(startReels.length === 1, "Reel exists before deletion");
  assert(startStrategies.length === 1, "Strategy exists before deletion");

  // Execute account deletion
  // Note: Since we are running outside the live Supabase Auth environment here, we'll mock/intercept
  // the delete user from Supabase auth. The AuthService.deleteAccount performs this on SupabaseAdmin.
  // We will manually execute the database transaction block representing the deletion, and intercept the rest.
  console.log("Executing DB GDPR transactional cascade deletion...");
  await db.transaction(async (tx) => {
    await tx.delete(users).where(eq(users.id, testUserId));
  });

  // Verify DB Row Purge
  const endUser = await db.select().from(users).where(eq(users.id, testUserId));
  const endAccounts = await db.select().from(instagramAccounts).where(eq(instagramAccounts.userId, testUserId));
  const endSubscriptions = await db.select().from(subscriptions).where(eq(subscriptions.userId, testUserId));
  const endReels = await db.select().from(reels).where(eq(reels.accountId, igAccount.id));
  const endStrategies = await db.select().from(strategies).where(eq(strategies.userId, testUserId));

  assert(endUser.length === 0, "User record permanently purged");
  assert(endAccounts.length === 0, "Instagram accounts cascaded and purged");
  assert(endSubscriptions.length === 0, "Subscriptions cascaded and purged");
  assert(endReels.length === 0, "Reels cascaded and purged");
  assert(endStrategies.length === 0, "Strategies cascaded and purged");

  // Verify Audit Log is ANONYMIZED (userId is NULL, but metadata/trail is retained)
  const endAudits = await db.select().from(auditLog).where(eq(auditLog.action, "test.audit_logged"));
  assert(endAudits.length === 1, "Audit log trail is successfully retained");
  const firstEndAudit = endAudits[0];
  if (!firstEndAudit) {
    throw new Error("❌ firstEndAudit is undefined");
  }
  assert(firstEndAudit.userId === null, "GDPR Compliant Anonymization: Audit log userId set to NULL");

  // Final Cleanup of audit log trail
  await db.delete(auditLog).where(eq(auditLog.action, "test.audit_logged"));

  console.log("\n==================================================");
  console.log("🎉 ALL AUTH & CORE API INTEGRATION TESTS PASSED 100%");
  console.log("==================================================\n");
}

runTests().catch((err) => {
  console.error("❌ TEST RUNNER ERROR:", err);
  process.exit(1);
});
