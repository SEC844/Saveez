import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import type { Imprevu, EpargneMensuelle, User } from "@prisma/client";

export type DashboardData = {
  user: User;
  epargneMensuelles: EpargneMensuelle[];
  imprévusActifs: Imprevu[];
  imprévusSoldés: Imprevu[];
  currentYear: number;
  currentMonth: number;
};

/**
 * Récupère toutes les données du dashboard pour un utilisateur.
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const [user, epargneMensuelles, allImprévus] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.epargneMensuelle.findMany({
      where: { userId },
      orderBy: [{ annee: "desc" }, { mois: "desc" }],
    }),
    prisma.imprevu.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Session valide mais user supprimé (ex: DB réinitialisée) → signout propre
  if (!user) redirect("/login?error=session");

  return {
    user,
    epargneMensuelles,
    imprévusActifs: allImprévus.filter((i) => !i.estSolde),
    imprévusSoldés: allImprévus.filter((i) => i.estSolde),
    currentYear,
    currentMonth,
  };
}

/**
 * Données pour les graphiques : historique des 12 derniers mois.
 */
export async function getGraphData(
  userId: string,
  objectifBase: number,
  imprévus: Imprevu[]
) {
  const { getObjectifDynamique } = await import("@/lib/epargne");

  const today = new Date();
  const points = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const annee = date.getFullYear();
    const mois = date.getMonth() + 1;

    const entree = await prisma.epargneMensuelle.findUnique({
      where: { userId_annee_mois: { userId, annee, mois } },
    });

    points.push({
      label: date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      annee,
      mois,
      reel: entree?.montant ?? null,
      objectif: getObjectifDynamique(objectifBase, imprévus, annee, mois),
    });
  }

  return points;
}
