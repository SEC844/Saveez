"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { ensureSystemRoles } from "@/lib/rbac-server";
import { isRegistrationEnabled } from "@/lib/app-settings";

export type SetupState = {
  error?: string;
} | null;

export async function setupAction(
  _prevState: SetupState,
  formData: FormData
): Promise<SetupState> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;
  if (!email || !password) {
    return { error: "Veuillez remplir tous les champs obligatoires." };
  }

  if (password.length < 12) {
    return { error: "Le mot de passe doit contenir au moins 12 caractères." };
  }

  if (password !== confirm) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Adresse e-mail invalide." };
  }

  // Vérifier si l'inscription est autorisée (sauf pour le premier utilisateur)
  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    const regEnabled = await isRegistrationEnabled();
    if (!regEnabled) {
      return { error: "La création de compte est désactivée par l'administrateur." };
    }
  }

  // Hash with bcrypt (cost factor 12 — good balance of security/speed)
  const passwordHash = await bcrypt.hash(password, 12);

  const { admin, standard } = await ensureSystemRoles();
  const existingUsersCount = existingCount;
  const roleId = existingUsersCount === 0 ? admin.id : standard.id;

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name || null,
      roleId,
    },
  });

  redirect("/login");
}
