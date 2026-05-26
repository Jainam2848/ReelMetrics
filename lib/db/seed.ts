import { db } from './index';
import {
  users,
  subscriptions,
  instagramAccounts,
  reels,
  reelScores,
  strategies,
  usageTracking,
  auditLog,
  plans
} from './schema';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Clean up existing data to allow safe re-runs
    console.log('🧹 Clearing existing database records...');
    await db.delete(usageTracking);
    await db.delete(auditLog);
    await db.delete(strategies);
    await db.delete(reelScores);
    await db.delete(reels);
    await db.delete(instagramAccounts);
    await db.delete(subscriptions);
    await db.delete(users);
    await db.delete(plans);
    console.log('✨ Database cleared.');

    // 1.5. Seed Default Plans
    console.log('📦 Seeding default plans...');
    await db.insert(plans).values([
      {
        id: 'free',
        name: 'Free',
        priceMonthly: 0,
        maxAccounts: 1,
        maxReels: 10,
        aiTier: 'gpt-4o-mini',
        features: { trendDetection: false, contentCalendar: false }
      },
      {
        id: 'creator',
        name: 'Creator',
        priceMonthly: 39,
        maxAccounts: 2,
        maxReels: 50,
        aiTier: 'gpt-4o-mini',
        features: { trendDetection: false, contentCalendar: true }
      },
      {
        id: 'pro',
        name: 'Pro',
        priceMonthly: 89,
        maxAccounts: 5,
        maxReels: 200,
        aiTier: 'gpt-4o',
        features: { trendDetection: true, contentCalendar: true }
      },
      {
        id: 'agency',
        name: 'Agency',
        priceMonthly: 249,
        maxAccounts: 20,
        maxReels: 1000,
        aiTier: 'gpt-4o',
        features: { trendDetection: true, contentCalendar: true, teamAccess: true, whiteLabel: true, priorityAi: true }
      }
    ]);
    console.log('✅ Seeded default plans.');

    // 2. Insert Test Users
    console.log('👤 Seeding test users...');
    const [userA] = await db.insert(users).values({
      email: 'userA@example.com',
      fullName: 'Alice Vance',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
    }).returning();

    const [userB] = await db.insert(users).values({
      email: 'userB@example.com',
      fullName: 'Bob Sterling',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
    }).returning();

    if (!userA || !userB) {
      throw new Error('Failed to insert test users during seeding.');
    }

    console.log(`✅ Seeded users: Alice (${userA.id}), Bob (${userB.id})`);

    // 3. Seed Subscriptions
    console.log('💳 Seeding subscriptions...');
    await db.insert(subscriptions).values({
      userId: userA.id,
      planId: 'free',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await db.insert(subscriptions).values({
      userId: userB.id,
      planId: 'creator',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    console.log('✅ Seeded subscriptions: Alice (Free), Bob (Creator)');

    // 4. Seed Instagram Accounts
    console.log('📸 Seeding Instagram accounts...');
    const [igAccountA] = await db.insert(instagramAccounts).values({
      userId: userA.id,
      igUserId: '17841400000000001',
      username: 'alice_reels',
      followersCount: 1250,
      syncStatus: 'completed',
      lastSyncedAt: new Date()
    }).returning();

    const [igAccountB] = await db.insert(instagramAccounts).values({
      userId: userB.id,
      igUserId: '17841400000000002',
      username: 'bob_creations',
      followersCount: 15400,
      syncStatus: 'completed',
      lastSyncedAt: new Date()
    }).returning();

    if (!igAccountA || !igAccountB) {
      throw new Error('Failed to insert Instagram accounts during seeding.');
    }

    console.log('✅ Seeded Instagram accounts connected to users.');

    // 5. Seed Reels for Alice (5 reels, one has 0 views for division-by-zero validation)
    console.log('📹 Seeding reels for Alice...');
    const aliceReelsData = [
      {
        igMediaId: '18029300000000001',
        caption: 'Unboxing the new tech gear! 📦🔥 #tech #unboxing',
        mediaUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
        permalink: 'https://www.instagram.com/reel/C_alice1/',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        viewsCount: 1200,
        totalViews: 1200,
        displayViews: 1200,
        metricSource: 'unified_views',
        likesCount: 120,
        commentsCount: 15,
        sharesCount: 25,
        savesCount: 10,
        reach: 1100,
        skipRate: '42.50',
        engagementRate: '14.1667'
      },
      {
        igMediaId: '18029300000000002',
        caption: 'A day in the life of a solo founder 💻☕️ #solopreneur #setup',
        mediaUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12',
        permalink: 'https://www.instagram.com/reel/C_alice2/',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        viewsCount: 4500,
        totalViews: 4500,
        displayViews: 4500,
        metricSource: 'unified_views',
        likesCount: 450,
        commentsCount: 30,
        sharesCount: 85,
        savesCount: 50,
        reach: 4100,
        skipRate: '28.10',
        engagementRate: '13.6667'
      },
      {
        igMediaId: '18029300000000003',
        caption: 'Struggling with CSS grid? Here is a 10s guide! 🚀 #css #dev',
        mediaUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8',
        permalink: 'https://www.instagram.com/reel/C_alice3/',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        viewsCount: 800,
        totalViews: 800,
        displayViews: 800,
        metricSource: 'unified_views',
        likesCount: 40,
        commentsCount: 2,
        sharesCount: 5,
        savesCount: 3,
        reach: 750,
        skipRate: '65.20',
        engagementRate: '6.2500'
      },
      {
        // 0 view case to test zero-guard division handling!
        igMediaId: '18029300000000004',
        caption: 'Just published a new blog post! Check the bio 📝 #blogger',
        mediaUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643',
        permalink: 'https://www.instagram.com/reel/C_alice4/',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        viewsCount: 0,
        totalViews: 0,
        displayViews: 0,
        metricSource: 'unified_views',
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        savesCount: 0,
        reach: 0,
        skipRate: null,
        engagementRate: null
      },
      {
        igMediaId: '18029300000000005',
        caption: 'My mechanical keyboard setup sounds AMAZING ⌨️🎶 #keyboard #asmr',
        mediaUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3',
        permalink: 'https://www.instagram.com/reel/C_alice5/',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        viewsCount: 25000,
        totalViews: 25000,
        displayViews: 25000,
        metricSource: 'unified_views',
        likesCount: 3200,
        commentsCount: 150,
        sharesCount: 450,
        savesCount: 300,
        reach: 21000,
        skipRate: '15.40',
        engagementRate: '16.4000'
      }
    ];

    const seededAliceReels = [];
    for (const rData of aliceReelsData) {
      const [r] = await db.insert(reels).values({
        accountId: igAccountA.id,
        ...rData
      }).returning();
      if (!r) {
        throw new Error('Failed to insert Alice\'s reel.');
      }
      seededAliceReels.push(r);
    }
    console.log('✅ Seeded Alice\'s reels successfully.');

    // 6. Seed Reels for Bob (5 reels, high-view viral cases)
    console.log('📹 Seeding reels for Bob...');
    const bobReelsData = [
      {
        igMediaId: '18029300000000006',
        caption: 'How we scaled our SaaS to $10k MRR in 30 days! 🚀📈 #saas #startup',
        mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
        permalink: 'https://www.instagram.com/reel/C_bob1/',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        viewsCount: 150000,
        totalViews: 150000,
        displayViews: 150000,
        metricSource: 'unified_views',
        likesCount: 18500,
        commentsCount: 650,
        sharesCount: 1200,
        savesCount: 950,
        reach: 135000,
        skipRate: '18.90',
        engagementRate: '14.2000'
      },
      {
        igMediaId: '18029300000000007',
        caption: '3 productivity hacks I wish I knew at 20 🧠⏱️ #productivity #lifehacks',
        mediaUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe',
        permalink: 'https://www.instagram.com/reel/C_bob2/',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        viewsCount: 32000,
        totalViews: 32000,
        displayViews: 32000,
        metricSource: 'unified_views',
        likesCount: 3800,
        commentsCount: 120,
        sharesCount: 310,
        savesCount: 180,
        reach: 29000,
        skipRate: '35.40',
        engagementRate: '13.7813'
      },
      {
        igMediaId: '18029300000000008',
        caption: 'Is Remote Work dying? Here is what data says 🌍💼 #remotework #career',
        mediaUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
        permalink: 'https://www.instagram.com/reel/C_bob3/',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        viewsCount: 95000,
        totalViews: 95000,
        displayViews: 95000,
        metricSource: 'unified_views',
        likesCount: 11200,
        commentsCount: 420,
        sharesCount: 880,
        savesCount: 650,
        reach: 88000,
        skipRate: '22.10',
        engagementRate: '13.8421'
      },
      {
        igMediaId: '18029300000000009',
        caption: 'Why I left my $250k FAANG job to build a startup 🏢🚀 #faang #engineer',
        mediaUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
        permalink: 'https://www.instagram.com/reel/C_bob4/',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        viewsCount: 12000,
        totalViews: 12000,
        displayViews: 12000,
        metricSource: 'unified_views',
        likesCount: 850,
        commentsCount: 45,
        sharesCount: 50,
        savesCount: 35,
        reach: 11000,
        skipRate: '48.90',
        engagementRate: '8.1667'
      },
      {
        igMediaId: '18029300000000010',
        caption: 'Ultimate desk setup upgrade under $100! 🖥️✨ #desksetup #homeoffice',
        mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
        permalink: 'https://www.instagram.com/reel/C_bob5/',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        viewsCount: 420000,
        totalViews: 420000,
        displayViews: 420000,
        metricSource: 'unified_views',
        likesCount: 52000,
        commentsCount: 2200,
        sharesCount: 6500,
        savesCount: 4800,
        reach: 385000,
        skipRate: '12.30',
        engagementRate: '15.6000'
      }
    ];

    const seededBobReels = [];
    for (const rData of bobReelsData) {
      const [r] = await db.insert(reels).values({
        accountId: igAccountB.id,
        ...rData
      }).returning();
      if (!r) {
        throw new Error('Failed to insert Bob\'s reel.');
      }
      seededBobReels.push(r);
    }
    console.log('✅ Seeded Bob\'s reels successfully.');

    // 7. Seed Reel Scores for Alice's and Bob's Reels
    console.log('🧠 Seeding reel analysis scores (AI reports)...');
    
    const firstAliceReel = seededAliceReels[0];
    const firstBobReel = seededBobReels[0];
    if (!firstAliceReel || !firstBobReel) {
      throw new Error('Failed to retrieve seeded reels for scoring.');
    }

    // Alice's unboxing reel score
    await db.insert(reelScores).values({
      reelId: firstAliceReel.id,
      overallScore: 82,
      hookScore: 85,
      skipRateScore: 78,
      retentionScore: 80,
      ctaScore: 88,
      visualScore: 84,
      audioScore: 80,
      trendScore: 85,
      captionScore: 82,
      timingScore: 88,
      aiAnalysis: {
        strengths: ['Great hook speed, got right into the unboxing', 'Crisp product lighting'],
        weaknesses: ['Music was a bit repetitive', 'Ending was slightly abrupt'],
        opportunities: ['Ask viewers to comment their favorite color of the product to boost ER']
      },
      modelVersion: 'gpt-4o',
      tokensUsed: 1250,
      costUsd: '0.003750',
      scoredAt: new Date()
    });

    // Bob's viral SaaS reel score
    await db.insert(reelScores).values({
      reelId: firstBobReel.id,
      overallScore: 94,
      hookScore: 96,
      skipRateScore: 92,
      retentionScore: 94,
      ctaScore: 95,
      visualScore: 90,
      audioScore: 92,
      trendScore: 98,
      captionScore: 95,
      timingScore: 94,
      aiAnalysis: {
        strengths: ['High-authority topic, excellent screen hook text', 'Perfect pace and transition cuts'],
        weaknesses: ['Slightly technical jargon at 15s mark'],
        opportunities: ['Offer a free template in exchange for newsletter signup']
      },
      modelVersion: 'gpt-4o',
      tokensUsed: 1480,
      costUsd: '0.004440',
      scoredAt: new Date()
    });

    console.log('✅ Seeded reel scores successfully.');

    // 8. Seed Strategies
    console.log('📈 Seeding strategies...');
    await db.insert(strategies).values({
      userId: userB.id,
      accountId: igAccountB.id,
      strategyType: 'weekly',
      content: {
        focus: 'Authority building in the SaaS space',
        tactics: [
          'Create 3 short-form videos showing concrete numbers and dashboards',
          'Include transparent failures along with wins to build trust',
          'Leverage trending business music in low-volume backtracks'
        ],
        postingCadence: 'Monday, Wednesday, Friday at 9:00 AM EST'
      },
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      modelVersion: 'gpt-4o',
      tokensUsed: 2200,
      costUsd: '0.006600',
      generatedAt: new Date()
    });

    console.log('✅ Seeded weekly strategies.');

    // 9. Seed Usage Tracking
    console.log('📊 Seeding usage tracking...');
    const currentMonth = new Date().toISOString().substring(0, 7); // e.g. "2026-05"
    
    await db.insert(usageTracking).values({
      userId: userA.id,
      periodMonth: currentMonth,
      aiCallsCount: 2,
      aiTokensUsed: 2500,
      aiCostUsd: '0.007500',
      reelsAnalyzed: 2,
      strategiesGen: 0,
      apiCallsCount: 15
    });

    await db.insert(usageTracking).values({
      userId: userB.id,
      periodMonth: currentMonth,
      aiCallsCount: 12,
      aiTokensUsed: 18500,
      aiCostUsd: '0.055500',
      reelsAnalyzed: 10,
      strategiesGen: 2,
      apiCallsCount: 142
    });

    console.log('✅ Seeded usage tracking records.');

    // 10. Audit Log
    console.log('📝 Seeding compliance audit logs...');
    await db.insert(auditLog).values({
      userId: userA.id,
      action: 'connect_instagram',
      resourceType: 'instagram_account',
      resourceId: igAccountA.id,
      metadata: { username: 'alice_reels' },
      ipAddress: '127.0.0.1'
    });

    await db.insert(auditLog).values({
      userId: userB.id,
      action: 'generate_strategy',
      resourceType: 'strategy',
      ipAddress: '127.0.0.1'
    });

    console.log('✅ Seeded audit logs.');

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
