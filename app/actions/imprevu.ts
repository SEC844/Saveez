"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

export type ImprevuState = { error?: string; success?: boolean } | null;

// ─── Créer un imprévu ─────────────────────────────────────────────────────────

export async function createImprevuAction(
  _prev: ImprevuState,
  formData: FormData
): Promise<ImprevuState> {
  const userId = await getAuthUserId();

  const nom = (formData.get("nom") as string)?.trim();
  const montantTotal = parseFloat(formData.get("montantTotal") as string);
  const duree = parseInt(formData.get("dureeRemboursement") as string);

  if (!nom) return { error: "Le nom est obligatoire." };
  if (isNaN(montantTotal) || montantTotal <= 0)
    return { error: "Montant invalide." };
  if (isNaN(duree) || duree < 1 || duree > 120)
    return { error: "Durée invalide (1–120 mois)." };

  const now = new Date();
  const moisDebut = now.getMonth() + 1;
  const anneeDebut = now.getFullYear();
  const montantMensuel = Math.round((montantTotal / duree) * 100) / 100;

  // Prélève le montant de l'épargne actuelle
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const nouvelleEpargne = user.epargneActuelle - montantTotal;

  await prisma.$transaction([
    prisma.imprevu.create({
      data: {
        userId,
        nom,
        montantTotal,
        dureeRemboursement: duree,
        montantMensuel,
        moisDebut,
        anneeDebut,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { epargneActuelle: nouvelleEpargne },
    }),
  ]);

  revalidatePath("/");
  return { success: true };
}

// ─── Enregistrer un remboursement mensuel d'un imprévu ───────────────────────

export async function rembourserImprevuAction(
  imprevuId: string
): Promise<ImprevuState> {
  const userId = await getAuthUserId();

  const imp = await prisma.imprevu.findUnique({ where: { id: imprevuId } });
  if (!imp || imp.userId !== userId) return { error: "Introuvable." };
  if (imp.estSolde) return { error: "Déjà soldé." };

  const nouveauMontant = imp.montantRembourse + imp.montantMensuel;
  const estSolde = nouveauMontant >= imp.montantTotal;

  await prisma.$transaction([
    prisma.imprevu.update({
      where: { id: imprevuId },
      data: {
        montantRembourse: Math.min(nouveauMontant, imp.montantTotal),
        estSolde,
      },
    }),
    // Réintègre le remboursement dans l'épargne actuelle
    prisma.user.update({
      where: { id: userId },
      data: { epargneActuelle: { increment: imp.montantMensuel } },
    }),
  ]);

  revalidatePath("/");
  return { success: true };
}

// ─── Supprimer un imprévu ────────────────────────────────────────────────────

export async function deleteImprevuAction(
  imprevuId: string
): Promise<ImprevuState> {
  const userId = await getAuthUserId();

  const imp = await prisma.imprevu.findUnique({ where: { id: imprevuId } });
  if (!imp || imp.userId !== userId) return { error: "Introuvable." };

  // Réintègre la partie non remboursée dans l'épargne
  const resteARembourser = imp.montantTotal - imp.montantRembourse;

  await prisma.$transaction([
    prisma.imprevu.delete({ where: { id: imprevuId } }),
    prisma.user.update({
      where: { id: userId },
      data: { epargneActuelle: { decrement: resteARembourser } },
    }),
  ]);

  revalidatePath("/");
  return { success: true };
}
