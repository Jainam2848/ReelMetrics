import { NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * GET /api/health
 * Public shallow health check endpoint (spec §13.2).
 */
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: env.APP_VERSION || "1.0.0",
  });
}
