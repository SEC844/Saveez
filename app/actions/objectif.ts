"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

export type ObjectifState = { error?: string; success?: boolean } | null;

// ─── Créer un objectif temporel ──────────────────────────────────────────────

export async function createObjectifAction(
  _prev: ObjectifState,
  formData: FormData
): Promise<ObjectifState> {
  const userId = await getAuthUserId();

  const montant = parseFloat(formData.get("montant") as string);
  const label = (formData.get("label") as string)?.trim() || null;
  const preset = (formData.get("preset") as string)?.trim() || "custom";
  const dateDebutStr = formData.get("dateDebut") as string;
  const dateFinStr = formData.get("dateFin") as string;

  if (isNaN(montant) || montant <= 0) return { error: "Montant invalide." };
  if (!dateDebutStr) return { error: "Date de début obligatoire." };

  const dateDebut = new Date(dateDebutStr);
  dateDebut.setHours(0, 0, 0, 0);

  let dateFin: Date | null = null;
  if (dateFinStr) {
    dateFin = new Date(dateFinStr);
    dateFin.setHours(23, 59, 59, 999);
    if (dateFin <= dateDebut) return { error: "La date de fin doit être après la date de début." };
  }

  // Vérifier les chevauchements avec les objectifs existants
  const existants = await prisma.objectif.findMany({ where: { userId } });
  const chevauche = existants.some((o) => {
    const dDebut = new Date(o.dateDebut).getTime();
    const dFin = o.dateFin ? new Date(o.dateFin).getTime() : Infinity;
    const nDebut = dateDebut.getTime();
    const nFin = dateFin ? dateFin.getTime() : Infinity;
    // Chevauchement si les intervalles se croisent
    return nDebut <= dFin && nFin >= dDebut;
  });

  if (chevauche) {
    return { error: "Les dates de cet objectif chevauchent un objectif existant. Veuillez ajuster les dates." };
  }

  const moisLabel = dateDebut.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  await prisma.$transaction([
    prisma.objectif.create({
      data: {
        userId,
        montant,
        label,
        dateDebut,
        dateFin,
        preset,
      },
    }),
    prisma.actionLog.create({
      data: {
        userId,
        type: "add_objectif",
        label: `Objectif créé : ${montant.toLocaleString("fr-FR")} €/mois à partir de ${moisLabel}${dateFin ? ` jusqu'à ${dateFin.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}` : ""}`,
        montant,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/objectifs");
  return { success: true };
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
