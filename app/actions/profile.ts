"use server";

import { prisma } from "@/lib/db";
import { requireAuthUser } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { signOut } from "@/auth";

export type ProfileState = { error?: string; success?: boolean } | null;

// ─── Identité : nom, email, bio, avatar ──────────────────────────────────────

export async function updateProfileIdentityAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const user = await requireAuthUser();
  const name = (formData.get("name") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const bio = (formData.get("bio") as string)?.trim() || null;
  const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || null;
  if (!email) return { error: "Adresse e-mail obligatoire." };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { error: "Adresse e-mail invalide." };
  if (avatarUrl) {
    try {
      const url = new URL(avatarUrl);
      if (!["http:", "https:"].includes(url.protocol))
        return { error: "L'URL de l'avatar doit commencer par http:// ou https://" };
    } catch {
      return { error: "URL d'avatar invalide." };
    }
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== user.id)
    return { error: "Cette adresse e-mail est déjà utilisée." };
  await prisma.user.update({ where: { id: user.id }, data: { name, email, bio, avatarUrl } });
  await prisma.actionLog.create({
    data: { userId: user.id, type: "update_settings", label: "Profil mis à jour" },
  });
  revalidatePath("/profil");
  revalidatePath("/");
  return { success: true };
}

// ─── Données financières (revenus, épargne, objectif, fonds de sécurité) ────

export async function updateFinancialProfileAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  try {
    const user = await requireAuthUser();
    const objectifBase = parseFloat(formData.get("objectifBase") as string);
    const fondsSecurite = parseFloat(formData.get("fondsSecurite") as string);
    const epargneActuelle = parseFloat(formData.get("epargneActuelle") as string);
    const revenuNetRaw = formData.get("revenuNet") as string;
    const revenuNet = revenuNetRaw ? parseFloat(revenuNetRaw) : null;

    if (isNaN(objectifBase) || objectifBase < 0)
      return { error: "Objectif mensuel invalide." };
    if (isNaN(fondsSecurite) || fondsSecurite < 0)
      return { error: "Fonds de sécurité invalide." };
    if (isNaN(epargneActuelle) || epargneActuelle < 0)
      return { error: "Épargne actuelle invalide." };
    if (revenuNet !== null && (isNaN(revenuNet) || revenuNet < 0))
      return { error: "Revenu net invalide." };

    await prisma.user.update({
      where: { id: user.id },
      data: { objectifBase, fondsSecurite, epargneActuelle, revenuNet },
    });
    await prisma.actionLog.create({
      data: { userId: user.id, type: "update_settings", label: "Profil financier mis à jour" },
    });
    revalidatePath("/profil");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("[updateFinancialProfileAction]", err);
    return { error: err instanceof Error ? err.message : "Erreur serveur." };
  }
}

// ─── Changer le mot de passe ─────────────────────────────────────────────────

export async function updateMyPasswordAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const user = await requireAuthUser();
  const currentPassword = (formData.get("currentPassword") as string) ?? "";
  const newPassword = (formData.get("newPassword") as string) ?? "";
  const confirm = (formData.get("confirmPassword") as string) ?? "";
  if (!currentPassword || !newPassword || !confirm)
    return { error: "Tous les champs sont obligatoires." };
  if (newPassword.length < 12)
    return { error: "Le nouveau mot de passe doit contenir au moins 12 caractères." };
  if (newPassword !== confirm)
    return { error: "La confirmation ne correspond pas." };
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { error: "Utilisateur introuvable." };
  const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!isValid) return { error: "Mot de passe actuel incorrect." };
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await prisma.actionLog.create({
    data: { userId: user.id, type: "update_settings", label: "Mot de passe modifié" },
  });
  revalidatePath("/parametres");
  return { success: true };
}

// ─── Supprimer son compte ────────────────────────────────────────────────────

export async function deleteAccountAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const user = await requireAuthUser();
  const confirm = (formData.get("confirm") as string)?.trim();
  if (confirm !== "SUPPRIMER")
    return { error: "Veuillez taper SUPPRIMER pour confirmer." };

  // Supprimer toutes les données (cascade) puis l'utilisateur lui-même
  await prisma.user.delete({ where: { id: user.id } });

  // Déconnecter — signOut lance une redirection NEXT_REDIRECT en interne
  // Le cast satisfait TypeScript (la fonction ne retourne jamais réellement ici)
  return (await signOut({ redirectTo: "/login" })) as never;
}
