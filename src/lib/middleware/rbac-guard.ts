import { prisma } from "@/lib/prisma";
import { canCreate, canDelete, canReveal, canManageUsers } from "@/lib/rbac";
import { forbidden, notFound } from "@/lib/http";
import type { OrgMember } from "@prisma/client";
import type { SessionUser } from "@/lib/middleware/auth-guard";
import type { NextResponse } from "next/server";

export type OrgAuthenticatedHandler = (
  req: Request,
  user: SessionUser,
  member: OrgMember,
) => Promise<NextResponse> | NextResponse;

async function resolveMembership(
  orgId: string,
  userId: string,
): Promise<OrgMember | null> {
  return prisma.orgMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
}

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

export function withOrgWrite(
  getOrgId: (req: Request) => string | null,
  handler: OrgAuthenticatedHandler,
) {
  return async (req: Request, user: SessionUser): Promise<NextResponse> => {
    const orgId = getOrgId(req);
    if (!orgId) return notFound("Organization not found");
    const member = await resolveMembership(orgId, user.id);
    if (!member) return notFound("Organization not found");
    if (!canCreate(member.role)) return forbidden("Insufficient permissions");
    return handler(req, user, member);
  };
}

export function withOrgDelete(
  getOrgId: (req: Request) => string | null,
  handler: OrgAuthenticatedHandler,
) {
  return async (req: Request, user: SessionUser): Promise<NextResponse> => {
    const orgId = getOrgId(req);
    if (!orgId) return notFound("Organization not found");
    const member = await resolveMembership(orgId, user.id);
    if (!member) return notFound("Organization not found");
    if (!canDelete(member.role)) return forbidden("Insufficient permissions");
    return handler(req, user, member);
  };
}

export function withSecretReveal(
  getOrgId: (req: Request) => string | null,
  handler: OrgAuthenticatedHandler,
) {
  return async (req: Request, user: SessionUser): Promise<NextResponse> => {
    const orgId = getOrgId(req);
    if (!orgId) return notFound("Organization not found");
    const member = await resolveMembership(orgId, user.id);
    if (!member) return notFound("Organization not found");
    if (!canReveal(member.role)) return forbidden("Insufficient permissions");
    return handler(req, user, member);
  };
}

export function withOrgAdmin(
  getOrgId: (req: Request) => string | null,
  handler: OrgAuthenticatedHandler,
) {
  return async (req: Request, user: SessionUser): Promise<NextResponse> => {
    const orgId = getOrgId(req);
    if (!orgId) return notFound("Organization not found");
    const member = await resolveMembership(orgId, user.id);
    if (!member) return notFound("Organization not found");
    if (!canManageUsers(member.role)) return forbidden("Admin role required");
    return handler(req, user, member);
  };
}
