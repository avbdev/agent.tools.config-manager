import { auth } from "@/auth";
import { unauthorized } from "@/lib/http";
import type { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  isElevated?: boolean;
};

export type AuthenticatedHandler = (
  req: Request,
  user: SessionUser,
) => Promise<NextResponse> | NextResponse;

/**
 * Authentication guard — resolves the next-auth v5 session and passes
 * the authenticated user to the inner handler. Returns 401 if no session.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async function (req: Request): Promise<NextResponse> {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();
    const user: SessionUser = {
      id: session.user.id,
      email: session.user.email ?? "",
      role: session.user.role,
    };
    return handler(req, user);
  };
}

/**
 * Elevation guard — next-auth v5 does not use session elevation.
 * In EPIC-123 Phase 1, reveal is protected by RBAC + rate limiting only.
 * This wrapper is kept for compatibility with existing route handlers.
 */
export function withElevation(handler: AuthenticatedHandler) {
  return withAuth(handler);
}
