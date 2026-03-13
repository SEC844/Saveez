import { prisma } from "@/lib/db";
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

function asPermissionArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function ensureSystemRoles() {
  const standard = await prisma.role.upsert({
    where: { name: "standard" },
    update: {
      isSystem: true,
      permissions: STANDARD_PERMISSIONS,
      description: "Rôle utilisateur standard",
    },
    create: {
      name: "standard",
      isSystem: true,
      permissions: STANDARD_PERMISSIONS,
      description: "Rôle utilisateur standard",
    },
  });

  const admin = await prisma.role.upsert({
    where: { name: "admin" },
    update: {
      isSystem: true,
      permissions: ADMIN_PERMISSIONS,
      description: "Rôle administrateur",
    },
    create: {
      name: "admin",
      isSystem: true,
      permissions: ADMIN_PERMISSIONS,
      description: "Rôle administrateur",
    },
  });

  return { standard, admin };
}

export async function ensureUserRolesAssigned() {
  const { standard, admin } = await ensureSystemRoles();

  const allUsers = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, roleId: true },
  });

  if (allUsers.length === 0) return;

  const firstUserId = allUsers[0].id;
  const updates = allUsers
    .filter((user) => !user.roleId)
    .map((user) =>
      prisma.user.update({
        where: { id: user.id },
        data: { roleId: user.id === firstUserId ? admin.id : standard.id },
      })
    );

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }
}

export function getPermissionsFromRole(role: { permissions: Prisma.JsonValue } | null | undefined): string[] {
  return asPermissionArray(role?.permissions);
}

export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission);
}

export type UserWithRole = User & {
  role: { id: string; name: string; permissions: Prisma.JsonValue } | null;
};
