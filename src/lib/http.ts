import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function badRequest(message = "Invalid request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export function asErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", issues: error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
