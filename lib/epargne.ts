import type { EpargneMensuelle, Imprevu } from "@prisma/client";

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
      // Date de début
      const debut = imp.anneeDebut * 12 + imp.moisDebut;
      // Date de fin (incluse)
      const fin = debut + imp.dureeRemboursement - 1;
      const actuel = annee * 12 + mois;
      return actuel >= debut && actuel <= fin;
    })
    .reduce((sum, imp) => sum + imp.montantMensuel, 0);
}

/**
 * Retourne l'objectif mensuel dynamique pour un mois/année donnés.
 * objectifDynamique = objectifBase + somme des remboursements actifs
 */
export function getObjectifDynamique(
  objectifBase: number,
  imprévus: Imprevu[],
  annee: number,
  mois: number
): number {
  return objectifBase + getRemboursementActif(imprévus, annee, mois);
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
 * Prend en compte les mois déjà saisis et projette les mois restants
 * en supposant que l'utilisateur va atteindre son objectif dynamique chaque mois.
 */
export function getProjectionFinAnnee(
  epargneActuelle: number,
  objectifBase: number,
  imprévus: Imprevu[],
  epargneMensuelles: EpargneMensuelle[],
  annee: number
): {
  projection: number;
  totalEpargnéCetteAnnee: number;
  moisBonis: number;
  moisDeficit: number;
} {
  const maintenant = new Date();
  const moisActuel = maintenant.getMonth() + 1; // 1-12

  let totalCetteAnnee = 0;
  let moisBonis = 0;
  let moisDeficit = 0;

  for (let mois = 1; mois <= 12; mois++) {
    const objectif = getObjectifDynamique(objectifBase, imprévus, annee, mois);
    const entree = epargneMensuelles.find(
      (e) => e.annee === annee && e.mois === mois
    );

    if (entree) {
      // Mois déjà saisi
      totalCetteAnnee += entree.montant;
      if (entree.montant >= objectif) moisBonis++;
      else moisDeficit++;
    } else if (mois > moisActuel) {
      // Mois futurs : on projette avec l'objectif dynamique
      totalCetteAnnee += objectif;
    }
    // Mois passés non saisis : on ne projette pas (on ne sait pas)
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
