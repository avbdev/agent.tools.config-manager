import { prisma } from "@/lib/prisma";
import type { Organization, OrgMember, OrgRole } from "@/generated/prisma";

/**
 * Repository for Organization and OrgMember models.
 */
export class OrganizationRepository {
  /** Creates a new organization and adds the creator as OWNER. */
  async create(
    slug: string,
    name: string,
    ownerId: string,
  ): Promise<Organization> {
    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { slug, name },
      });

      await tx.orgMember.create({
        data: { orgId: org.id, userId: ownerId, role: "OWNER" },
      });

      return org;
    });
  }

  /** Returns all organizations that the given user is a member of. */
  async listForUser(userId: string): Promise<Organization[]> {
    const memberships = await prisma.orgMember.findMany({
      where: { userId },
      include: { org: true },
    });
    return memberships.map((m) => m.org);
  }

  /** Finds an organization by slug. */
  async findBySlug(slug: string): Promise<Organization | null> {
    return prisma.organization.findUnique({ where: { slug } });
  }

  /** Finds an organization by ID. */
  async findByIdOrThrow(id: string): Promise<Organization> {
    return prisma.organization.findUniqueOrThrow({ where: { id } });
  }

  /** Returns the org membership record for a user, or null. */
  async getMembership(orgId: string, userId: string): Promise<OrgMember | null> {
    return prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId } },
    });
  }

  /** Lists all members of an organization. */
  async listMembers(
    orgId: string,
  ): Promise<(OrgMember & { user: { id: string; email: string; name: string | null } })[]> {
    return prisma.orgMember.findMany({
      where: { orgId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  /** Adds a user to an organization with the given role. */
  async addMember(orgId: string, userId: string, role: OrgRole): Promise<OrgMember> {
    return prisma.orgMember.create({
      data: { orgId, userId, role },
    });
  }

  /** Updates a member's role. */
  async updateMemberRole(
    orgId: string,
    userId: string,
    role: OrgRole,
  ): Promise<OrgMember> {
    return prisma.orgMember.update({
      where: { orgId_userId: { orgId, userId } },
      data: { role },
    });
  }

  /** Removes a user from an organization. */
  async removeMember(orgId: string, userId: string): Promise<void> {
    await prisma.orgMember.delete({
      where: { orgId_userId: { orgId, userId } },
    });
  }
}

export const organizationRepository = new OrganizationRepository();
