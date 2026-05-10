import type { OrgRole, Role } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Global role guards (system-level)
// ---------------------------------------------------------------------------

/**
 * Returns true if the user has ADMIN or SUPERADMIN global role,
 * allowing them to manage users across the system.
 */
export function canManageUsers(role: Role): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

/**
 * Returns true if the user has any write-capable global role.
 */
export function canManageSecrets(role: Role): boolean {
  return role === "ADMIN" || role === "EDITOR" || role === "SUPERADMIN";
}

// ---------------------------------------------------------------------------
// Org-scoped role guards
// ---------------------------------------------------------------------------

/**
 * Returns true if the org role permits reading configs and metadata.
 * All org members may read — the parameter is accepted for future fine-grained control.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function orgCanRead(_orgRole: OrgRole): boolean {
  return true; // All org members can read
}

/**
 * Returns true if the org role permits writing configs / secrets.
 */
export function orgCanWrite(orgRole: OrgRole): boolean {
  return orgRole === "OWNER" || orgRole === "ADMIN" || orgRole === "EDITOR";
}

/**
 * Returns true if the org role permits deleting resources.
 */
export function orgCanDelete(orgRole: OrgRole): boolean {
  return orgRole === "OWNER" || orgRole === "ADMIN";
}

/**
 * Returns true if the org role permits revealing secret plaintext values.
 * Note: the caller must ALSO verify session elevation (`isSessionElevated`).
 */
export function orgCanRevealSecrets(orgRole: OrgRole): boolean {
  return orgRole === "OWNER" || orgRole === "ADMIN" || orgRole === "EDITOR";
}

/**
 * Returns true if the org role permits managing members and API tokens.
 */
export function orgCanManageMembers(orgRole: OrgRole): boolean {
  return orgRole === "OWNER" || orgRole === "ADMIN";
}

// ---------------------------------------------------------------------------
// RBAC guard helper (throws on failure, for use in route handlers)
// ---------------------------------------------------------------------------

export type RbacResult =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Asserts that an RBAC check passed. Throws a typed error if not.
 * Use at the start of route handlers after resolving the session.
 *
 * @example
 * assertRbac(orgCanWrite(member.role), "Insufficient org permissions to write configs");
 */
export function assertRbac(allowed: boolean, reason: string): void {
  if (!allowed) {
    const err = new Error(reason) as Error & { code: "RBAC_DENIED" };
    err.code = "RBAC_DENIED";
    throw err;
  }
}

/** Type guard for RBAC denial errors. */
export function isRbacDenied(err: unknown): err is Error & { code: "RBAC_DENIED" } {
  return err instanceof Error && (err as Error & { code?: string }).code === "RBAC_DENIED";
}
