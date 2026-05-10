import { PrismaClient } from "@prisma/client";
import { normalizePostgresUrl } from "@/lib/env";

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = normalizePostgresUrl(process.env.DATABASE_URL);
}

if (process.env.DIRECT_URL) {
  process.env.DIRECT_URL = normalizePostgresUrl(process.env.DIRECT_URL);
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
