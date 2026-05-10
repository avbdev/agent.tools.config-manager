import { prisma } from "@/lib/prisma";
import { orgCanWrite, orgCanDelete, orgCanRevealSecrets, orgCanManageMembers } from "@/lib/rbac";
import { forbidden, notFound } from "@/lib/http";
import type { OrgMember } from "@/generated/prisma";
import type { SessionUser } from "@/lib/auth";
import type { NextResponse } from "next/server";

export type OrgAuthenticatedHandler = (
  req: Request,
  user: SessionUser,
  member: OrgMember,
) => Promise<NextResponse> | NextResponse;

// ---------------------------------------------------------------------------
// Internal membership resolver
// ---------------------------------------------------------------------------

async function resolveMembership(
  orgId: string,
  userId: string,
): Promise<OrgMember | null> {
  return prisma.orgMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
}

// ---------------------------------------------------------------------------
// RBAC guard factories
// ---------------------------------------------------------------------------

/**
 * Asserts the user is a member of the given org (any role).
 * Returns 404 if the org is not found to avoid org enumeration.
 */
export function withOrgMember(
  getOrgId: (req: Request) => string | null,
  handler: OrgAuthenticatedHandler,
) {
  return async (req: Request, user: SessionUser): Promise<NextResponse> => {
    const orgId = getOrgId(req);
    if (!orgId) return notFound("Organization not found");

    const member = await resolveMembership(orgId, user.id);
    if (!member) return notFound("Organization not found");

    return handler(req, user, member);
  };
}

/**
 * Asserts the user has write permission in the org.
 */
export function withOrgWrite(
  getOrgId: (req: Request) => string | null,
  handler: OrgAuthenticatedHandler,
) {
  return async (req: Request, user: SessionUser): Promise<NextResponse> => {
    const orgId = getOrgId(req);
    if (!orgId) return notFound("Organization not found");

    const member = await resolveMembership(orgId, user.id);
    if (!member) return notFound("Organization not found");

    if (!orgCanWrite(member.role)) {
      return forbidden("Insufficient permissions to write in this organization");
    }

    return handler(req, user, member);
  };
}

/**
 * Asserts the user has delete permission in the org.
 */
export function withOrgDelete(
  getOrgId: (req: Request) => string | null,
  handler: OrgAuthenticatedHandler,
) {
  return async (req: Request, user: SessionUser): Promise<NextResponse> => {
    const orgId = getOrgId(req);
    if (!orgId) return notFound("Organization not found");

    const member = await resolveMembership(orgId, user.id);
    if (!member) return notFound("Organization not found");

    if (!orgCanDelete(member.role)) {
      return forbidden("Insufficient permissions to delete in this organization");
    }

    return handler(req, user, member);
  };
}

/**
 * Asserts the user can reveal secrets AND has an elevated session.
 */
export function withSecretReveal(
  getOrgId: (req: Request) => string | null,
  handler: OrgAuthenticatedHandler,
) {
  return async (req: Request, user: SessionUser): Promise<NextResponse> => {
    const orgId = getOrgId(req);
    if (!orgId) return notFound("Organization not found");

    const member = await resolveMembership(orgId, user.id);
    if (!member) return notFound("Organization not found");

    if (!orgCanRevealSecrets(member.role)) {
      return forbidden("Insufficient permissions to reveal secrets");
    }

    if (!user.isElevated) {
      return forbidden("Re-authentication required to reveal secrets");
    }

    return handler(req, user, member);
  };
}

/**
 * Asserts the user can manage organization members.
 */
export function withOrgAdmin(
  getOrgId: (req: Request) => string | null,
  handler: OrgAuthenticatedHandler,
) {
  return async (req: Request, user: SessionUser): Promise<NextResponse> => {
    const orgId = getOrgId(req);
    if (!orgId) return notFound("Organization not found");

    const member = await resolveMembership(orgId, user.id);
    if (!member) return notFound("Organization not found");

    if (!orgCanManageMembers(member.role)) {
      return forbidden("Admin role required for this operation");
    }

    return handler(req, user, member);
  };
}
