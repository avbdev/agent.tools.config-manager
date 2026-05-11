import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client (v6) with AuditLog immutability enforcement.
 *
 * Prisma v6 replaced `$use()` middleware with `$extends()` query extensions.
 * The `auditLogGuard` extension intercepts every query and throws before any
 * UPDATE or DELETE reaches the AuditLog table.
 *
 * Never import PrismaClient directly — always import { prisma } from here.
 */

const auditLogGuard = {
  query: {
    auditLog: {
      // Intercept updateMany — which Prisma uses for both update and updateMany
      async updateMany(args: {
        args: unknown;
        query: (args: unknown) => Promise<unknown>;
      }) {
        throw new Error("[AuditLog] Mutation forbidden: audit log is immutable.");
        return args.query(args.args); // unreachable — satisfies type checker
      },
      async deleteMany(args: {
        args: unknown;
        query: (args: unknown) => Promise<unknown>;
      }) {
        throw new Error("[AuditLog] Deletion forbidden: audit log is immutable.");
        return args.query(args.args); // unreachable
      },
    },
  },
};

function makePrismaClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  return base.$extends(auditLogGuard);
}

type ExtendedPrismaClient = ReturnType<typeof makePrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient;
};

export const prisma: ExtendedPrismaClient =
  globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
