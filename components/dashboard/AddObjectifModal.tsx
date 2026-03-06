"use client";

import { useState, useActionState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, Loader2, X, Waves, Bookmark } from "lucide-react";
import { createObjectifAction } from "@/app/actions/objectif";
import { getSuggestionsObjectif } from "@/lib/epargne";

interface AddObjectifModalProps {
  revenuNet?: number | null;
}

const TYPES = [
  { id: "standard", icon: Target, label: "Standard", desc: "Objectif de base mensuel" },
  { id: "vacances", icon: Waves, label: "Vacances 🏖", desc: "S'ajoute à votre objectif standard" },
  { id: "autre", icon: Bookmark, label: "Autre 📌", desc: "Épargne supplémentaire sur une période" },
] as const;

type CategorieType = "standard" | "vacances" | "autre";

const PRESETS = [
  { id: "1m", label: "1 mois", months: 1 },
  { id: "3m", label: "3 mois", months: 3 },
  { id: "6m", label: "6 mois", months: 6 },
  { id: "1y", label: "1 an", months: 12 },
  { id: "custom", label: "Personnalisé", months: null },
];

function toInputDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function addMonths(d: Date, n: number) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  r.setDate(r.getDate() - 1); // last day inclusive
  return r;
}

export default function AddObjectifModal({ revenuNet }: AddObjectifModalProps) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(createObjectifAction, null);
  const [preset, setPreset] = useState<string>("3m");
  const [montant, setMontant] = useState("");
  const [categorie, setCategorie] = useState<CategorieType>("standard");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [dateDebut, setDateDebut] = useState(toInputDate(today));

  // Recalcule dateFin selon le preset
  const [dateFin, setDateFin] = useState(() => {
    const p = PRESETS.find((p) => p.id === "3m");
    return p?.months ? toInputDate(addMonths(today, p.months)) : "";
  });

  function handlePresetChange(id: string) {
    setPreset(id);
    const p = PRESETS.find((p) => p.id === id);
    if (p?.months) {
      const debut = new Date(dateDebut);
      setDateFin(toInputDate(addMonths(debut, p.months)));
    }
  }

  function handleDebutChange(v: string) {
    setDateDebut(v);
    const p = PRESETS.find((p) => p.id === preset);
    if (p?.months) {
      const debut = new Date(v);
      setDateFin(toInputDate(addMonths(debut, p.months)));
    }
  }

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      setMontant("");
      setPreset("3m");
      setCategorie("standard");
    }
  }, [state?.success]);

  const suggestions = revenuNet ? getSuggestionsObjectif(revenuNet) : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors">
          <Plus size={14} />
          Nouvel objectif
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white">
            <Target size={16} className="text-zinc-400" />
            Nouvel objectif d&apos;épargne
          </DialogTitle>
        </DialogHeader>

        <form action={action} className="px-6 py-5 space-y-5">
          <input type="hidden" name="preset" value={preset} />
          <input type="hidden" name="categorie" value={categorie} />

          {/* Type de l'objectif */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Type d&apos;objectif
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const active = categorie === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCategorie(t.id as CategorieType)}
                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      active
                        ? t.id === "vacances"
                          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400"
                          : t.id === "autre"
                          ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-600 text-violet-700 dark:text-violet-400"
                          : "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-500 text-zinc-900 dark:text-white"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <Icon size={13} />
                    <span className="text-[10px] leading-tight text-center">{t.label}</span>
                  </button>
                );
              })}
            </div>
            {categorie !== "standard" && (
              <p className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                {TYPES.find((t) => t.id === categorie)?.desc} — peut se superposer à un objectif standard.
              </p>
            )}
          </div>

          {/* Montant */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Montant mensuel cible (€)
            </label>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {suggestions.map((s) => (
                  <button
                    key={s.pct}
                    type="button"
                    onClick={() => setMontant(String(s.montant))}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {s.pct}% · {s.montant.toLocaleString("fr-FR")} €
                  </button>
                ))}
              </div>
            )}
            <input
              name="montant"
              type="number"
              min="1"
              step="1"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="Ex : 400"
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
            />
          </div>

          {/* Label optionnel */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Description (optionnel)
            </label>
            <input
              name="label"
              type="text"
              placeholder="Ex : Phase d'intensification"
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
            />
          </div>

          {/* Presets durée */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Durée
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetChange(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${preset === p.id
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Date de début
              </label>
              <input
                name="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => handleDebutChange(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Date de fin {preset !== "custom" && <span className="text-zinc-300 dark:text-zinc-600">(auto)</span>}
              </label>
              <input
                name="dateFin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                readOnly={preset !== "custom"}
                className={`w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all ${preset !== "custom" ? "opacity-60 cursor-not-allowed" : ""
                  }`}
              />
            </div>
          </div>

          <AnimatePresence>
            {state?.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl"
              >
                <X size={13} />
                {state.error}
              </motion.div>
            )}
            {state?.warning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-xl"
              >
                <span className="mt-0.5">⚠</span>
                {state.warning}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <Target size={13} />}
              Créer l&apos;objectif
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
