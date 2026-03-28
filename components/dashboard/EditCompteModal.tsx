"use client";

import { useActionState, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateCompteAction } from "@/app/actions/compte";
import { Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { Compte } from "@prisma/client";

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

interface EditCompteModalProps {
  compte: Compte;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditCompteModal({ compte, open, onOpenChange }: EditCompteModalProps) {
  const [state, action, isPending] = useActionState(updateCompteAction, null);
  const [label, setLabel] = useState(compte.label);
  const [couleur, setCouleur] = useState(compte.couleur || "#8B5CF6");

  useEffect(() => {
    if (open) {
      setLabel(compte.label);
      setCouleur(compte.couleur || "#8B5CF6");
    }
  }, [open, compte]);

  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(() => onOpenChange(false), 700);
      return () => clearTimeout(t);
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white">Modifier le compte</DialogTitle>
        </DialogHeader>

        <form action={action} className="space-y-4 mt-2">
          <input type="hidden" name="compteId" value={compte.id} />
          <input type="hidden" name="couleur" value={couleur} />

          <div>
            <label htmlFor="label-edit" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Nom du compte
            </label>
            <input
              id="label-edit"
              name="label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Couleur</label>
            <div className="flex items-center gap-2.5">
              {COULEURS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setCouleur(c.hex)}
                  className="relative w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            >
              <CheckCircle size={16} className="text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-xs text-green-600 dark:text-green-400">Modifie !</p>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <><Loader2 size={16} className="animate-spin" /> Enregistrement...</> : "Enregistrer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
