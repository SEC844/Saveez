"use server";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/authz";
import { PERMISSION_CATALOG } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export type AdminState = { error?: string; success?: boolean } | null;

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

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "Utilisateur introuvable." };

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return { error: "Rôle introuvable." };

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
      type: "update_settings",
      label: `Admin: profil utilisateur mis à jour (${email})`,
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
      type: "update_settings",
      label: `Admin: mot de passe réinitialisé (${target.email})`,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

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
    data: {
      name,
      description,
      permissions,
      isSystem: false,
    },
  });

  await prisma.actionLog.create({
    data: {
      userId: actor.id,
      type: "update_settings",
      label: `Admin: rôle créé (${name})`,
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
    data: {
      name,
      email,
      passwordHash,
      roleId,
    },
  });

  await prisma.actionLog.create({
    data: {
      userId: actor.id,
      type: "update_settings",
      label: `Admin: utilisateur créé (${email})`,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}
