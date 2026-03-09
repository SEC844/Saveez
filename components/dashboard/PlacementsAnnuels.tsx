"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, CalendarDays, TrendingUp, TrendingDown, Minus } from "lucide-react";
import AddEpargneModal from "@/components/dashboard/AddEpargneModal";
import type { EpargneMensuelle, Compte, Imprevu } from "@prisma/client";

const MOIS_LABELS_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const MOIS_LABELS_FULL = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

interface EntreeMois {
  annee: number;
  mois: number; // 1-12
  montant?: number;
  note?: string | null;
  repartition?: Record<string, number> | null;
  objectif: number;
}

interface PlacementsAnnuelsProps {
  annee: number;
  entrees: EntreeMois[];
  comptesActifs: Compte[];
  objectifStandard: number;
  objectifsComptes: Record<string, number>;
  imprevusActifs: Imprevu[];
}

interface EditState {
  annee: number;
  mois: number;
  montant?: number;
  note?: string;
  repartition?: Record<string, number>;
}

export default function PlacementsAnnuels({
  annee,
  entrees,
  comptesActifs,
  objectifStandard,
  objectifsComptes,
  imprevusActifs,
}: PlacementsAnnuelsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Construire les 12 mois — mois futurs non saisis = vide
  const moisRows = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const entree = entrees.find((e) => e.mois === m);
    const isFuture = annee > currentYear || (annee === currentYear && m > currentMonth);
    return { mois: m, entree, isFuture };
  });

  const totalSaisi = entrees.reduce((s, e) => s + (e.montant ?? 0), 0);
  const totalObjectif = entrees
    .filter((e) => !( annee === currentYear && e.mois > currentMonth))
    .reduce((s, e) => s + e.objectif, 0);
  const boni = entrees.filter((e) => e.montant !== undefined && e.montant >= e.objectif).length;
  const deficit = entrees.filter((e) => e.montant !== undefined && e.montant < e.objectif).length;

  function openEdit(row: { mois: number; entree?: EntreeMois }) {
    const rep = row.entree?.repartition ?? undefined;
    setEditState({
      annee,
      mois: row.mois,
      montant: row.entree?.montant,
      note: row.entree?.note ?? undefined,
      repartition: rep !== null ? rep : undefined,
    });
    setEditOpen(true);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <CalendarDays size={14} />
          Placements {annee}
        </h2>
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            {boni} mois en avance
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            {deficit} en déficit
          </span>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        {/* Résumé haut */}
        <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">Total épargné</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">{totalSaisi.toLocaleString("fr-FR")} €</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">Total objectif</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">{totalObjectif.toLocaleString("fr-FR")} €</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">Écart cumulé</p>
            <p className={`text-sm font-bold ${totalSaisi - totalObjectif >= 0 ? "text-emerald-500" : "text-red-400"}`}>
              {totalSaisi - totalObjectif >= 0 ? "+" : ""}{(totalSaisi - totalObjectif).toLocaleString("fr-FR")} €
            </p>
          </div>
        </div>

        {/* Lignes mois */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Mois</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Épargné</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Objectif</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Écart</th>
              <th className="px-3 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {moisRows.map(({ mois, entree, isFuture }, i) => {
              const hasSaisie = entree?.montant !== undefined;
              const diff = hasSaisie ? entree!.montant! - (entree?.objectif ?? 0) : null;
              const isCurrentMonth = annee === currentYear && mois === currentMonth;

              return (
                <motion.tr
                  key={mois}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className={`group ${i < 11 ? "border-b border-zinc-50 dark:border-zinc-800/50" : ""} ${isCurrentMonth ? "bg-blue-50/40 dark:bg-blue-900/10" : ""} ${isFuture && !hasSaisie ? "opacity-40" : ""}`}
                >
                  {/* Mois */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isCurrentMonth && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium hidden sm:inline">
                        {MOIS_LABELS_FULL[mois - 1]}
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium sm:hidden">
                        {MOIS_LABELS_SHORT[mois - 1]}
                      </span>
                    </div>
                  </td>

                  {/* Montant épargné */}
                  <td className="px-4 py-3 text-right">
                    {hasSaisie ? (
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {entree!.montant!.toLocaleString("fr-FR")} €
                      </span>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-600 text-xs italic">—</span>
                    )}
                  </td>

                  {/* Objectif */}
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    {entree?.objectif !== undefined && entree.objectif > 0 ? (
                      <span className="text-zinc-400 dark:text-zinc-500">
                        {(entree.objectif).toLocaleString("fr-FR")} €
                      </span>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Écart */}
                  <td className="px-4 py-3 text-right">
                    {diff !== null ? (
                      <span className={`flex items-center justify-end gap-1 font-medium text-xs ${diff >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                        {diff > 0 ? <TrendingUp size={12} /> : diff < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                        {diff >= 0 ? "+" : ""}{diff.toLocaleString("fr-FR")} €
                      </span>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Bouton modifier */}
                  <td className="px-3 py-3 text-center">
                    {!isFuture && (
                      <button
                        onClick={() => openEdit({ mois, entree })}
                        className="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100"
                        title={hasSaisie ? "Modifier" : "Saisir"}
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modale d'édition contrôlée */}
      {editState && (
        <AddEpargneModal
          comptesActifs={comptesActifs}
          objectifStandard={objectifStandard}
          objectifsComptes={objectifsComptes}
          imprevusActifs={imprevusActifs}
          editOpen={editOpen}
          onEditOpenChange={setEditOpen}
          initialAnnee={editState.annee}
          initialMois={editState.mois}
          initialMontant={editState.montant}
          initialNote={editState.note}
          initialRepartition={editState.repartition}
        />
      )}
    </div>
  );
}
