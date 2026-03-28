"use client";

import { useActionState, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createCompteAction } from "@/app/actions/compte";
import { Loader2, CheckCircle, Users } from "lucide-react";
import { motion } from "framer-motion";

const COULEURS = [
  { hex: "#8B5CF6", name: "Violet" },
  { hex: "#3B82F6", name: "Bleu" },
  { hex: "#10B981", name: "Vert" },
  { hex: "#F59E0B", name: "Ambre" },
  { hex: "#EF4444", name: "Rouge" },
  { hex: "#EC4899", name: "Rose" },
  { hex: "#06B6D4", name: "Cyan" },
  { hex: "#F97316", name: "Orange" },
];

interface AddCompteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: "vacances" | "autre" | "famille";
  familleId?: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  vacances: "Vacances",
  autre: "Autre",
  famille: "Famille",
};

export default function AddCompteModal({ open, onOpenChange, defaultType, familleId }: AddCompteModalProps) {
  const [state, action, isPending] = useActionState(createCompteAction, null);
  const [label, setLabel] = useState("");
  const [soldeInitial, setSoldeInitial] = useState("");
  const [couleur, setCouleur] = useState(defaultType === "famille" ? "#10B981" : COULEURS[0].hex);

  useEffect(() => {
    if (open) {
      setLabel("");
      setSoldeInitial("");
      setCouleur(defaultType === "famille" ? "#10B981" : COULEURS[0].hex);
    }
  }, [open, defaultType]);

  useEffect(() => {
    if (state?.success) {
      const timeout = setTimeout(() => onOpenChange(false), 700);
      return () => clearTimeout(timeout);
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
            {defaultType === "famille" && <Users size={16} className="text-emerald-500" />}
            Nouveau compte · {TYPE_LABELS[defaultType]}
          </DialogTitle>
        </DialogHeader>

        <form action={action} className="space-y-4 mt-2">
          <input type="hidden" name="type" value={defaultType} />
          <input type="hidden" name="couleur" value={couleur} />
          {defaultType === "famille" && familleId && (
            <input type="hidden" name="familleId" value={familleId} />
          )}

          {defaultType === "famille" && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <Users size={14} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Ce compte sera visible par tous les membres de votre famille. Il se crédite via la saisie mensuelle d&apos;épargne.
              </p>
            </div>
          )}

          {/* Nom du compte */}
          <div>
            <label htmlFor="label" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Nom du compte
            </label>
            <input
              id="label" name="label" type="text"
              placeholder={defaultType === "famille" ? "Ex : Vacances Grèce 2026" : "Ex : Vacances été 2026"}
              value={label} onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              required autoFocus
            />
          </div>

          {/* Solde initial */}
          <div>
            <label htmlFor="soldeInitial" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Solde initial <span className="text-zinc-400 font-normal">(optionnel)</span>
            </label>
            <input
              id="soldeInitial" name="soldeInitial" type="number" step="0.01" min="0" placeholder="0"
              value={soldeInitial} onChange={(e) => setSoldeInitial(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Couleur</label>
            <div className="flex items-center gap-2.5">
              {COULEURS.map((c) => (
                <button key={c.hex} type="button" onClick={() => setCouleur(c.hex)}
                  className="relative w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none"
                  style={{ backgroundColor: c.hex }} title={c.name}>
                  {couleur === c.hex && (
                    <span className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-zinc-900 dark:ring-white pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {state?.error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
            </div>
          )}
          {state?.success && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-xs text-green-600 dark:text-green-400">Compte créé !</p>
            </motion.div>
          )}

          <button type="submit" disabled={isPending}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending ? <><Loader2 size={16} className="animate-spin" />Création...</> : "Créer le compte"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
