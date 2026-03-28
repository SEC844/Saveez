// ─── Catalogue des permissions disponibles ───────────────────────────────────
// ⚠️ Ce fichier NE doit PAS importer depuis lib/db.ts — il est importé par
// des Client Components (AdminPanel, etc.).  Les fonctions qui utilisent Prisma
// se trouvent dans lib/rbac-server.ts.

import type { Prisma, User } from "@prisma/client";

export const PERMISSION_CATALOG = [
  "dashboard.read",
  "comptes.manage",
  "imprevus.manage",
  "projections.read",
  "objectifs.manage",
  "historique.read",
  "parametres.manage",
  "profil.manage",
  "admin.access",
  "users.manage",
  "roles.manage",
] as const;

export type Permission = (typeof PERMISSION_CATALOG)[number];

export const STANDARD_PERMISSIONS: Permission[] = [
  "dashboard.read",
  "comptes.manage",
  "imprevus.manage",
  "projections.read",
  "objectifs.manage",
  "historique.read",
  "parametres.manage",
  "profil.manage",
];

export const ADMIN_PERMISSIONS: Permission[] = [
  ...STANDARD_PERMISSIONS,
  "admin.access",
  "users.manage",
  "roles.manage",
];

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserWithRole = User & {
  role: { id: string; name: string; permissions: Prisma.JsonValue } | null;
};

// ─── Helpers purs (pas de Prisma) ────────────────────────────────────────────

function asPermissionArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function getPermissionsFromRole(
  role: { permissions: Prisma.JsonValue } | null | undefined
): string[] {
  return asPermissionArray(role?.permissions);
}

export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission);
}
