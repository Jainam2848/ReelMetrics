import * as fs from "fs";
import * as path from "path";

// Manually load environment variables from .env file before imports
function loadEnv(): void {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const match = line.trim().match(/^([^#\s=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1];
        let val = match[2]?.trim() ?? "";
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (key) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, name: string): void {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ❌ ${name}`);
  }
}

function section(title: string): void {
  console.log(`\n── ${title} ──`);
}

async function runTests() {
  // Dynamically import dependencies after env is loaded
  const { db } = await import("@/lib/db");
  const { trendSignals, nicheTrendsFeed } = await import("@/lib/db/schema");
  const { TrendService } = await import("@/lib/services/trends.service");
  const { eq, and, gte, desc } = await import("drizzle-orm");

  section("1. getTrendPower Freshness Decay Math");
  {
    const now = new Date();
    
    // Test Case A: Freshly created (0 hours old, time_sensitivity_hours = 24)
    const sigA = {
      createdAt: now,
      signalData: { time_sensitivity_hours: 24 }
    };
    const powerA = TrendService.getTrendPower(sigA);
    assert(powerA === 1.0, `Power of new signal is 1.0 (got ${powerA})`);

    // Test Case B: 12 hours old (12 hours since creation, time_sensitivity_hours = 24)
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const sigB = {
      createdAt: twelveHoursAgo,
      signalData: { time_sensitivity_hours: 24 }
    };
    const powerB = TrendService.getTrendPower(sigB);
    assert(Math.abs(powerB - 0.5) < 0.001, `Power of 12h-old signal (half-life of 24h) is 0.5 (got ${powerB})`);

    // Test Case C: 30 hours old (decayed, time_sensitivity_hours = 24)
    const thirtyHoursAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000);
    const sigC = {
      createdAt: thirtyHoursAgo,
      signalData: { time_sensitivity_hours: 24 }
    };
    const powerC = TrendService.getTrendPower(sigC);
    assert(powerC === 0.0, `Power of 30h-old signal (decayed past 24h) is 0.0 (got ${powerC})`);
  }

  section("2. refreshGlobalTrendsFeed Ingestion & Unique Upsert");
  {
    const testNiche = "comedy"; // using comedy as the test niche
    await db.delete(trendSignals).where(eq(trendSignals.niche, testNiche));

    // Mock successful LLM returning high-signal structured JSON
    const mockTrendOutput = {
      surging_hashtags: [
        { tag: "skitcomedy", estimated_reach: 25000, trend_strength: 92 },
        { tag: "corporatelife", estimated_reach: 12000, trend_strength: 78 }
      ],
      trending_audios: [
        { name: "Sarcastic laugh track", platform_id: "audio_123", genre: "comedy", surge_percentage: 155.2 }
      ],
      viral_formats: [
        { name: "POV: SMM meeting", description: "Acting as different agency roles", example_accounts: ["@smmqueen"] }
      ],
      editing_patterns: [
        { description: "Fast cuts on syllable drop", effectiveness_score: 9 }
      ],
      topic_surges: [
        { topic: "Remote work comedy", angle: "Skit on corporate timezone rules", estimated_engagement_lift: 3.5 }
      ],
      time_sensitivity_hours: 48
    };

    (global as any).__mockCallLLMWithFallback = async (params: any) => {
      return {
        success: true,
        data: mockTrendOutput,
        modelId: "gemini-2.0-flash",
        tokensUsed: 1200,
        costUsd: 0.00025,
        latencyMs: 340,
        attempts: ["gemini-2.0-flash"]
      };
    };

    console.log("  Running structured refreshGlobalTrendsFeed...");
    await TrendService.refreshGlobalTrendsFeed();

    const signals = await db
      .select()
      .from(trendSignals)
      .where(eq(trendSignals.niche, testNiche));

    assert(signals.length === 6, `Inserted exactly 6 structured trend signals (got ${signals.length})`);
    
    const audioSig = signals.find(s => s.signalType === "audio");
    assert(audioSig !== undefined, "Trending audio signal exists in the database");
    assert(audioSig?.dayKey.includes("sarcastic-laugh-track"), `Sanitize helper successfully parsed delimiter spacing (got ${audioSig?.dayKey})`);
    assert(audioSig?.signalData.surge_percentage === 155.2, "Signal JSONB data elements preserved accurately");

    console.log("  Running refresh again to test 24h deduplication...");
    await TrendService.refreshGlobalTrendsFeed();

    const signalsAfterDuplicate = await db
      .select()
      .from(trendSignals)
      .where(eq(trendSignals.niche, testNiche));
    
    assert(signalsAfterDuplicate.length === 6, `Deduplication unique constraint verified: total count remains 6 (got ${signalsAfterDuplicate.length})`);
  }

  section("3. Smart Fallback Ingestion Loop");
  {
    const testNiche = "fitness"; // using fitness as the fallback test niche
    await db.delete(trendSignals).where(eq(trendSignals.niche, testNiche));

    // Seed a valid historical signal created 5 hours ago
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    const dayKey = `${testNiche}:instagram:audio:gym-motivation-track:2026-05-29`;
    
    await db
      .insert(trendSignals)
      .values({
        niche: testNiche,
        platform: "instagram",
        signalType: "audio",
        dayKey,
        signalData: { name: "gym-motivation-track", surge_percentage: 95.0, time_sensitivity_hours: 24 },
        source: "llm",
        createdAt: fiveHoursAgo,
        updatedAt: fiveHoursAgo,
      });

    // Mock LLM failure to trigger fallback cache routine
    (global as any).__mockCallLLMWithFallback = async (params: any) => {
      return {
        success: false,
        error: "LLM API Key Exhausted",
        attempts: ["gemini-2.0-flash"]
      };
    };

    console.log("  Running refreshGlobalTrendsFeed during LLM outage...");
    await TrendService.refreshGlobalTrendsFeed();

    // Query signals for fitness
    const signals = await db
      .select()
      .from(trendSignals)
      .where(eq(trendSignals.niche, testNiche));

    // Should now contain the seeded signal from yesterday AND the new fallback signal for today!
    assert(signals.length === 2, `Smart fallback registered: new signal created alongside old signal (got ${signals.length})`);
    
    const fallbackSig = signals.find(s => s.source === "fallback");
    assert(fallbackSig !== undefined, "Fallback source set successfully");
    assert(fallbackSig?.signalData.stale === true, "Signal JSONB marked with 'stale: true' metadata");
    
    const todayStr = new Date().toISOString().slice(0, 10);
    assert(fallbackSig?.dayKey.endsWith(todayStr) === true, `Fallback dayKey successfully mapped to today's date (got ${fallbackSig?.dayKey})`);
  }

  section("Cleanup Test Data");
  {
    await db.delete(trendSignals).where(eq(trendSignals.niche, "comedy"));
    await db.delete(trendSignals).where(eq(trendSignals.niche, "fitness"));
    await db.delete(nicheTrendsFeed).where(eq(nicheTrendsFeed.niche, "comedy"));
    await db.delete(nicheTrendsFeed).where(eq(nicheTrendsFeed.niche, "fitness"));
    delete (global as any).__mockCallLLMWithFallback;
    assert(true, "Database pristine cleanup complete");
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Test Execution Results: ${passed} passed, ${failed} failed`);

  if (failures.length > 0) {
    console.log("\nFailed test details:");
    for (const f of failures) {
      console.log(`  ❌ ${f}`);
    }
    process.exit(1);
  } else {
    console.log("\n✅ All structured trend engine tests successfully passed!");
    process.exit(0);
  }
}

runTests();
