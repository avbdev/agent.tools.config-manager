import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Extracts the real client IP from a request, guarding against spoofed
 * X-Forwarded-For headers by only trusting that header when X-Real-IP
 * originates from a trusted proxy CIDR (configured via TRUSTED_PROXY_CIDRS).
 *
 * TRUSTED_PROXY_CIDRS is a comma-separated list of IPv4 CIDR blocks, e.g.:
 *   "10.0.0.0/8,172.16.0.0/12,127.0.0.1/32"
 */
export function getClientIp(req: Request): string {
  const trustedCidrs = (process.env.TRUSTED_PROXY_CIDRS ?? "127.0.0.1/32")
    .split(",")
    .map((s) => s.trim())

  const realIp = req.headers.get("x-real-ip") ?? ""
  const xff = req.headers.get("x-forwarded-for")

  // Only honour X-Forwarded-For when x-real-ip comes from a trusted proxy.
  // This prevents an external client from spoofing their IP via the header.
  if (xff && realIp && isInTrustedCidr(realIp, trustedCidrs)) {
    return xff.split(",")[0]?.trim() ?? realIp
  }

  return realIp || "unknown"
}

function isInTrustedCidr(ip: string, cidrs: string[]): boolean {
  return cidrs.some((cidr) => {
    if (cidr === ip) return true
    const [network, bits] = cidr.split("/")
    if (!bits || !network) return false
    const mask = ~((1 << (32 - parseInt(bits, 10))) - 1) >>> 0
    const ipInt = ipToInt(ip)
    const netInt = ipToInt(network)
    return (ipInt & mask) === (netInt & mask)
  })
}

function ipToInt(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0
}

export function badRequest(message = "Invalid request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * @deprecated Use `tooManyRequestsResponse` from `@/lib/rate-limit` instead,
 * which accepts a `Date` and computes Retry-After automatically.
 */
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
