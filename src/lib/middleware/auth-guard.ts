import { getCurrentUser, type SessionUser } from "@/lib/auth";
import { unauthorized } from "@/lib/http";
import type { NextResponse } from "next/server";

export type AuthenticatedHandler = (
  req: Request,
  user: SessionUser,
) => Promise<NextResponse> | NextResponse;

/**
 * Authentication guard middleware for API route handlers.
 *
 * Validates the session cookie, resolves the current user, and passes
 * the authenticated user to the inner handler. Returns 401 if no valid
 * session is found.
 *
 * @example
 * export const GET = withAuth(async (req, user) => {
 *   return NextResponse.json({ email: user.email });
 * });
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async function (req: Request): Promise<NextResponse> {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return handler(req, user);
  };
}

/**
 * Elevation guard — wraps `withAuth` and additionally requires that the
 * session has an active elevated claim (re-authenticated within 10 minutes).
 *
 * Use for sensitive operations: secret reveal, cert private key access.
 *
 * @example
 * export const POST = withElevation(async (req, user) => {
 *   // user.isElevated is guaranteed true here
 * });
 */
export function withElevation(handler: AuthenticatedHandler) {
  return withAuth(async (req, user) => {
    if (!user.isElevated) {
      return unauthorized("Re-authentication required for this action");
    }
    return handler(req, user);
  });
}
