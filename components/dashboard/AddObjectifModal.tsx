"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Target, Loader2, X, AlertTriangle } from "lucide-react";
import { createObjectifAction } from "@/app/actions/objectif";
import { getSuggestionsObjectif } from "@/lib/epargne";
import type { Compte } from "@prisma/client";

interface AddObjectifModalProps {
  revenuNet?: number | null;
  comptes?: Compte[];
}

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
  r.setDate(r.getDate() - 1);
  return r;
}

export default function AddObjectifModal({ revenuNet, comptes = [] }: AddObjectifModalProps) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(createObjectifAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  const [preset, setPreset] = useState<string>("3m");
  const [montant, setMontant] = useState("");
  const [categorie, setCategorie] = useState<string>("standard");
  const [compteId, setCompteId] = useState<string>("");
  const [force, setForce] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [dateDebut, setDateDebut] = useState(toInputDate(today));
  const [dateFin, setDateFin] = useState(() => {
    const p = PRESETS.find((p) => p.id === "3m");
    return p?.months ? toInputDate(addMonths(today, p.months)) : "";
  });

  function handlePresetChange(id: string) {
    setPreset(id);
    const p = PRESETS.find((p) => p.id === id);
    if (p?.months) setDateFin(toInputDate(addMonths(new Date(dateDebut), p.months)));
  }

  function handleDebutChange(v: string) {
    setDateDebut(v);
    const p = PRESETS.find((p) => p.id === preset);
    if (p?.months) setDateFin(toInputDate(addMonths(new Date(v), p.months)));
  }

  function handleSelectType(cat: string, cid: string) {
    setCategorie(cat);
    setCompteId(cid);
    setForce(false);
  }

  function handleConfirm() {
    setForce(true);
  }

  useEffect(() => {
    if (force && state?.pendingConfirm) {
      formRef.current?.requestSubmit();
    }
  }, [force]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      setOpen(false);
      setMontant("");
      setPreset("3m");
      setCategorie("standard");
      setCompteId("");
      setForce(false);
    }
    if (!state.pendingConfirm) {
      setForce(false);
    }
  }, [state]);

  const suggestions = revenuNet ? getSuggestionsObjectif(revenuNet) : [];
  const comptesActifs = comptes.filter((c) => c.actif);
  const hasSpecials = comptesActifs.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForce(false); } }}>
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
            {`Nouvel objectif d'épargne`}
          </DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={action} className="px-6 py-5 space-y-5">
          <input type="hidden" name="preset" value={preset} />
          <input type="hidden" name="categorie" value={categorie} />
          <input type="hidden" name="compteId" value={compteId} />
          <input type="hidden" name="force" value={force ? "1" : "0"} />

          {hasSpecials && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectType("standard", "")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${categorie === "standard"
                      ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-500 text-zinc-900 dark:text-white"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                >
                  <Target size={11} />
                  Standard
                </button>

                {comptesActifs.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectType(c.type, c.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${compteId === c.id
                        ? c.type === "vacances"
                          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400"
                          : "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-600 text-violet-700 dark:text-violet-400"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                      }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {categorie !== "standard" && (
                <p className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                  Compte spécial — peut se superposer à votre objectif standard.
                </p>
              )}
            </div>
          )}

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

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Description (optionnel)
            </label>
            <input
              name="label"
              type="text"
              placeholder="Ex : Phase intensive"
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
            />
          </div>

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
                Date de fin{" "}
                {preset !== "custom" && (
                  <span className="text-zinc-300 dark:text-zinc-600">(auto)</span>
                )}
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

            {state?.pendingConfirm && state.warning && !state.success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 space-y-2"
              >
                <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                  <span>{state.warning}</span>
                </div>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-400 underline underline-offset-2 hover:opacity-70 transition-opacity"
                >
                  Créer quand même
                </button>
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
            {!state?.pendingConfirm && (
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors"
              >
                {isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Target size={13} />
                )}
                {`Créer l'objectif`}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
