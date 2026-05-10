import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import type { Secret, SecretRevealLog } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreateSecretInput = {
  projectId: string;
  envId: string;
  name: string;
  key: string;
  rawValue: string;
  description?: string;
  tags?: string[];
  expiresAt?: Date;
  createdById?: string;
};

export type UpdateSecretInput = {
  id: string;
  name?: string;
  rawValue?: string;
  description?: string;
  tags?: string[];
  expiresAt?: Date | null;
  rotatedAt?: Date;
  updatedById?: string;
};

export type SecretListFilter = {
  projectId: string;
  envId?: string;
  tag?: string;
  search?: string;
  skip?: number;
  take?: number;
};

/** Safe public representation of a secret — value is always masked. */
export type SecretSummary = Omit<Secret, "valueCipher"> & {
  maskedValue: "••••••••";
};

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

/**
 * Repository for the Secret model.
 *
 * SECURITY CONTRACT:
 * - `valueCipher` is never returned in list/find operations.
 *   The only way to get the plaintext is via `revealValue`, which
 *   requires explicit audit logging by the caller.
 * - All values are AES-256-GCM encrypted before persistence.
 * - `revealValue` records a `SecretRevealLog` within the same transaction.
 */
export class SecretRepository {
  /**
   * Creates a new secret with an AES-encrypted value.
   */
  async create(input: CreateSecretInput): Promise<SecretSummary> {
    const valueCipher = encryptSecret(input.rawValue);

    const secret = await prisma.secret.create({
      data: {
        projectId: input.projectId,
        envId: input.envId,
        name: input.name,
        key: input.key,
        valueCipher,
        description: input.description ?? "",
        tags: input.tags ?? [],
        expiresAt: input.expiresAt ?? null,
        createdById: input.createdById,
      },
    });

    return this.#toSummary(secret);
  }

  /**
   * Updates a secret. If `rawValue` is provided, re-encrypts and sets `rotatedAt`.
   */
  async update(input: UpdateSecretInput): Promise<SecretSummary> {
    const data: Parameters<typeof prisma.secret.update>[0]["data"] = {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.tags && { tags: input.tags }),
      ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt }),
    };

    if (input.rawValue) {
      data.valueCipher = encryptSecret(input.rawValue);
      data.rotatedAt = new Date();
    }

    const updated = await prisma.secret.update({
      where: { id: input.id },
      data,
    });

    return this.#toSummary(updated);
  }

  /**
   * Returns secrets for a project without cipher values.
   */
  async list(filter: SecretListFilter): Promise<{
    items: SecretSummary[];
    total: number;
  }> {
    const where = {
      projectId: filter.projectId,
      ...(filter.envId && { envId: filter.envId }),
      ...(filter.tag && { tags: { has: filter.tag } }),
      ...(filter.search && {
        OR: [
          { key: { contains: filter.search, mode: "insensitive" as const } },
          { name: { contains: filter.search, mode: "insensitive" as const } },
          { description: { contains: filter.search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [secrets, total] = await Promise.all([
      prisma.secret.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: filter.skip ?? 0,
        take: filter.take ?? 50,
        // Explicitly omit valueCipher from select
        select: {
          id: true,
          projectId: true,
          envId: true,
          name: true,
          key: true,
          description: true,
          tags: true,
          rotatedAt: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
          createdById: true,
          valueCipher: false,
        },
      }),
      prisma.secret.count({ where }),
    ]);

      return {
        items: secrets.map((s) => ({ ...s, maskedValue: "••••••••" as const })),
        total,
      };
  }

  /** Finds a secret by ID (without cipher value). */
  async findByIdOrThrow(id: string): Promise<SecretSummary> {
    const secret = await prisma.secret.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        projectId: true,
        envId: true,
        name: true,
        key: true,
        description: true,
        tags: true,
        rotatedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        createdById: true,
        valueCipher: false,
      },
    });
    return { ...secret, maskedValue: "••••••••" as const };
  }

  /**
   * Reveals (decrypts) a secret value.
   * Records a `SecretRevealLog` within the same transaction.
   *
   * SECURITY: Caller MUST have verified session elevation before calling this.
   *
   * @param id      - Secret ID.
   * @param actorId - ID of the user performing the reveal.
   * @param ip      - Client IP address for audit.
   * @param ua      - User-agent string for audit.
   * @returns The plaintext secret value.
   */
  async revealValue(
    id: string,
    actorId: string,
    ip: string,
    ua: string,
  ): Promise<string> {
    return prisma.$transaction(async (tx) => {
      const secret = await tx.secret.findUniqueOrThrow({
        where: { id },
        select: { valueCipher: true },
      });

      await tx.secretRevealLog.create({
        data: {
          secretId: id,
          actorId,
          ipAddress: ip,
          userAgent: ua,
        },
      });

      return decryptSecret(secret.valueCipher);
    });
  }

  /** Returns reveal history for a secret. */
  async getRevealLogs(secretId: string): Promise<SecretRevealLog[]> {
    return prisma.secretRevealLog.findMany({
      where: { secretId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  /** Deletes a secret. */
  async delete(id: string): Promise<void> {
    await prisma.secret.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  #toSummary(secret: Secret): SecretSummary {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { valueCipher: _cipher, ...rest } = secret;
    return { ...rest, maskedValue: "••••••••" };
  }
}

export const secretRepository = new SecretRepository();
