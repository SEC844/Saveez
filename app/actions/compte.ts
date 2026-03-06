"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

export type CompteState = { error?: string; success?: boolean } | null;

// ─── Créer un compte spécial ──────────────────────────────────────────────────

export async function createCompteAction(
  _prev: CompteState,
  formData: FormData
): Promise<CompteState> {
  const userId = await getAuthUserId();

  const type = (formData.get("type") as string)?.trim();
  const label = (formData.get("label") as string)?.trim();

  if (!type || !["vacances", "autre"].includes(type)) {
    return { error: "Type de compte invalide." };
  }
  if (!label || label.length < 2) {
    return { error: "Veuillez saisir un nom pour ce compte." };
  }

  await prisma.compte.create({
    data: { userId, type, label, actif: true },
  });

  revalidatePath("/parametres");
  revalidatePath("/objectifs");
  revalidatePath("/");
  return { success: true };
}

// ─── Supprimer un compte spécial ─────────────────────────────────────────────

export async function deleteCompteAction(compteId: string): Promise<CompteState> {
  const userId = await getAuthUserId();

  const compte = await prisma.compte.findUnique({ where: { id: compteId } });
  if (!compte || compte.userId !== userId) return { error: "Introuvable." };

  // Détache les objectifs liés (compteId → null via onDelete: SetNull en cascade)
  await prisma.compte.delete({ where: { id: compteId } });

  revalidatePath("/parametres");
  revalidatePath("/objectifs");
  revalidatePath("/");
  return { success: true };
}

// ─── Activer / désactiver un compte ──────────────────────────────────────────

export async function toggleCompteAction(compteId: string): Promise<CompteState> {
  const userId = await getAuthUserId();

  const compte = await prisma.compte.findUnique({ where: { id: compteId } });
  if (!compte || compte.userId !== userId) return { error: "Introuvable." };

  await prisma.compte.update({
    where: { id: compteId },
    data: { actif: !compte.actif },
  });

  revalidatePath("/parametres");
  revalidatePath("/");
  return { success: true };
}
