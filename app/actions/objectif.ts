"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

export type ObjectifState = {
  error?: string;
  warning?: string;
  success?: boolean;
} | null;

// ─── Créer un objectif ────────────────────────────────────────────────────────

export async function createObjectifAction(
  _prev: ObjectifState,
  formData: FormData
): Promise<ObjectifState> {
  const userId = await getAuthUserId();

  const montant = parseFloat(formData.get("montant") as string);
  const label = (formData.get("label") as string)?.trim() || null;
  const preset = (formData.get("preset") as string)?.trim() || "custom";
  const categorie = (formData.get("categorie") as string)?.trim() || "standard";
  const dateDebutStr = formData.get("dateDebut") as string;
  const dateFinStr = formData.get("dateFin") as string;

  if (isNaN(montant) || montant <= 0) return { error: "Montant invalide." };
  if (!dateDebutStr) return { error: "Date de début obligatoire." };

  const validCategories = ["standard", "vacances", "autre"];
  if (!validCategories.includes(categorie)) return { error: "Catégorie invalide." };

  const dateDebut = new Date(dateDebutStr);
  dateDebut.setHours(0, 0, 0, 0);

  let dateFin: Date | null = null;
  if (dateFinStr) {
    dateFin = new Date(dateFinStr);
    dateFin.setHours(23, 59, 59, 999);
    if (dateFin <= dateDebut) return { error: "La date de fin doit être après la date de début." };
  }

  const existants = await prisma.objectif.findMany({ where: { userId } });

  // Pour les objectifs STANDARD : vérifier le chevauchement avec d'autres standards
  if (categorie === "standard") {
    const standards = existants.filter((o) => !o.categorie || o.categorie === "standard");
    const chevauche = standards.some((o) => {
      const dDebut = new Date(o.dateDebut).getTime();
      const dFin = o.dateFin ? new Date(o.dateFin).getTime() : Infinity;
      const nDebut = dateDebut.getTime();
      const nFin = dateFin ? dateFin.getTime() : Infinity;
      return nDebut <= dFin && nFin >= dDebut;
    });
    if (chevauche) {
      return { error: "Les dates chevauchent un objectif standard existant. Ajustez les dates ou supprimez l'objectif conflictuel." };
    }
  }

  // Pour les spéciaux : calculer l'engagement mensuel total et avertir si > revenu
  let warning: string | undefined;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { revenuNet: true, objectifBase: true } });
  if (user?.revenuNet) {
    // Calculer l'engagement total pendant la période du nouvel objectif
    const moisMilieu = new Date((dateDebut.getTime() + (dateFin?.getTime() ?? dateDebut.getTime() + 30 * 24 * 3600 * 1000)) / 2);
    const { getObjectifBreakdownForMonth } = await import("@/lib/epargne");
    const prevMonth = moisMilieu.getMonth() + 1;
    const prevYear = moisMilieu.getFullYear();
    const breakdown = getObjectifBreakdownForMonth(user.objectifBase, [], prevYear, prevMonth, existants);
    const totalAvec = breakdown.total + montant;
    const pct = Math.round((totalAvec / user.revenuNet) * 100);
    if (pct > 50) {
      warning = `Attention : avec cet objectif, votre engagement mensuel atteint ${pct} % de votre revenu net (${totalAvec.toLocaleString("fr-FR")} €).`;
    }
  }

  const moisLabel = dateDebut.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const categorieLabel = categorie === "vacances" ? "🏖 Vacances" : categorie === "autre" ? "📌 Autre" : "📊 Standard";

  await prisma.$transaction([
    prisma.objectif.create({
      data: { userId, montant, label, dateDebut, dateFin, preset, categorie },
    }),
    prisma.actionLog.create({
      data: {
        userId,
        type: "add_objectif",
        label: `Objectif ${categorieLabel} créé : ${montant.toLocaleString("fr-FR")} €/mois à partir de ${moisLabel}${dateFin ? ` jusqu'à ${dateFin.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}` : ""}`,
        montant,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/objectifs");
  return { success: true, ...(warning ? { warning } : {}) };
}

// ─── Supprimer un objectif ────────────────────────────────────────────────────

export async function deleteObjectifAction(objectifId: string): Promise<ObjectifState> {
  const userId = await getAuthUserId();

  const obj = await prisma.objectif.findUnique({ where: { id: objectifId } });
  if (!obj || obj.userId !== userId) return { error: "Introuvable." };

  await prisma.$transaction([
    prisma.objectif.delete({ where: { id: objectifId } }),
    prisma.actionLog.create({
      data: {
        userId,
        type: "delete_objectif",
        label: `Objectif supprimé : ${obj.montant.toLocaleString("fr-FR")} €/mois`,
        montant: obj.montant,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/objectifs");
  return { success: true };
}