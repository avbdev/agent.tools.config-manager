import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isRbacDenied } from "@/lib/rbac";

// ---------------------------------------------------------------------------
// Client IP extraction
// ---------------------------------------------------------------------------

/**
 * Extracts the real client IP from request headers.
 * Handles Vercel/CF `x-forwarded-for` header chains.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Extracts the User-Agent string from a request.
 */
export function getUserAgent(req: Request): string {
  return req.headers.get("user-agent") ?? "";
}

// ---------------------------------------------------------------------------
// Standard response constructors
// ---------------------------------------------------------------------------

/** 400 Bad Request */
export function badRequest(message = "Invalid request"): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** 401 Unauthorized */
export function unauthorized(message = "Authentication required"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

/** 403 Forbidden */
export function forbidden(message = "Insufficient permissions"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** 404 Not Found */
export function notFound(message = "Resource not found"): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

/** 409 Conflict */
export function conflict(message = "Resource already exists"): NextResponse {
  return NextResponse.json({ error: message }, { status: 409 });
}

/** 429 Too Many Requests */
export function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

// ---------------------------------------------------------------------------
// Unified error response handler
// ---------------------------------------------------------------------------

/**
 * Maps known error types to appropriate HTTP responses.
 * Internal error details are NEVER leaked to the client.
 *
 * - `ZodError` → 400 with field-level messages
 * - RBAC denial → 403
 * - Everything else → 500 (with console.error for server-side observability)
 */
export function asErrorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 400 },
    );
  }

  if (isRbacDenied(error)) {
    return forbidden(error.message);
  }

  // Log the real error server-side but never expose it to the client
  console.error("[API Error]", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
