import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import type { Imprevu, EpargneMensuelle, User, Objectif, ActionLog, Compte } from "@prisma/client";
import { getObjectifBreakdownForMonth } from "@/lib/epargne";

export type DashboardData = {
  user: User;
  epargneMensuelles: EpargneMensuelle[];
  imprévusActifs: Imprevu[];
  imprévusSoldés: Imprevu[];
  objectifs: Objectif[];
  comptes: Compte[];
  currentYear: number;
  currentMonth: number;
};

/**
 * Récupère toutes les données du dashboard pour un utilisateur.
 * Toutes les requêtes sont parallelisées avec Promise.all.
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const [user, epargneMensuelles, allImprévus, objectifs, comptes] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.epargneMensuelle.findMany({
      where: { userId },
      orderBy: [{ annee: "desc" }, { mois: "desc" }],
    }),
    prisma.imprevu.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.objectif.findMany({
      where: { userId },
      orderBy: { dateDebut: "asc" },
    }),
    prisma.compte.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!user) redirect("/login?error=session");

  return {
    user,
    epargneMensuelles,
    imprévusActifs: allImprévus.filter((i) => !i.estSolde),
    imprévusSoldés: allImprévus.filter((i) => i.estSolde),
    objectifs,
    comptes,
    currentYear,
    currentMonth,
  };
}

/**
 * Données pour les graphiques : historique des 12 derniers mois.
 *
 * ⚡ Performance : une seule requête DB au lieu de 12 requêtes individuelles.
 */
export async function getGraphData(
  userId: string,
  objectifBase: number,
  imprévus: Imprevu[],
  objectifs: Objectif[] = []
) {
  const today = new Date();

  // Construire la liste des 12 mois (du plus ancien au plus récent)
  const months = Array.from({ length: 12 }, (_, idx) => {
    const i = 11 - idx; // 11 mois en arrière → mois courant
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    return {
      date,
      annee: date.getFullYear(),
      mois: date.getMonth() + 1,
    };
  });

  // ✅ UNE SEULE requête pour tous les mois
  const entrees = await prisma.epargneMensuelle.findMany({
    where: {
      userId,
      OR: months.map(({ annee, mois }) => ({ annee, mois })),
    },
  });

  // Index rapide pour les lookups : "annee-mois" → entrée
  const entreeMap = new Map(entrees.map((e) => [`${e.annee}-${e.mois}`, e]));

  return months.map(({ date, annee, mois }) => {
    const entree = entreeMap.get(`${annee}-${mois}`) ?? null;
    const breakdown = getObjectifBreakdownForMonth(objectifBase, imprévus, annee, mois, objectifs);

    // Extraire les allocations par compte depuis repartition JSON
    const repartition = entree?.repartition as Record<string, number> | null ?? {};
    const compteAllocations: Record<string, number> = {};
    let standardAllocation: number | null = null;

    if (entree) {
      for (const [key, val] of Object.entries(repartition)) {
        if (key === "standard") {
          standardAllocation = val;
        } else if (!key.startsWith("imprevu") && key !== "imprevus") {
          compteAllocations[key] = val;
        }
      }
      // Si aucune répartition définie, tout va en standard
      if (standardAllocation === null && Object.keys(compteAllocations).length === 0) {
        standardAllocation = entree.montant;
      }
      standardAllocation ??= 0;
    }

    return {
      label: date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      annee,
      mois,
      reel: entree?.montant ?? null,
      objectif: breakdown.total,
      objectifStandard: breakdown.standard,
      objectifVacances: breakdown.vacances,
      objectifAutre: breakdown.autre,
      remboursements: breakdown.remboursements,
      standardAllocation, // portion réelle allouée au compte principal (null si pas d'entrée)
      compteAllocations,  // { [compteId]: montant }
    };
  });
}

/**
 * Récupère l'historique des actions d'un utilisateur.
 */
export async function getActionLogs(userId: string, limit = 50): Promise<ActionLog[]> {
  return prisma.actionLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
