import { describe, it, expect } from "vitest";
import { Role } from "@prisma/client";
import { canManageSecrets, canManageUsers } from "@/lib/rbac";

describe("rbac", () => {
  it("enforces secret management roles", () => {
    expect(canManageSecrets(Role.ADMIN)).toBe(true);
    expect(canManageSecrets(Role.EDITOR)).toBe(true);
    expect(canManageSecrets(Role.VIEWER)).toBe(false);
  });

  it("enforces admin-only user management", () => {
    expect(canManageUsers(Role.ADMIN)).toBe(true);
    expect(canManageUsers(Role.EDITOR)).toBe(false);
  });
});
