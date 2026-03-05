"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

// ─── Saisir ou mettre à jour une épargne mensuelle ───────────────────────────

export type EpargneMensuelleState = { error?: string; success?: boolean } | null;

export async function upsertEpargneMensuelleAction(
  _prev: EpargneMensuelleState,
  formData: FormData
): Promise<EpargneMensuelleState> {
  const userId = await getAuthUserId();

  const annee = parseInt(formData.get("annee") as string);
  const mois = parseInt(formData.get("mois") as string);
  const montant = parseFloat(formData.get("montant") as string);
  const note = (formData.get("note") as string)?.trim() || null;

  if (isNaN(annee) || isNaN(mois) || isNaN(montant)) {
    return { error: "Données invalides." };
  }
  if (montant < 0) return { error: "Le montant ne peut pas être négatif." };
  if (mois < 1 || mois > 12) return { error: "Mois invalide." };

  await prisma.epargneMensuelle.upsert({
    where: { userId_annee_mois: { userId, annee, mois } },
    create: { userId, annee, mois, montant, note },
    update: { montant, note, updatedAt: new Date() },
  });

  // Recalcule l'épargne actuelle (somme cumulée)
  const toutes = await prisma.epargneMensuelle.findMany({ where: { userId } });
  const total = toutes.reduce((s, e) => s + e.montant, 0);

  // Déduit les montants totaux des imprévus soldés + actifs
  const imprévus = await prisma.imprevu.findMany({ where: { userId } });
  const totalImprévus = imprévus.reduce((s, i) => s + i.montantTotal, 0);

  await prisma.user.update({
    where: { id: userId },
    data: { epargneActuelle: Math.max(0, total - totalImprévus) },
  });

  revalidatePath("/");
  return { success: true };
}

// ─── Supprimer une entrée mensuelle ──────────────────────────────────────────

export async function deleteEpargneMensuelleAction(id: string) {
  const userId = await getAuthUserId();

  const entry = await prisma.epargneMensuelle.findUnique({ where: { id } });
  if (!entry || entry.userId !== userId) return { error: "Introuvable." };

  await prisma.epargneMensuelle.delete({ where: { id } });
  revalidatePath("/");
  return { success: true };
}
