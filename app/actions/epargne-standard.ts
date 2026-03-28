"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAuthUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user;
}

export type EpargneStandardState = { error?: string; success?: boolean } | null;

// ─── Retrait depuis le compte principal ──────────────────────────────────────

export async function retraitEpargneStandardAction(
  _prev: EpargneStandardState,
  formData: FormData
): Promise<EpargneStandardState> {
  const user = await requireAuthUser();
  const userId = user.id;

  const montant = parseFloat(formData.get("montant") as string);
  const note = (formData.get("note") as string)?.trim() || null;

  if (isNaN(montant) || montant <= 0) return { error: "Montant invalide." };

  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { epargneActuelle: true },
  });

  if (montant > dbUser.epargneActuelle) {
    return { error: `Solde insuffisant. Disponible : ${dbUser.epargneActuelle.toLocaleString("fr-FR")} €` };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { epargneActuelle: { decrement: montant } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: "retrait_principal",
        montant,
        note,
      },
    }),
    prisma.actionLog.create({
      data: {
        userId,
        type: "retrait_epargne_principal",
        label: `Dépense depuis le compte principal : ${montant.toLocaleString("fr-FR")} €${note ? ` — ${note}` : ""}`,
        montant,
      },
    }),
  ]);

  revalidatePath("/comptes");
  revalidatePath("/");
  return { success: true };
}

// ─── Transfert depuis le compte principal vers un compte spécial ─────────────

export async function transfertDepuisEpargneAction(
  _prev: EpargneStandardState,
  formData: FormData
): Promise<EpargneStandardState> {
  const user = await requireAuthUser();
  const userId = user.id;

  const compteDestId = (formData.get("compteDestinationId") as string)?.trim();
  const montant = parseFloat(formData.get("montant") as string);
  const note = (formData.get("note") as string)?.trim() || null;

  if (!compteDestId) return { error: "Compte destination non spécifié." };
  if (isNaN(montant) || montant <= 0) return { error: "Montant invalide." };

  const [dbUser, compteDest] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { epargneActuelle: true } }),
    prisma.compte.findUnique({ where: { id: compteDestId } }),
  ]);

  if (!compteDest) return { error: "Compte destination introuvable." };

  // Vérifier l'accès au compte destination (propriétaire ou membre famille)
  if (compteDest.userId !== userId) {
    if (!compteDest.familleId) return { error: "Accès non autorisé." };
    const membre = await prisma.membreFamille.findUnique({
      where: { familleId_userId: { familleId: compteDest.familleId, userId } },
    });
    if (!membre) return { error: "Accès non autorisé." };
  }

  if (montant > dbUser.epargneActuelle) {
    return { error: `Solde insuffisant. Disponible : ${dbUser.epargneActuelle.toLocaleString("fr-FR")} €` };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { epargneActuelle: { decrement: montant } },
    }),
    prisma.compte.update({
      where: { id: compteDestId },
      data: { solde: { increment: montant } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: "transfert",
        montant,
        note,
        compteDestinationId: compteDestId,
      },
    }),
    prisma.actionLog.create({
      data: {
        userId,
        type: "transfert_principal_vers_compte",
        label: `Transfert du principal vers « ${compteDest.label} » : ${montant.toLocaleString("fr-FR")} €${note ? ` — ${note}` : ""}`,
        montant,
      },
    }),
  ]);

  revalidatePath("/comptes");
  revalidatePath("/");
  return { success: true };
}

// ─── Transfert depuis un compte spécial vers le compte principal ─────────────
// (Appelé depuis CompteActionModal quand la destination est "standard")

export async function transfertVersEpargneAction(
  _prev: EpargneStandardState,
  formData: FormData
): Promise<EpargneStandardState> {
  const user = await requireAuthUser();
  const userId = user.id;

  const compteSourceId = (formData.get("compteSourceId") as string)?.trim();
  const montant = parseFloat(formData.get("montant") as string);
  const note = (formData.get("note") as string)?.trim() || null;

  if (!compteSourceId) return { error: "Compte source non spécifié." };
  if (isNaN(montant) || montant <= 0) return { error: "Montant invalide." };

  const compteSource = await prisma.compte.findUnique({ where: { id: compteSourceId } });
  if (!compteSource) return { error: "Compte source introuvable." };

  // Vérifier l'accès
  if (compteSource.userId !== userId) {
    if (!compteSource.familleId) return { error: "Accès non autorisé." };
    const membre = await prisma.membreFamille.findUnique({
      where: { familleId_userId: { familleId: compteSource.familleId, userId } },
    });
    if (!membre) return { error: "Accès non autorisé." };
  }

  if (montant > compteSource.solde) {
    return { error: `Solde insuffisant. Disponible : ${compteSource.solde.toLocaleString("fr-FR")} €` };
  }

  await prisma.$transaction([
    prisma.compte.update({
      where: { id: compteSourceId },
      data: { solde: { decrement: montant } },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { epargneActuelle: { increment: montant } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: "transfert",
        montant,
        note,
        compteSourceId,
      },
    }),
    prisma.actionLog.create({
      data: {
        userId,
        type: "transfert_compte_vers_principal",
        label: `Transfert de « ${compteSource.label} » vers le principal : ${montant.toLocaleString("fr-FR")} €${note ? ` — ${note}` : ""}`,
        montant,
      },
    }),
  ]);

  revalidatePath("/comptes");
  revalidatePath("/");
  return { success: true };
}
