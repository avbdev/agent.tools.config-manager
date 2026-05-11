import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

export async function GET() {
  const checks: Record<string, string> = {}
  let healthy = true

  // Database readiness check
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db = "ok"
  } catch {
    checks.db = "error"
    healthy = false
  }

  // Redis readiness check
  try {
    const pong = await redis.ping()
    checks.redis = pong === "PONG" ? "ok" : "error"
    if (checks.redis === "error") healthy = false
  } catch {
    checks.redis = "error"
    healthy = false
  }

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
      timestamp: new Date().toISOString(),
      ...checks,
    },
    { status: healthy ? 200 : 503 },
  )
}
