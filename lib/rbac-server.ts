// ─── Fonctions SERVEUR uniquement — importent Prisma ────────────────────────
// Ne jamais importer ce fichier depuis un Client Component.
// Utilisez lib/rbac.ts pour les constantes et helpers purs.

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { STANDARD_PERMISSIONS, ADMIN_PERMISSIONS } from "@/lib/rbac";

// ─── Rôles système ───────────────────────────────────────────────────────────

/**
 * Crée ou met à jour les rôles système (standard + admin).
 * Appelé une seule fois au login/setup, pas à chaque requête.
 */
export async function ensureSystemRoles() {
  const [standard, admin] = await prisma.$transaction([
    prisma.role.upsert({
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
    }),
    prisma.role.upsert({
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
    }),
  ]);

  return { standard, admin };
}

/**
 * Assigne le rôle standard à un utilisateur sans rôle.
 * Appelé au moment du login pour les anciens comptes migrés.
 */
export async function assignDefaultRoleIfMissing(
  userId: string,
  currentRoleId: string | null
): Promise<{ id: string; name: string; permissions: Prisma.JsonValue } | null> {
  if (currentRoleId) return null;

  const standardRole = await prisma.role.findUnique({ where: { name: "standard" } });
  if (!standardRole) return null;

  await prisma.user.update({
    where: { id: userId },
    data: { roleId: standardRole.id },
  });

  return {
    id: standardRole.id,
    name: standardRole.name,
    permissions: standardRole.permissions,
  };
}

/**
 * Vérifie si un utilisateur est le dernier administrateur.
 */
export async function isLastAdmin(userId: string): Promise<boolean> {
  const adminCount = await prisma.user.count({
    where: { role: { name: "admin" } },
  });

  if (adminCount > 1) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { name: true } } },
  });

  return user?.role?.name === "admin";
}
