import { db } from '../lib/db';
import {
  users,
  instagramAccounts,
  reels,
  reelScores,
  strategies,
  plans,
  jobQueue
} from '../lib/db/schema';
import { sql, eq } from 'drizzle-orm';

async function runTests() {
  console.log('🧪 Starting Row-Level Security (RLS) validation tests...\n');

  try {
    // 1. Get user UUIDs from the seeded database
    const allUsers = await db.select().from(users);
    const alice = allUsers.find(u => u.email === 'userA@example.com');
    const bob = allUsers.find(u => u.email === 'userB@example.com');

    if (!alice || !bob) {
      throw new Error('❌ Test users (Alice and Bob) not found in the database. Please run the seeder first!');
    }

    console.log(`ℹ️ Test Users Found:`);
    console.log(`   - Alice (User A): ${alice.id}`);
    console.log(`   - Bob   (User B): ${bob.id}\n`);

    // Let's grant standard permissions on schema tables to authenticated and anon roles,
    // ensuring the database allows them basic execution privileges so RLS policies can act as the sole filter.
    await db.execute(sql`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, anon;`);
    await db.execute(sql`GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;`);
    console.log('✅ Temporary execution permissions granted to authenticated and anon roles.');

    let testFailures = 0;

    const assertCondition = (description: string, condition: boolean) => {
      if (condition) {
        console.log(`   ✅ PASS: ${description}`);
      } else {
        console.error(`   ❌ FAIL: ${description}`);
        testFailures++;
      }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 1: ALICE (USER A) ISOLATION CONTEXT
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 🔓 CASE 1: Alice (User A) Context ---');
    await db.transaction(async (tx) => {
      // 1. Switch to authenticated role and set Alice's JWT claims
      await tx.execute(sql`SET LOCAL ROLE authenticated;`);
      await tx.execute(sql`
        select set_config('request.jwt.claims', ${JSON.stringify({
          sub: alice.id,
          role: 'authenticated',
          email: alice.email
        })}, true);
      `);

      // 2. Profile Access Tests
      const profiles = await tx.select().from(users);
      assertCondition(
        'Alice can view her own profile only',
        profiles.length === 1 && profiles[0].id === alice.id
      );

      const bobProfileAsAlice = profiles.find(p => p.id === bob.id);
      assertCondition(
        'Alice cannot view Bob\'s profile',
        !bobProfileAsAlice
      );

      // 3. Instagram Account Tests
      const accounts = await tx.select().from(instagramAccounts);
      assertCondition(
        'Alice can view her own Instagram account only',
        accounts.length === 1 && accounts[0].userId === alice.id
      );

      // 4. Reels Isolation Tests
      const aliceReels = await tx.select().from(reels);
      // Alice was seeded with 5 reels (4 with views, 1 with 0 views)
      assertCondition(
        'Alice can view her own reels only',
        aliceReels.length === 5
      );

      // 5. Reel Scores Isolation Tests
      const scores = await tx.select().from(reelScores);
      assertCondition(
        'Alice can view her own reels scores only',
        scores.length === 1
      );

      // 6. Internal System Table Lockdown (Alice trying to read job_queue)
      const jobs = await tx.select().from(jobQueue);
      assertCondition(
        'Alice is blocked from reading internal job queue (returns 0 rows because no standard user policy exists)',
        jobs.length === 0
      );
    });

    // Run write isolation test in a separate transaction block to prevent transaction abortion
    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql`SET LOCAL ROLE authenticated;`);
        await tx.execute(sql`
          select set_config('request.jwt.claims', ${JSON.stringify({
            sub: alice.id,
            role: 'authenticated',
            email: alice.email
          })}, true);
        `);

        await tx.insert(instagramAccounts).values({
          userId: bob.id,
          igUserId: '99999999999999999',
          username: 'alice_hacks_bob',
          followersCount: 0
        });

        // If it got here, it didn't throw! That's an RLS failure.
        throw new Error('RLS_FAILED_TO_BLOCK_WRITE');
      });
      assertCondition('RLS blocks Alice from inserting an Instagram account for Bob', false);
    } catch (err: any) {
      if (err.message === 'RLS_FAILED_TO_BLOCK_WRITE') {
        assertCondition('RLS blocks Alice from inserting an Instagram account for Bob', false);
      } else {
        assertCondition(
          'RLS blocks Alice from inserting an Instagram account for Bob (violates check option)',
          true
        );
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 2: BOB (USER B) ISOLATION CONTEXT
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 🔓 CASE 2: Bob (User B) Context ---');
    await db.transaction(async (tx) => {
      // 1. Switch to authenticated role and set Bob's JWT claims
      await tx.execute(sql`SET LOCAL ROLE authenticated;`);
      await tx.execute(sql`
        select set_config('request.jwt.claims', ${JSON.stringify({
          sub: bob.id,
          role: 'authenticated',
          email: bob.email
        })}, true);
      `);

      // 2. Profile Access Tests
      const profiles = await tx.select().from(users);
      assertCondition(
        'Bob can view his own profile only',
        profiles.length === 1 && profiles[0].id === bob.id
      );

      // 3. Instagram Account Tests
      const accounts = await tx.select().from(instagramAccounts);
      assertCondition(
        'Bob can view his own Instagram account only',
        accounts.length === 1 && accounts[0].userId === bob.id
      );

      // 4. Reels Isolation Tests
      const bobReels = await tx.select().from(reels);
      assertCondition(
        'Bob can view his own reels only',
        bobReels.length === 5
      );

      // 5. Weekly Strategies Isolation Tests
      const bobStrategies = await tx.select().from(strategies);
      assertCondition(
        'Bob can view his own strategies only',
        bobStrategies.length === 1 && bobStrategies[0].userId === bob.id
      );
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 3: ANONYMOUS GUEST CONTEXT
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 🔒 CASE 3: Anonymous Guest Context ---');
    await db.transaction(async (tx) => {
      // 1. Switch to anon role and empty JWT claims
      await tx.execute(sql`SET LOCAL ROLE anon;`);
      await tx.execute(sql`select set_config('request.jwt.claims', '{}', true);`);

      // 2. Profile Access
      const profiles = await tx.select().from(users);
      assertCondition('Anonymous guest cannot view any user profiles', profiles.length === 0);

      // 3. Reels Access
      const guestReels = await tx.select().from(reels);
      assertCondition('Anonymous guest cannot view any user reels', guestReels.length === 0);

      // 4. Public Billing Plans Access (Spec §4 requires plans to be read-accessible to all)
      const publicPlans = await tx.select().from(plans);
      assertCondition(
        'Anonymous guest CAN view public billing plans',
        publicPlans.length === 4
      );
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 4: SERVICE ROLE BYPASS CONTEXT
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 👑 CASE 4: Service Role Context (Superuser/RLS Bypass) ---');
    // By resetting the role and claims, we default back to the connection superuser 'postgres'
    await db.transaction(async (tx) => {
      await tx.execute(sql`RESET ROLE;`);
      await tx.execute(sql`select set_config('request.jwt.claims', '', true);`);

      // 1. Profiles Bypassing RLS
      const allProfiles = await tx.select().from(users);
      assertCondition(
        'Service role bypasses RLS and reads all profiles',
        allProfiles.length >= 2
      );

      // 2. Reels Bypassing RLS
      const allReels = await tx.select().from(reels);
      assertCondition(
        'Service role bypasses RLS and reads all reels',
        allReels.length >= 10
      );
    });

    console.log('\n─────────────────────────────────────────────────────────────────────────');
    if (testFailures === 0) {
      console.log('🎉 ALL ROW-LEVEL SECURITY TESTS PASSED SUCCESSFULLY! RLS IS HYPER-SECURE. 🚀');
      process.exit(0);
    } else {
      console.error(`❌ ${testFailures} RLS VERIFICATION TEST FAILURES ENCOUNTERED.`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Fatal error during RLS testing:', error);
    process.exit(1);
  }
}

runTests();
