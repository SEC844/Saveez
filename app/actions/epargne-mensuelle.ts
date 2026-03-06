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

  // ── Répartition par compte ────────────────────────────────────────────────
  // Lire les champs de répartition depuis le formulaire
  const repartitionRaw: Record<string, number> = {};
  const standardRaw = formData.get("repartition_standard");
  if (standardRaw !== null) repartitionRaw["standard"] = parseFloat(standardRaw as string) || 0;

  // Comptes actifs de l'utilisateur
  const comptes = await prisma.compte.findMany({ where: { userId, actif: true } });
  for (const compte of comptes) {
    const val = formData.get(`repartition_${compte.id}`);
    if (val !== null) repartitionRaw[compte.id] = parseFloat(val as string) || 0;
  }

  const hasRepartition = Object.keys(repartitionRaw).length > 0;
  const repartition = hasRepartition ? repartitionRaw : undefined;

  // ── Upsert de l'entrée ────────────────────────────────────────────────────
  await prisma.epargneMensuelle.upsert({
    where: { userId_annee_mois: { userId, annee, mois } },
    create: { userId, annee, mois, montant, note, repartition },
    update: { montant, note, repartition, updatedAt: new Date() },
  });

  // ── Recalcul du montantRembourse sur les imprévus ─────────────────────────
  // Pour chaque imprévu actif, on compte combien de mois avec une entrée
  // tombent dans sa période de remboursement.
  const [toutes, imprévus] = await Promise.all([
    prisma.epargneMensuelle.findMany({ where: { userId } }),
    prisma.imprevu.findMany({ where: { userId } }),
  ]);

  for (const imp of imprévus) {
    if (imp.estSolde) continue;
    const debut = imp.anneeDebut * 12 + imp.moisDebut;
    const fin = debut + imp.dureeRemboursement - 1;

    const moisPayes = toutes.filter((e) => {
      const m = e.annee * 12 + e.mois;
      return m >= debut && m <= fin;
    }).length;

    const rembourse = Math.min(imp.montantTotal, imp.montantMensuel * moisPayes);
    const estSolde = rembourse >= imp.montantTotal;

    await prisma.imprevu.update({
      where: { id: imp.id },
      data: { montantRembourse: rembourse, estSolde },
    });
  }

  // ── Recalcul de l'épargne actuelle ────────────────────────────────────────
  const totalEpargne = toutes.reduce((s, e) => s + e.montant, 0);
  const totalImprévus = imprévus.reduce((s, i) => s + i.montantTotal, 0);

  const moisLabel = new Date(annee, mois - 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // Construire le label de l'action avec répartition si applicable
  let actionLabel = `Épargne saisie : ${moisLabel} (${montant.toLocaleString("fr-FR")} €)`;
  if (hasRepartition) {
    const parts: string[] = [];
    if (repartitionRaw["standard"] !== undefined) {
      parts.push(`Standard : ${repartitionRaw["standard"].toLocaleString("fr-FR")} €`);
    }
    for (const compte of comptes) {
      if (repartitionRaw[compte.id] !== undefined) {
        parts.push(`${compte.label} : ${repartitionRaw[compte.id].toLocaleString("fr-FR")} €`);
      }
    }
    if (parts.length > 0) actionLabel += ` [${parts.join(" · ")}]`;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { epargneActuelle: Math.max(0, totalEpargne - totalImprévus) },
    }),
    prisma.actionLog.create({
      data: {
        userId,
        type: "add_epargne",
        label: actionLabel,
        montant,
      },
    }),
  ]);

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