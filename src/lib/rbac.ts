import { Role } from "@prisma/client"

/** EDITOR and ADMIN can read and write configs (create, update, reveal). */
export function canManageSecrets(role: Role): boolean {
  return role === Role.ADMIN || role === Role.EDITOR
}

/** Only ADMIN can manage users, roles, and org settings. */
export function canManageUsers(role: Role): boolean {
  return role === Role.ADMIN
}

/** EDITOR and ADMIN can create new configs. */
export function canCreate(role: Role): boolean {
  return role === Role.ADMIN || role === Role.EDITOR
}

/** EDITOR and ADMIN can update existing configs. */
export function canUpdate(role: Role): boolean {
  return role === Role.ADMIN || role === Role.EDITOR
}

/** Only ADMIN can permanently soft-delete configs. */
export function canDelete(role: Role): boolean {
  return role === Role.ADMIN
}

/** EDITOR and ADMIN can reveal encrypted secret values. */
export function canReveal(role: Role): boolean {
  return role === Role.ADMIN || role === Role.EDITOR
}
