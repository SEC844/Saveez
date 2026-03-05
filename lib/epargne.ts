import type { EpargneMensuelle, Imprevu, Objectif } from "@prisma/client";

/**
 * Trouve l'objectif actif pour une date donnée parmi les objectifs temporels.
 * Si aucun objectif ne couvre cette date, retourne null.
 */
export function getObjectifActifPourDate(
  objectifs: Objectif[],
  date: Date
): Objectif | null {
  const t = date.getTime();
  return (
    objectifs.find((o) => {
      const debut = new Date(o.dateDebut).getTime();
      const fin = o.dateFin ? new Date(o.dateFin).getTime() : Infinity;
      return t >= debut && t <= fin;
    }) ?? null
  );
}

/**
 * Retourne le montant de base de l'objectif pour un mois/année donné.
 * Priorité : objectif temporel actif → sinon objectifBase de l'utilisateur.
 */
export function getObjectifBaseForMonth(
  objectifBase: number,
  objectifs: Objectif[],
  annee: number,
  mois: number
): number {
  const date = new Date(annee, mois - 1, 15); // milieu du mois
  const actif = getObjectifActifPourDate(objectifs, date);
  return actif?.montant ?? objectifBase;
}

/**
 * Calcule le montant de remboursement actif des imprévus pour un mois/année donnés.
 * Un imprévu est actif si la date (annee, mois) est dans sa fenêtre de remboursement.
 */
export function getRemboursementActif(
  imprévus: Imprevu[],
  annee: number,
  mois: number
): number {
  return imprévus
    .filter((imp) => {
      if (imp.estSolde) return false;
      const debut = imp.anneeDebut * 12 + imp.moisDebut;
      const fin = debut + imp.dureeRemboursement - 1;
      const actuel = annee * 12 + mois;
      return actuel >= debut && actuel <= fin;
    })
    .reduce((sum, imp) => sum + imp.montantMensuel, 0);
}

/**
 * Retourne l'objectif mensuel dynamique pour un mois/année donnés.
 * objectifDynamique = objectifBase (ou objectif temporel) + remboursements actifs
 */
export function getObjectifDynamique(
  objectifBase: number,
  imprévus: Imprevu[],
  annee: number,
  mois: number,
  objectifs: Objectif[] = []
): number {
  const base = getObjectifBaseForMonth(objectifBase, objectifs, annee, mois);
  return base + getRemboursementActif(imprévus, annee, mois);
}

/**
 * Calcule l'écart entre ce qui a été mis de côté et l'objectif.
 * Positif = bonus, négatif = déficit.
 */
export function getEcart(montantMis: number, objectif: number): number {
  return montantMis - objectif;
}

/**
 * Projette l'épargne totale à fin décembre de l'année courante.
 */
export function getProjectionFinAnnee(
  epargneActuelle: number,
  objectifBase: number,
  imprévus: Imprevu[],
  epargneMensuelles: EpargneMensuelle[],
  annee: number,
  objectifs: Objectif[] = []
): {
  projection: number;
  totalEpargnéCetteAnnee: number;
  moisBonis: number;
  moisDeficit: number;
} {
  const maintenant = new Date();
  const moisActuel = maintenant.getMonth() + 1;

  let totalCetteAnnee = 0;
  let moisBonis = 0;
  let moisDeficit = 0;

  for (let mois = 1; mois <= 12; mois++) {
    const objectif = getObjectifDynamique(objectifBase, imprévus, annee, mois, objectifs);
    const entree = epargneMensuelles.find(
      (e) => e.annee === annee && e.mois === mois
    );

    if (entree) {
      totalCetteAnnee += entree.montant;
      if (entree.montant >= objectif) moisBonis++;
      else moisDeficit++;
    } else if (mois > moisActuel) {
      totalCetteAnnee += objectif;
    }
  }

  return {
    projection: epargneActuelle + totalCetteAnnee,
    totalEpargnéCetteAnnee: totalCetteAnnee,
    moisBonis,
    moisDeficit,
  };
}

/**
 * Calcule le pourcentage de remboursement d'un imprévu.
 */
export function getProgressionImprevu(imp: Imprevu): number {
  if (imp.montantTotal === 0) return 100;
  return Math.min(100, (imp.montantRembourse / imp.montantTotal) * 100);
}

/**
 * Suggère des montants d'objectif en % du revenu net.
 */
export function getSuggestionsObjectif(revenuNet: number): { pct: number; montant: number }[] {
  return [15, 20, 30].map((pct) => ({
    pct,
    montant: Math.round(revenuNet * (pct / 100)),
  }));
}
