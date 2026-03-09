"use client";

import { useActionState, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createCompteAction } from "@/app/actions/compte";
import { Plus, Loader2, CheckCircle, Plane, Star } from "lucide-react";
import { motion } from "framer-motion";

// Palette de couleurs prédéfinies
const COULEURS = [
  { hex: "#8B5CF6", name: "Violet" },
  { hex: "#3B82F6", name: "Bleu" },
  { hex: "#10B981", name: "Vert" },
  { hex: "#F59E0B", name: "Ambre" },
  { hex: "#EF4444", name: "Rouge" },
  { hex: "#EC4899", name: "Rose" },
  { hex: "#06B6D4", name: "Cyan" },
  { hex: "#8B5CF6", name: "Indigo" },
];

export default function AddCompteModal() {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(createCompteAction, null);

  const [type, setType] = useState<"vacances" | "autre">("vacances");
  const [label, setLabel] = useState("");
  const [soldeInitial, setSoldeInitial] = useState("");
  const [couleur, setCouleur] = useState(COULEURS[0].hex);

  useEffect(() => {
    if (state?.success) {
      const timeout = setTimeout(() => {
        setOpen(false);
        setLabel("");
        setSoldeInitial("");
        setType("vacances");
        setCouleur(COULEURS[0].hex);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
        >
          <Plus size={15} />
          Nouveau compte
        </motion.button>
      </DialogTrigger>

      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white">Créer un compte spécial</DialogTitle>
        </DialogHeader>

        <form action={action} className="space-y-4 mt-2">
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="couleur" value={couleur} />

          {/* Type de compte */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Type de compte
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("vacances")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  type === "vacances"
                    ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-500 text-zinc-900 dark:text-white"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                <Plane size={16} />
                Vacances
              </button>
              <button
                type="button"
                onClick={() => setType("autre")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  type === "autre"
                    ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-500 text-zinc-900 dark:text-white"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                <Star size={16} />
                Autre
              </button>
            </div>
          </div>

          {/* Nom du compte */}
          <div>
            <label htmlFor="label" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Nom du compte
            </label>
            <input
              id="label"
              name="label"
              type="text"
              placeholder="Ex: Vacances été 2026"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              required
            />
          </div>

          {/* Solde initial (optionnel) */}
          <div>
            <label htmlFor="soldeInitial" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Solde initial (€) <span className="text-zinc-400">(optionnel)</span>
            </label>
            <input
              id="soldeInitial"
              name="soldeInitial"
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              value={soldeInitial}
              onChange={(e) => setSoldeInitial(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>

          {/* Sélecteur de couleur */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Couleur du compte
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COULEURS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setCouleur(c.hex)}
                  className={`aspect-square rounded-lg border-2 transition-all ${
                    couleur === c.hex
                      ? "border-zinc-900 dark:border-white scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Erreur */}
          {state?.error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
            </div>
          )}

          {/* Succès */}
          {state?.success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            >
              <CheckCircle size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-xs text-green-600 dark:text-green-400">Compte créé !</p>
            </motion.div>
          )}

          {/* Bouton submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Création...
              </>
            ) : (
              "Créer le compte"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
