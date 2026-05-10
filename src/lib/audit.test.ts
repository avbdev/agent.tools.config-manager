import { describe, it, expect, vi, type Mock } from "vitest";
import { writeAudit, type AuditAction, type AuditContext, type AuditPayload } from "@/lib/audit";

// Mock the prisma module
vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "audit-1" }),
    },
    $use: vi.fn(),
  },
}));

describe("writeAudit", () => {
  const ctx: AuditContext = {
    actorId: "user-1",
    actorEmail: "actor@example.com",
    orgId: "org-1",
    ipAddress: "1.2.3.4",
    userAgent: "Mozilla/5.0",
  };

  const payload: AuditPayload = {
    action: "config.create" as AuditAction,
    resource: "config:abc123",
    resourceType: "ConfigItem",
    diff: { key: "API_KEY" },
  };

  it("calls prisma.auditLog.create with correct data", async () => {
    const { prisma } = await import("@/lib/prisma");
    const createMock = prisma.auditLog.create as Mock;

    await writeAudit(ctx, payload);

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: "user-1",
        actorEmail: "actor@example.com",
        orgId: "org-1",
        action: "config.create",
        resource: "config:abc123",
        resourceType: "ConfigItem",
        ipAddress: "1.2.3.4",
        userAgent: "Mozilla/5.0",
      }),
    });
  });

  it("serializes the diff as JSON string", async () => {
    const { prisma } = await import("@/lib/prisma");
    const createMock = prisma.auditLog.create as Mock;
    createMock.mockClear();

    await writeAudit(ctx, { ...payload, diff: { key: "API_KEY", changed: true } });

    const callArg = createMock.mock.calls[0][0] as { data: { diff: string } };
    const diff = JSON.parse(callArg.data.diff) as unknown;
    expect(diff).toEqual({ key: "API_KEY", changed: true });
  });

  it("writes empty string diff when no diff provided", async () => {
    const { prisma } = await import("@/lib/prisma");
    const createMock = prisma.auditLog.create as Mock;
    createMock.mockClear();

    await writeAudit(ctx, {
      action: "auth.login",
      resource: "user:user-1",
      resourceType: "User",
    });

    const callArg = createMock.mock.calls[0][0] as { data: { diff: string } };
    expect(callArg.data.diff).toBe("");
  });

  it("handles missing optional context fields gracefully", async () => {
    const { prisma } = await import("@/lib/prisma");
    const createMock = prisma.auditLog.create as Mock;
    createMock.mockClear();

    await writeAudit(
      { actorId: "user-1", actorEmail: "a@b.com" },
      { action: "auth.logout", resource: "user:user-1", resourceType: "User" },
    );

    const callArg = createMock.mock.calls[0][0] as { data: { orgId: null; ipAddress: string } };
    expect(callArg.data.orgId).toBeNull();
    expect(callArg.data.ipAddress).toBe("");
  });
});
