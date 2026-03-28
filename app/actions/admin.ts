"use server";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/authz";
import { PERMISSION_CATALOG } from "@/lib/rbac";
import { isLastAdmin } from "@/lib/rbac-server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export type AdminState = { error?: string; success?: boolean } | null;

// ─── Utilisateurs ────────────────────────────────────────────────────────────

export async function updateUserAdminAction(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const actor = await requirePermission("users.manage");

  const userId = (formData.get("userId") as string) ?? "";
  const name = (formData.get("name") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const roleId = (formData.get("roleId") as string)?.trim() || null;

  if (!userId || !email || !roleId) {
    return { error: "Données utilisateur invalides." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { error: "Adresse e-mail invalide." };

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { select: { name: true } } },
  });
  if (!target) return { error: "Utilisateur introuvable." };

  const newRole = await prisma.role.findUnique({ where: { id: roleId } });
  if (!newRole) return { error: "Rôle introuvable." };

  // 🛡️ Protection last-admin : empêche de retirer le rôle admin du dernier admin
  if (target.role?.name === "admin" && newRole.name !== "admin") {
    if (await isLastAdmin(userId)) {
      return {
        error:
          "Impossible de retirer le rôle admin du dernier administrateur. Promouvez d'abord un autre utilisateur.",
      };
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    return { error: "Cette adresse e-mail est déjà utilisée." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name, email, roleId },
  });

  await prisma.actionLog.create({
    data: {
      userId: actor.id,
      type: "admin_update_user",
      label: `Admin: profil mis à jour — ${email} → rôle "${newRole.name}"`,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function updateUserPasswordAdminAction(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const actor = await requirePermission("users.manage");

  const userId = (formData.get("userId") as string) ?? "";
  const newPassword = (formData.get("newPassword") as string) ?? "";

  if (!userId || !newPassword) {
    return { error: "Données invalides." };
  }

  if (newPassword.length < 12) {
    return { error: "Le mot de passe doit contenir au moins 12 caractères." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "Utilisateur introuvable." };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await prisma.actionLog.create({
    data: {
      userId: actor.id,
      type: "admin_reset_password",
      label: `Admin: mot de passe réinitialisé — ${target.email}`,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function createUserAdminAction(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const actor = await requirePermission("users.manage");

  const name = (formData.get("name") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";
  const roleId = (formData.get("roleId") as string)?.trim() || "";

  if (!email || !password || !roleId) {
    return { error: "Email, mot de passe et rôle sont obligatoires." };
  }

  if (password.length < 12) {
    return { error: "Le mot de passe doit contenir au moins 12 caractères." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { error: "Adresse e-mail invalide." };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Cette adresse e-mail est déjà utilisée." };

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return { error: "Rôle introuvable." };

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, passwordHash, roleId },
  });

  await prisma.actionLog.create({
    data: {
      userId: actor.id,
      type: "admin_create_user",
      label: `Admin: utilisateur créé — ${email} (rôle "${role.name}")`,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteUserAdminAction(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const actor = await requirePermission("users.manage");

  const userId = (formData.get("userId") as string) ?? "";
  if (!userId) return { error: "Identifiant utilisateur manquant." };

  // 🛡️ Impossible de supprimer son propre compte
  if (userId === actor.id) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { select: { name: true } } },
  });
  if (!target) return { error: "Utilisateur introuvable." };

  // 🛡️ Protection last-admin
  if (target.role?.name === "admin") {
    if (await isLastAdmin(userId)) {
      return {
        error:
          "Impossible de supprimer le dernier administrateur. Promouvez d'abord un autre utilisateur.",
      };
    }
  }

  // Supprimer l'utilisateur (cascade sur ses données via la DB)
  await prisma.user.delete({ where: { id: userId } });

  await prisma.actionLog.create({
    data: {
      userId: actor.id,
      type: "admin_delete_user",
      label: `Admin: utilisateur supprimé — ${target.email}`,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

// ─── Rôles ───────────────────────────────────────────────────────────────────

export async function createRoleAction(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const actor = await requirePermission("roles.manage");

  const name = (formData.get("name") as string)?.trim().toLowerCase();
  const description = (formData.get("description") as string)?.trim() || null;
  const rawPermissions = formData.getAll("permissions").map((x) => String(x));

  if (!name) return { error: "Nom du rôle obligatoire." };
  if (name === "admin" || name === "standard") {
    return { error: "Les rôles système ne peuvent pas être recréés." };
  }

  const permissions = rawPermissions.filter((perm) =>
    (PERMISSION_CATALOG as readonly string[]).includes(perm)
  );
  if (permissions.length === 0) {
    return { error: "Sélectionnez au moins une permission." };
  }

  const exists = await prisma.role.findUnique({ where: { name } });
  if (exists) return { error: "Un rôle avec ce nom existe déjà." };

  await prisma.role.create({
    data: { name, description, permissions, isSystem: false },
  });

  await prisma.actionLog.create({
    data: {
      userId: actor.id,
      type: "admin_create_role",
      label: `Admin: rôle créé — "${name}"`,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function updateRoleAction(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const actor = await requirePermission("roles.manage");

  const roleId = (formData.get("roleId") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const rawPermissions = formData.getAll("permissions").map((x) => String(x));

  if (!roleId) return { error: "Identifiant de rôle manquant." };

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return { error: "Rôle introuvable." };
  if (role.isSystem) {
    return { error: "Les rôles système ne peuvent pas être modifiés manuellement." };
  }

  const permissions = rawPermissions.filter((perm) =>
    (PERMISSION_CATALOG as readonly string[]).includes(perm)
  );
  if (permissions.length === 0) {
    return { error: "Sélectionnez au moins une permission." };
  }

  await prisma.role.update({
    where: { id: roleId },
    data: { description, permissions },
  });

  await prisma.actionLog.create({
    data: {
      userId: actor.id,
      type: "admin_update_role",
      label: `Admin: rôle modifié — "${role.name}"`,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteRoleAction(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const actor = await requirePermission("roles.manage");

  const roleId = (formData.get("roleId") as string)?.trim();
  if (!roleId) return { error: "Identifiant de rôle manquant." };

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { _count: { select: { users: true } } },
  });
  if (!role) return { error: "Rôle introuvable." };
  if (role.isSystem) {
    return { error: "Les rôles système ne peuvent pas être supprimés." };
  }
  if (role._count.users > 0) {
    return {
      error: `Ce rôle est assigné à ${role._count.users} utilisateur(s). Réassignez-les d'abord.`,
    };
  }

  await prisma.role.delete({ where: { id: roleId } });

  await prisma.actionLog.create({
    data: {
      userId: actor.id,
      type: "admin_delete_role",
      label: `Admin: rôle supprimé — "${role.name}"`,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}
