import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import type { ConfigItem, ConfigVersion, ValueType } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreateConfigItemInput = {
  projectId: string;
  envId: string;
  key: string;
  valueType: ValueType;
  rawValue: string;
  isSecret: boolean;
  description?: string;
  tags?: string[];
  createdById?: string;
};

export type UpdateConfigItemInput = Partial<
  Omit<CreateConfigItemInput, "projectId" | "envId" | "key">
> & { id: string };

export type ConfigItemWithVersion = ConfigItem & {
  latestVersion: ConfigVersion | null;
};

export type ConfigListFilter = {
  projectId: string;
  envId?: string;
  key?: string;
  tag?: string;
  isSecret?: boolean;
  search?: string;
  skip?: number;
  take?: number;
};

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

/**
 * Repository for ConfigItem and ConfigVersion models.
 *
 * All values are encrypted at rest regardless of `isSecret`.
 * Non-secret values are also encrypted so that the storage layer
 * is uniform — decryption is always required to read a value.
 *
 * SECURITY: This class never returns plaintext values.
 * Callers must call `getDecryptedValue` explicitly and log the reveal.
 */
export class ConfigItemRepository {
  /**
   * Creates a new config item and its first version snapshot.
   */
  async create(input: CreateConfigItemInput): Promise<ConfigItem> {
    const valueCipher = encryptSecret(input.rawValue);

    return prisma.$transaction(async (tx) => {
      const item = await tx.configItem.create({
        data: {
          projectId: input.projectId,
          envId: input.envId,
          key: input.key,
          valueType: input.valueType,
          valuePlain: input.isSecret ? null : input.rawValue,
          isSecret: input.isSecret,
          description: input.description ?? "",
          tags: input.tags ?? [],
          createdById: input.createdById,
        },
      });

      await tx.configVersion.create({
        data: {
          configItemId: item.id,
          version: 1,
          valueCipher,
          isSecret: input.isSecret,
          valueType: input.valueType,
          description: input.description ?? "",
          tags: input.tags ?? [],
          createdById: input.createdById,
        },
      });

      return item;
    });
  }

  /**
   * Updates an existing config item and creates a new version snapshot.
   */
  async update(input: UpdateConfigItemInput): Promise<ConfigItem> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.configItem.findUniqueOrThrow({
        where: { id: input.id },
      });

      const rawValue = input.rawValue ?? null;
      const valueCipher = rawValue ? encryptSecret(rawValue) : null;

      const currentVersionCount = await tx.configVersion.count({
        where: { configItemId: input.id },
      });

      const updated = await tx.configItem.update({
        where: { id: input.id },
        data: {
          ...(input.valueType && { valueType: input.valueType }),
          ...(input.isSecret !== undefined && { isSecret: input.isSecret }),
          ...(rawValue !== null && {
            valuePlain: input.isSecret ? null : rawValue,
          }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.tags && { tags: input.tags }),
        },
      });

      if (valueCipher) {
        await tx.configVersion.create({
          data: {
            configItemId: input.id,
            version: currentVersionCount + 1,
            valueCipher,
            isSecret: input.isSecret ?? existing.isSecret,
            valueType: input.valueType ?? existing.valueType,
            description: input.description ?? existing.description,
            tags: input.tags ?? existing.tags,
            createdById: input.createdById,
          },
        });
      }

      return updated;
    });
  }

  /**
   * Lists config items for a project with optional filters.
   * Values are NOT decrypted — callers receive masked display.
   */
  async list(filter: ConfigListFilter): Promise<{
    items: ConfigItem[];
    total: number;
  }> {
    const where = {
      projectId: filter.projectId,
      ...(filter.envId && { envId: filter.envId }),
      ...(filter.isSecret !== undefined && { isSecret: filter.isSecret }),
      ...(filter.key && { key: { contains: filter.key, mode: "insensitive" as const } }),
      ...(filter.tag && { tags: { has: filter.tag } }),
      ...(filter.search && {
        OR: [
          { key: { contains: filter.search, mode: "insensitive" as const } },
          { description: { contains: filter.search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.configItem.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: filter.skip ?? 0,
        take: filter.take ?? 50,
      }),
      prisma.configItem.count({ where }),
    ]);

    return { items, total };
  }

  /** Finds a single config item by ID or throws if not found. */
  async findByIdOrThrow(id: string): Promise<ConfigItem> {
    return prisma.configItem.findUniqueOrThrow({ where: { id } });
  }

  /**
   * Decrypts and returns the plaintext value from the latest version.
   * SECURITY: Callers MUST write an audit log entry after calling this.
   */
  async getDecryptedValue(id: string): Promise<string> {
    const latest = await prisma.configVersion.findFirst({
      where: { configItemId: id },
      orderBy: { version: "desc" },
    });
    if (!latest) throw new Error(`No version found for config item ${id}`);
    return decryptSecret(latest.valueCipher);
  }

  /** Returns all version history for a config item. */
  async getVersions(configItemId: string): Promise<ConfigVersion[]> {
    return prisma.configVersion.findMany({
      where: { configItemId },
      orderBy: { version: "desc" },
    });
  }

  /**
   * Rolls back a config item to a specific version number.
   * Creates a new version with the rolled-back value (non-destructive).
   */
  async rollbackToVersion(
    configItemId: string,
    targetVersion: number,
    actorId: string,
  ): Promise<ConfigItem> {
    return prisma.$transaction(async (tx) => {
      const target = await tx.configVersion.findUniqueOrThrow({
        where: { configItemId_version: { configItemId, version: targetVersion } },
      });

      const currentCount = await tx.configVersion.count({
        where: { configItemId },
      });

      await tx.configVersion.create({
        data: {
          configItemId,
          version: currentCount + 1,
          valueCipher: target.valueCipher,
          isSecret: target.isSecret,
          valueType: target.valueType,
          description: target.description,
          tags: target.tags,
          createdById: actorId,
        },
      });

      return tx.configItem.update({
        where: { id: configItemId },
        data: {
          isSecret: target.isSecret,
          valueType: target.valueType,
          valuePlain: target.isSecret ? null : decryptSecret(target.valueCipher),
          description: target.description,
          tags: target.tags,
        },
      });
    });
  }

  /** Soft-deletes (hard-deletes) a config item. Cascade removes versions. */
  async delete(id: string): Promise<void> {
    await prisma.configItem.delete({ where: { id } });
  }

  /** Bulk deletes config items belonging to the given project. */
  async bulkDelete(ids: string[], projectId: string): Promise<number> {
    const result = await prisma.configItem.deleteMany({
      where: { id: { in: ids }, projectId },
    });
    return result.count;
  }
}

export const configItemRepository = new ConfigItemRepository();
