import { prisma } from "@/lib/prisma";

export async function writeAudit(actorId: string, action: string, details: string) {
  await prisma.auditLog.create({
    data: { actorId, action, details },
  });
}
