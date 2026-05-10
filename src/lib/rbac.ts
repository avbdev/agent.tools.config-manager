import { Role } from "@prisma/client";

export function canManageSecrets(role: Role) {
  return role === Role.ADMIN || role === Role.EDITOR;
}

export function canManageUsers(role: Role) {
  return role === Role.ADMIN;
}
