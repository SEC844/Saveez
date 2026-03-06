"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

export type SettingsState = { error?: string; success?: boolean } | null;

// ─── Mettre à jour les paramètres utilisateur ────────────────────────────────

export async function updateSettingsAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const userId = await getAuthUserId();

  const objectifBase = parseFloat(formData.get("objectifBase") as string);
  const fondsSecurite = parseFloat(formData.get("fondsSecurite") as string);
  const epargneActuelle = parseFloat(formData.get("epargneActuelle") as string);
  const nameRaw = formData.has("name") ? (formData.get("name") as string)?.trim() || null : undefined;
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

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { objectifBase, fondsSecurite, epargneActuelle, ...(nameRaw !== undefined ? { name: nameRaw } : {}), revenuNet },
    }),
    prisma.actionLog.create({
      data: {
        userId,
        type: "update_settings",
        label: "Paramètres mis à jour",
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/parametres");
  return { success: true };
}

// ─── Marquer l'onboarding comme terminé ──────────────────────────────────────

export async function completeOnboardingAction(): Promise<void> {
  const userId = await getAuthUserId();
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingDone: true },
  });
  revalidatePath("/");
}

// ─── Réinitialiser toutes les données utilisateur ───────────────────────────

export async function resetUserDataAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const userId = await getAuthUserId();
  const confirm = (formData.get("confirm") as string)?.trim();

  if (confirm !== "RESET") {
    return { error: "Veuillez taper RESET pour confirmer." };
  }

  // Supprime toutes les données liées à l'utilisateur (sans supprimer le compte)
  await prisma.$transaction([
    prisma.epargneMensuelle.deleteMany({ where: { userId } }),
    prisma.imprevu.deleteMany({ where: { userId } }),
    prisma.objectif.deleteMany({ where: { userId } }),
    prisma.actionLog.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: { epargneActuelle: 0 },
    }),
    // Recréer un log de remise à zéro
    prisma.actionLog.create({
      data: {
        userId,
        type: "reset",
        label: "Remise à zéro de toutes les données",
      },
    }),
  ]);

  revalidatePath("/");
  return { success: true };
}

// ─── Mode "What If" : simulation sans persistance ────────────────────────────

export type WhatIfResult = {
  projectionSans: number;
  projectionAvec: number;
  difference: number;
  moisPourRattraper: number;
};

export async function whatIfSimulation(
  montantHypothetique: number
): Promise<WhatIfResult> {
  const userId = await getAuthUserId();
  const { getDashboardData } = await import("@/lib/queries");
  const { getProjectionFinAnnee } = await import("@/lib/epargne");

  const data = await getDashboardData(userId);
  const allImprévus = [...data.imprévusActifs, ...data.imprévusSoldés];

  const sans = getProjectionFinAnnee(
    data.user.epargneActuelle,
    data.user.objectifBase,
    allImprévus,
    data.epargneMensuelles,
    data.currentYear,
    data.objectifs
  );

  const avec = getProjectionFinAnnee(
    data.user.epargneActuelle - montantHypothetique,
    data.user.objectifBase,
    allImprévus,
    data.epargneMensuelles,
    data.currentYear,
    data.objectifs
  );

  const difference = sans.projection - avec.projection;
  const moisPourRattraper =
    data.user.objectifBase > 0
      ? Math.ceil(montantHypothetique / data.user.objectifBase)
      : 0;

  return {
    projectionSans: sans.projection,
    projectionAvec: avec.projection,
    difference,
    moisPourRattraper,
  };
}
