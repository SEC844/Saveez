"use server";

import { prisma } from "@/lib/db";
import { requireAuthUser } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export type ProfileState = { error?: string; success?: boolean } | null;

export async function updateProfileIdentityAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const user = await requireAuthUser();

  const name = (formData.get("name") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) return { error: "Adresse e-mail obligatoire." };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Adresse e-mail invalide." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== user.id) {
    return { error: "Cette adresse e-mail est déjà utilisée." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, email },
  });

  await prisma.actionLog.create({
    data: {
      userId: user.id,
      type: "update_settings",
      label: "Profil mis à jour",
    },
  });

  revalidatePath("/profil");
  return { success: true };
}

export async function updateMyPasswordAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const user = await requireAuthUser();

  const currentPassword = (formData.get("currentPassword") as string) ?? "";
  const newPassword = (formData.get("newPassword") as string) ?? "";
  const confirm = (formData.get("confirmPassword") as string) ?? "";

  if (!currentPassword || !newPassword || !confirm) {
    return { error: "Tous les champs mot de passe sont obligatoires." };
  }

  if (newPassword.length < 12) {
    return { error: "Le nouveau mot de passe doit contenir au moins 12 caractères." };
  }

  if (newPassword !== confirm) {
    return { error: "La confirmation du mot de passe ne correspond pas." };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { error: "Utilisateur introuvable." };

  const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!isValid) {
    return { error: "Mot de passe actuel incorrect." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await prisma.actionLog.create({
    data: {
      userId: user.id,
      type: "update_settings",
      label: "Mot de passe modifié",
    },
  });

  revalidatePath("/profil");
  return { success: true };
}
