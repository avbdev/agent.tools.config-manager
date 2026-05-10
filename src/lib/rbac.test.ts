import { describe, it, expect } from "vitest";
import {
  canManageUsers,
  canManageSecrets,
  orgCanRead,
  orgCanWrite,
  orgCanDelete,
  orgCanRevealSecrets,
  orgCanManageMembers,
  assertRbac,
  isRbacDenied,
} from "@/lib/rbac";

describe("rbac — global role guards", () => {
  describe("canManageUsers", () => {
    it("allows ADMIN", () => expect(canManageUsers("ADMIN")).toBe(true));
    it("allows SUPERADMIN", () => expect(canManageUsers("SUPERADMIN")).toBe(true));
    it("denies EDITOR", () => expect(canManageUsers("EDITOR")).toBe(false));
    it("denies VIEWER", () => expect(canManageUsers("VIEWER")).toBe(false));
  });

  describe("canManageSecrets", () => {
    it("allows ADMIN", () => expect(canManageSecrets("ADMIN")).toBe(true));
    it("allows EDITOR", () => expect(canManageSecrets("EDITOR")).toBe(true));
    it("allows SUPERADMIN", () => expect(canManageSecrets("SUPERADMIN")).toBe(true));
    it("denies VIEWER", () => expect(canManageSecrets("VIEWER")).toBe(false));
  });
});

describe("rbac — org role guards", () => {
  describe("orgCanRead", () => {
    it("allows all roles", () => {
      expect(orgCanRead("OWNER")).toBe(true);
      expect(orgCanRead("ADMIN")).toBe(true);
      expect(orgCanRead("EDITOR")).toBe(true);
      expect(orgCanRead("VIEWER")).toBe(true);
    });
  });

  describe("orgCanWrite", () => {
    it("allows OWNER, ADMIN, EDITOR", () => {
      expect(orgCanWrite("OWNER")).toBe(true);
      expect(orgCanWrite("ADMIN")).toBe(true);
      expect(orgCanWrite("EDITOR")).toBe(true);
    });
    it("denies VIEWER", () => expect(orgCanWrite("VIEWER")).toBe(false));
  });

  describe("orgCanDelete", () => {
    it("allows OWNER and ADMIN only", () => {
      expect(orgCanDelete("OWNER")).toBe(true);
      expect(orgCanDelete("ADMIN")).toBe(true);
      expect(orgCanDelete("EDITOR")).toBe(false);
      expect(orgCanDelete("VIEWER")).toBe(false);
    });
  });

  describe("orgCanRevealSecrets", () => {
    it("allows OWNER, ADMIN, EDITOR", () => {
      expect(orgCanRevealSecrets("OWNER")).toBe(true);
      expect(orgCanRevealSecrets("ADMIN")).toBe(true);
      expect(orgCanRevealSecrets("EDITOR")).toBe(true);
    });
    it("denies VIEWER", () => expect(orgCanRevealSecrets("VIEWER")).toBe(false));
  });

  describe("orgCanManageMembers", () => {
    it("allows OWNER and ADMIN", () => {
      expect(orgCanManageMembers("OWNER")).toBe(true);
      expect(orgCanManageMembers("ADMIN")).toBe(true);
    });
    it("denies EDITOR and VIEWER", () => {
      expect(orgCanManageMembers("EDITOR")).toBe(false);
      expect(orgCanManageMembers("VIEWER")).toBe(false);
    });
  });
});

describe("assertRbac", () => {
  it("does not throw when allowed is true", () => {
    expect(() => assertRbac(true, "Should not throw")).not.toThrow();
  });

  it("throws with RBAC_DENIED code when allowed is false", () => {
    expect(() => assertRbac(false, "Permission denied")).toThrowError("Permission denied");
  });

  it("thrown error is identified by isRbacDenied", () => {
    try {
      assertRbac(false, "No access");
    } catch (err) {
      expect(isRbacDenied(err)).toBe(true);
    }
  });
});

describe("isRbacDenied", () => {
  it("returns false for a plain Error", () => {
    expect(isRbacDenied(new Error("generic"))).toBe(false);
  });

  it("returns false for non-Error values", () => {
    expect(isRbacDenied("string error")).toBe(false);
    expect(isRbacDenied(null)).toBe(false);
  });
});
