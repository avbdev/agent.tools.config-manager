import { PrismaClient } from "@/generated/prisma";

/**
 * Singleton Prisma client with:
 * - Audit-log immutability middleware (blocks UPDATE/DELETE on AuditLog)
 * - Development query logging
 *
 * Never import PrismaClient directly — always import { prisma } from here.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Immutability guard: AuditLog rows must never be modified or deleted.
prisma.$use(async (params, next) => {
  if (params.model === "AuditLog") {
    if (params.action === "update" || params.action === "updateMany") {
      throw new Error("[AuditLog] Mutation forbidden: audit log is immutable.");
    }
    if (params.action === "delete" || params.action === "deleteMany") {
      throw new Error("[AuditLog] Deletion forbidden: audit log is immutable.");
    }
  }
  return next(params);
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
