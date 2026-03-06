"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, TrendingDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatEuro(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

const PRESETS = [2, 4, 6];

interface WhatIfModalProps {
  epargneActuelle: number;
}

export default function WhatIfModal({ epargneActuelle }: WhatIfModalProps) {
  const [open, setOpen] = useState(false);
  const [montant, setMontant] = useState("");
  const [selectedMois, setSelectedMois] = useState<number | null>(null);
  const [customMois, setCustomMois] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const depense = parseFloat(montant) || 0;
  const soldeApres = epargneActuelle - depense;
  const hasValidDepense = depense > 0;

  const moisActifs = showCustom
    ? parseInt(customMois) > 0 ? parseInt(customMois) : null
    : selectedMois;
  const mensualite =
    moisActifs && depense > 0
      ? Math.round((depense / moisActifs) * 100) / 100
      : null;

  function reset() {
    setMontant("");
    setSelectedMois(null);
    setCustomMois("");
    setShowCustom(false);
  }

  function handleMoisClick(m: number) {
    setSelectedMois(m);
    setShowCustom(false);
  }

  function handleCustomClick() {
    setShowCustom(true);
    setSelectedMois(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Sparkles size={14} />
          Simulation What If
        </motion.button>
      </DialogTrigger>

      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            Simulation What If
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-zinc-400 dark:text-zinc-500 -mt-1 mb-2">
          Simulez une dépense depuis votre solde actuel.
        </p>

        {/* Solde actuel */}
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 px-4 py-3 mb-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Solde actuel</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
            {formatEuro(epargneActuelle)}
          </p>
        </div>

        {/* Saisie dépense */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Montant de la dépense (€)
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={montant}
            onChange={(e) => {
              setMontant(e.target.value);
              setSelectedMois(null);
              setShowCustom(false);
            }}
            placeholder="ex : 1 000"
            className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
          />
        </div>

        <AnimatePresence>
          {hasValidDepense && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Résultat solde */}
              <div className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Solde après dépense</p>
                  <p
                    className={`text-xl font-semibold ${soldeApres < 0 ? "text-red-500" : "text-emerald-500"
                      }`}
                  >
                    {formatEuro(soldeApres)}
                  </p>
                  {soldeApres < 0 && (
                    <p className="text-xs text-red-400 mt-0.5">⚠ Solde insuffisant</p>
                  )}
                </div>
                <ArrowRight size={16} className="text-zinc-400 flex-shrink-0" />
                <TrendingDown
                  size={22}
                  className={soldeApres < 0 ? "text-red-400" : "text-emerald-400"}
                />
              </div>

              {/* Plan de remboursement */}
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                  Rembourser {formatEuro(depense)} en :
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMoisClick(m)}
                      className={`px-4 h-8 rounded-lg text-xs font-medium transition-all ${selectedMois === m && !showCustom
                          ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 scale-105"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                    >
                      {m} mois
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleCustomClick}
                    className={`px-4 h-8 rounded-lg text-xs font-medium transition-all ${showCustom
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 scale-105"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                  >
                    Personnalisé
                  </button>
                </div>

                {showCustom && (
                  <motion.input
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    type="number"
                    min="1"
                    max="60"
                    value={customMois}
                    onChange={(e) => setCustomMois(e.target.value)}
                    placeholder="Nombre de mois"
                    className="mt-2 w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                  />
                )}

                <AnimatePresence>
                  {mensualite !== null && moisActifs && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 rounded-xl bg-zinc-900 dark:bg-white p-4 text-center"
                    >
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">
                        Mensualité sur {moisActifs} mois
                      </p>
                      <p className="text-2xl font-semibold text-white dark:text-zinc-900">
                        {formatEuro(mensualite)}
                        <span className="text-sm font-normal opacity-70"> /mois</span>
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Total remboursé : {formatEuro(mensualite * moisActifs)} sur{" "}
                        {moisActifs} mois
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}