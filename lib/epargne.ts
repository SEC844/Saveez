import type { EpargneMensuelle, Imprevu, Objectif } from "@prisma/client";

/**
 * Retourne l'objectif STANDARD actif pour une date donnée.
 * Les objectifs spéciaux (vacances, autre) sont ignorés ici.
 */
export function getObjectifActifPourDate(
  objectifs: Objectif[],
  date: Date
): Objectif | null {
  const t = date.getTime();
  return (
    objectifs.find((o) => {
      if (o.categorie && o.categorie !== "standard") return false;
      const debut = new Date(o.dateDebut).getTime();
      const fin = o.dateFin ? new Date(o.dateFin).getTime() : Infinity;
      return t >= debut && t <= fin;
    }) ?? null
  );
}

/**
 * Retourne les objectifs SPÉCIAUX (vacances, autre) actifs pour une date donnée.
 * Ces objectifs sont additifs et peuvent se superposer à un standard.
 */
export function getSpeciauxActifsPourDate(
  objectifs: Objectif[],
  date: Date
): Objectif[] {
  const t = date.getTime();
  return objectifs.filter((o) => {
    if (!o.categorie || o.categorie === "standard") return false;
    const debut = new Date(o.dateDebut).getTime();
    const fin = o.dateFin ? new Date(o.dateFin).getTime() : Infinity;
    return t >= debut && t <= fin;
  });
}

/**
 * Retourne le montant de base (standard) de l'objectif pour un mois/année.
 * Priorité : objectif standard temporel actif → sinon objectifBase.
 */
export function getObjectifBaseForMonth(
  objectifBase: number,
  objectifs: Objectif[],
  annee: number,
  mois: number
): number {
  const date = new Date(annee, mois - 1, 15);
  const actif = getObjectifActifPourDate(objectifs, date);
  return actif?.montant ?? objectifBase;
}

/**
 * Calcule le montant de remboursement actif des imprévus pour un mois/année.
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
 * Décompose l'objectif mensuel par catégorie pour un mois/année donnés.
 * Utile pour les graphiques en couleur par catégorie.
 */
export function getObjectifBreakdownForMonth(
  objectifBase: number,
  imprévus: Imprevu[],
  annee: number,
  mois: number,
  objectifs: Objectif[] = []
): {
  standard: number;
  vacances: number;
  autre: number;
  remboursements: number;
  total: number;
} {
  const date = new Date(annee, mois - 1, 15);
  const standard = getObjectifBaseForMonth(objectifBase, objectifs, annee, mois);
  const speciaux = getSpeciauxActifsPourDate(objectifs, date);
  const vacances = speciaux
    .filter((o) => o.categorie === "vacances")
    .reduce((s, o) => s + o.montant, 0);
  const autre = speciaux
    .filter((o) => o.categorie === "autre")
    .reduce((s, o) => s + o.montant, 0);
  const remboursements = getRemboursementActif(imprévus, annee, mois);
  return {
    standard,
    vacances,
    autre,
    remboursements,
    total: standard + vacances + autre + remboursements,
  };
}

/**
 * Retourne l'objectif mensuel dynamique total pour un mois/année.
 * = standard (ou objectifBase) + spéciaux actifs + remboursements imprévus
 */
export function getObjectifDynamique(
  objectifBase: number,
  imprévus: Imprevu[],
  annee: number,
  mois: number,
  objectifs: Objectif[] = []
): number {
  const bd = getObjectifBreakdownForMonth(objectifBase, imprévus, annee, mois, objectifs);
  return bd.total;
}

/**
 * Calcule l'écart entre ce qui a été mis de côté et l'objectif.
 */
export function getEcart(montantMis: number, objectif: number): number {
  return montantMis - objectif;
}

/**
 * Projette l'épargne totale à fin décembre de l'année courante.
 * Pour chaque mois : utilise le montant réel si saisi, sinon l'objectif du mois.
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
  let totalCetteAnnee = 0;
  let moisBonis = 0;
  let moisDeficit = 0;

  for (let mois = 1; mois <= 12; mois++) {
    const objectif = getObjectifDynamique(objectifBase, imprévus, annee, mois, objectifs);
    const entree = epargneMensuelles.find(
      (e) => e.annee === annee && e.mois === mois
    );

    if (entree) {
      // Mois saisi : on prend le montant réel
      totalCetteAnnee += entree.montant;
      if (entree.montant >= objectif) moisBonis++;
      else moisDeficit++;
    } else {
      // Mois non saisi (passé ou futur) : on projette avec l'objectif du mois
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