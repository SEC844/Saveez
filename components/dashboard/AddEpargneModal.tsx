"use client";

import { useActionState, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { upsertEpargneMensuelleAction } from "@/app/actions/epargne-mensuelle";
import { Plus, Loader2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MOIS_LABELS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export default function AddEpargneModal() {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(upsertEpargneMensuelleAction, null);

  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(() => setOpen(false), 800);
      return () => clearTimeout(t);
    }
  }, [state]);

  const years = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
        >
          <Plus size={15} />
          Saisir un mois
        </motion.button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white">Saisir l&apos;épargne mensuelle</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Mois</label>
              <select
                name="mois"
                defaultValue={now.getMonth() + 1}
                className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
              >
                {MOIS_LABELS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Année</label>
              <select
                name="annee"
                defaultValue={now.getFullYear()}
                className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Montant mis de côté (€)</label>
            <input
              name="montant"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="ex: 450"
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Note <span className="text-zinc-300 font-normal">(optionnel)</span></label>
            <input
              name="note"
              type="text"
              placeholder="ex: Prime reçue ce mois"
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
            />
          </div>

          <AnimatePresence>
            {state?.error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs text-red-500">{state.error}</motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={isPending}
            whileTap={{ scale: 0.98 }}
            className="w-full h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : state?.success ? <CheckCircle size={14} /> : <Plus size={14} />}
            {state?.success ? "Enregistré !" : "Enregistrer"}
          </motion.button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
