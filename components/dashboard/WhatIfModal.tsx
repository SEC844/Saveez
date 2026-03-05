"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { whatIfSimulation } from "@/app/actions/user-settings";
import { Sparkles, Loader2, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WhatIfResult } from "@/app/actions/user-settings";

export default function WhatIfModal() {
  const [open, setOpen] = useState(false);
  const [montant, setMontant] = useState("");
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSimulate() {
    const val = parseFloat(montant);
    if (isNaN(val) || val <= 0) return;
    startTransition(async () => {
      const r = await whatIfSimulation(val);
      setResult(r);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setResult(null); setMontant(""); } }}>
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
            Mode simulation
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 -mt-1">
          Que se passe-t-il si je dépense une somme hypothétique ?
        </p>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Dépense hypothétique (€)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={montant}
                onChange={(e) => { setMontant(e.target.value); setResult(null); }}
                placeholder="ex: 1500"
                className="flex-1 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
              />
              <motion.button
                type="button"
                onClick={handleSimulate}
                disabled={isPending || !montant}
                whileTap={{ scale: 0.97 }}
                className="px-4 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                {isPending ? <Loader2 size={13} className="animate-spin" /> : "Simuler"}
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4 space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white dark:bg-zinc-900 p-3 text-center">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Sans la dépense</p>
                    <p className="text-lg font-semibold text-emerald-500">
                      {result.projectionSans.toLocaleString("fr-FR")} €
                    </p>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-zinc-900 p-3 text-center">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Avec la dépense</p>
                    <p className="text-lg font-semibold text-red-400">
                      {result.projectionAvec.toLocaleString("fr-FR")} €
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 rounded-xl px-3 py-2.5">
                  <TrendingDown size={14} className="text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-red-500 font-medium">
                      Impact : −{result.difference.toLocaleString("fr-FR")} €
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      {result.moisPourRattraper} mois pour rattraper ce déficit
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
