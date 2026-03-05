"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/app/actions/user-settings";
import { Loader2, CheckCircle, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SettingsFormProps {
  defaultValues: {
    name: string | null;
    objectifBase: number;
    fondsSecurite: number;
    epargneActuelle: number;
  };
}

export default function SettingsForm({ defaultValues }: SettingsFormProps) {
  const [state, action, isPending] = useActionState(updateSettingsAction, null);

  return (
    <form action={action} className="space-y-6 max-w-md">
      {/* Profil */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Profil</h2>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Prénom</label>
          <input
            name="name"
            type="text"
            defaultValue={defaultValues.name ?? ""}
            placeholder="Votre prénom"
            className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
          />
        </div>
      </div>

      {/* Épargne */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Épargne</h2>

        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Objectif mensuel de base (€)
          </label>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1.5">
            Hors remboursements d&apos;imprévus
          </p>
          <input
            name="objectifBase"
            type="number"
            min="0"
            step="1"
            defaultValue={defaultValues.objectifBase}
            className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Fonds de sécurité (€)
          </label>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1.5">
            Palier &quot;intouchable&quot; à atteindre en priorité
          </p>
          <input
            name="fondsSecurite"
            type="number"
            min="0"
            step="100"
            defaultValue={defaultValues.fondsSecurite}
            className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Épargne actuelle (€)
          </label>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1.5">
            Solde réel de votre compte épargne aujourd&apos;hui
          </p>
          <input
            name="epargneActuelle"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaultValues.epargneActuelle}
            className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
          />
        </div>
      </div>

      <AnimatePresence>
        {state?.error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-sm text-red-500 px-1">{state.error}</motion.p>
        )}
        {state?.success && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-sm text-emerald-500 flex items-center gap-1.5 px-1">
            <CheckCircle size={14} /> Paramètres enregistrés
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={isPending}
        whileTap={{ scale: 0.98 }}
        className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors"
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Enregistrer
      </motion.button>
    </form>
  );
}
