"use client";

import { useActionState, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createImprevuAction } from "@/app/actions/imprevu";
import { AlertTriangle, Loader2, CheckCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MOIS_LABELS = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];

interface AddImprevuModalProps {
  objectifBase: number;
}

export default function AddImprevuModal({ objectifBase }: AddImprevuModalProps) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(createImprevuAction, null);
  const [montant, setMontant] = useState("");
  const [duree, setDuree] = useState("6");
  const [moisDebut, setMoisDebut] = useState(now.getMonth() + 1);
  const [anneeDebut, setAnneeDebut] = useState(now.getFullYear());

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(() => {
        setOpen(false);
        setMontant("");
        setDuree("6");
        setMoisDebut(now.getMonth() + 1);
        setAnneeDebut(now.getFullYear());
      }, 800);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const mensuel = montant && duree
    ? Math.round((parseFloat(montant) / parseInt(duree)) * 100) / 100
    : null;
  const nouvelObjectif = mensuel ? objectifBase + mensuel : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <AlertTriangle size={14} />
          Ajouter un imprévu
        </motion.button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white">Nouvel imprévu</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Nom de la dépense</label>
            <input
              name="nom"
              type="text"
              required
              placeholder="ex: Machine à laver"
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Montant (€)</label>
              <input
                name="montantTotal"
                type="number"
                min="1"
                step="0.01"
                required
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="ex: 900"
                className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Duree (mois)</label>
              <input
                name="dureeRemboursement"
                type="number"
                min="1"
                max="120"
                required
                value={duree}
                onChange={(e) => setDuree(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
              />
            </div>
          </div>

          {/* Date de debut du remboursement */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Date de debut du remboursement</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <select
                  name="moisDebut"
                  value={moisDebut}
                  onChange={(e) => setMoisDebut(Number(e.target.value))}
                  className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 pr-8 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all appearance-none"
                >
                  {MOIS_LABELS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  name="anneeDebut"
                  value={anneeDebut}
                  onChange={(e) => setAnneeDebut(Number(e.target.value))}
                  className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 pr-8 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all appearance-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Preview calcul */}
          {mensuel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-xs space-y-1"
            >
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Remboursement mensuel</span>
                <span className="font-semibold text-zinc-900 dark:text-white">+{mensuel.toLocaleString("fr-FR")} €/mois</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Nouvel objectif mensuel</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{nouvelObjectif?.toLocaleString("fr-FR")} €/mois</span>
              </div>
            </motion.div>
          )}

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
            {isPending ? <Loader2 size={14} className="animate-spin" /> : state?.success ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {state?.success ? "Créé !" : "Créer l'imprévu"}
          </motion.button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
