"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import type { Objectif, Compte } from "@prisma/client";
import { deleteObjectifAction } from "@/app/actions/objectif";
import { Trash2, CalendarClock, CheckCircle2, Clock, Target, Sun, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ObjectifsListProps {
  objectifs: Objectif[];
  objectifBase: number;
  revenuNet: number | null;
  comptes?: Compte[];
}

function formatDateRange(debut: Date, fin: Date | null) {
  const d = new Date(debut).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  if (!fin) return `Depuis le ${d}`;
  const f = new Date(fin).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  return `${d} → ${f}`;
}

function getStatus(objectif: Objectif): "active" | "future" | "past" {
  const now = new Date();
  const debut = new Date(objectif.dateDebut);
  const fin = objectif.dateFin ? new Date(objectif.dateFin) : null;
  if (now < debut) return "future";
  if (fin && now > fin) return "past";
  return "active";
}

function getCategorieLabel(cat: string | null, couleurCompte?: string | null) {
  if (cat === "vacances") {
    if (couleurCompte) {
      return { label: "Vacances", icon: Sun, inlineColor: couleurCompte };
    }
    return { label: "Vacances", icon: Sun, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" };
  }
  if (cat === "autre") {
    if (couleurCompte) {
      return { label: "Autre", icon: Layers, inlineColor: couleurCompte };
    }
    return { label: "Autre", icon: Layers, color: "text-violet-500 bg-violet-50 dark:bg-violet-950/30" };
  }
  return { label: "Standard", icon: Target, color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800" };
}

function ObjectifCard({ objectif, delay, comptes }: { objectif: Objectif; delay: number; comptes?: Compte[] }) {
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const status = getStatus(objectif);
  const compteAssocie = comptes?.find((c) => c.id === objectif.compteId);
  const { label: catLabel, icon: CatIcon, color: catColor, inlineColor } = getCategorieLabel(objectif.categorie, compteAssocie?.couleur);

  function handleDelete() {
    setDeleted(true);
    startTransition(async () => {
      await deleteObjectifAction(objectif.id);
    });
  }

  if (deleted) return null;

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer cet objectif ?"
        description={`${objectif.montant.toLocaleString("fr-FR")} €/mois${objectif.label ? ` · ${objectif.label}` : ""}. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={isPending}
        onConfirm={handleDelete}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.35 }}
        className={cn(
          "bg-white dark:bg-zinc-900 rounded-2xl border p-5",
          status === "active"
            ? "border-zinc-900 dark:border-white shadow-sm"
            : "border-zinc-100 dark:border-zinc-800"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type badge */}
            {inlineColor ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ color: inlineColor, backgroundColor: `${inlineColor}20` }}
              >
                <CatIcon size={10} />
                {catLabel}
              </span>
            ) : (
              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", catColor)}>
                <CatIcon size={10} />
                {catLabel}
              </span>
            )}

            {/* Statut */}
            {status === "active" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                <CheckCircle2 size={12} />
                Actif
              </span>
            )}
            {status === "future" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-400">
                <Clock size={12} />
                À venir
              </span>
            )}
            {status === "past" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400">
                <CalendarClock size={12} />
                Terminé
              </span>
            )}
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={isPending}
            className="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-700 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <p className="text-2xl font-semibold text-zinc-900 dark:text-white mb-0.5">
          {objectif.montant.toLocaleString("fr-FR")} €<span className="text-sm font-normal text-zinc-400">/mois</span>
        </p>
        {objectif.label && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{objectif.label}</p>
        )}
        <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
          <CalendarClock size={11} />
          {formatDateRange(objectif.dateDebut, objectif.dateFin)}
        </p>
        {objectif.preset && objectif.preset !== "custom" && (
          <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
            {objectif.preset === "1m" ? "1 mois" : objectif.preset === "3m" ? "3 mois" : objectif.preset === "6m" ? "6 mois" : "1 an"}
          </span>
        )}
      </motion.div>
    </>
  );
}

export default function ObjectifsList({ objectifs, objectifBase, comptes }: ObjectifsListProps) {
  if (objectifs.length === 0) {
    return (
      <div className="space-y-6">
        {/* Objectif de repli */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1">
            Objectif de repli
          </p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-white">
            {objectifBase.toLocaleString("fr-FR")} €<span className="text-sm font-normal text-zinc-400">/mois</span>
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            Utilisé quand aucun objectif temporel n&apos;est actif. Modifiable dans les paramètres.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl mb-4">🎯</div>
          <p className="text-zinc-600 dark:text-zinc-300 font-medium">Aucun objectif temporel</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">
            Créez un objectif pour définir un montant cible sur une période donnée.
          </p>
        </div>
      </div>
    );
  }

  const actifs = objectifs.filter((o) => getStatus(o) === "active");
  const aVenir = objectifs.filter((o) => getStatus(o) === "future");
  const passes = objectifs.filter((o) => getStatus(o) === "past");

  return (
    <div className="space-y-8">
      {/* Objectif de repli */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1">
          Objectif de repli
        </p>
        <p className="text-xl font-semibold text-zinc-900 dark:text-white">
          {objectifBase.toLocaleString("fr-FR")} €<span className="text-sm font-normal text-zinc-400">/mois</span>
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          Utilisé quand aucun objectif temporel n&apos;est actif.
        </p>
      </div>

      {actifs.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            En cours ({actifs.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {actifs.map((o, i) => <ObjectifCard key={o.id} objectif={o} delay={i * 0.05} comptes={comptes} />)}
          </div>
        </section>
      )}

      {aVenir.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
            <Clock size={14} className="text-blue-400" />
            À venir ({aVenir.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aVenir.map((o, i) => <ObjectifCard key={o.id} objectif={o} delay={i * 0.05} comptes={comptes} />)}
          </div>
        </section>
      )}

      {passes.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
            <CalendarClock size={14} className="text-zinc-400" />
            Terminés ({passes.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {passes.map((o, i) => <ObjectifCard key={o.id} objectif={o} delay={i * 0.05} comptes={comptes} />)}
          </div>
        </section>
      )}
    </div>
  );
}
