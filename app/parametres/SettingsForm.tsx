"use client";

import { useActionState, useState } from "react";
import { updateSettingsAction, resetUserDataAction } from "@/app/actions/user-settings";
import { Loader2, CheckCircle, Save, AlertTriangle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SettingsFormProps {
  defaultValues: {
    name: string | null;
    objectifBase: number;
    fondsSecurite: number;
    epargneActuelle: number;
    revenuNet: number | null;
  };
}

export default function SettingsForm({ defaultValues }: SettingsFormProps) {
  const [state, action, isPending] = useActionState(updateSettingsAction, null);
  const [resetState, resetAction, isResetPending] = useActionState(resetUserDataAction, null);
  const [showReset, setShowReset] = useState(false);

  return (
    <div className="space-y-6 max-w-md">
      <form action={action} className="space-y-6">
        {/* Profil */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Profil</h2>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">PrÃ©nom</label>
            <input
              name="name"
              type="text"
              defaultValue={defaultValues.name ?? ""}
              placeholder="Votre prÃ©nom"
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
            />
          </div>
        </div>

        {/* Ã‰pargne */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Ã‰pargne</h2>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Objectif mensuel de repli (â‚¬)
            </label>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1.5">
              UtilisÃ© quand aucun objectif temporel n&apos;est dÃ©fini pour le mois
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
              Fonds de sÃ©curitÃ© (â‚¬)
            </label>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1.5">
              Palier &quot;intouchable&quot; Ã  atteindre en prioritÃ©
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
              Ã‰pargne actuelle (â‚¬)
            </label>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1.5">
              Solde rÃ©el de votre compte Ã©pargne aujourd&apos;hui
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

        {/* Revenus */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Revenus</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
            Optionnel â€” permet des suggestions d&apos;objectifs Ã  15 %, 20 % et 30 % lors de la crÃ©ation d&apos;un objectif
          </p>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Revenu mensuel net (â‚¬)
            </label>
            <input
              name="revenuNet"
              type="number"
              min="0"
              step="50"
              defaultValue={defaultValues.revenuNet ?? ""}
              placeholder="Ex : 2 500"
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
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
              <CheckCircle size={14} /> ParamÃ¨tres enregistrÃ©s
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

      {/* Zone de danger â€” Reset */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-900/40 p-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={14} className="text-red-500" />
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Zone de danger</h2>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
          Cette action supprime dÃ©finitivement toutes vos entrÃ©es d&apos;Ã©pargne, imprÃ©vus, objectifs et historique.
          Votre compte est conservÃ©. L&apos;opÃ©ration est <strong>irrÃ©versible</strong>.
        </p>

        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
          >
            <Trash2 size={13} />
            RÃ©initialiser toutes mes donnÃ©es
          </button>
        ) : (
          <form action={resetAction} className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
                Tapez <strong>RESET</strong> pour confirmer :
              </label>
              <input
                name="confirm"
                type="text"
                placeholder="RESET"
                autoComplete="off"
                className="w-full h-10 rounded-xl border border-red-200 dark:border-red-900/40 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>
            <AnimatePresence>
              {resetState?.error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-500">{resetState.error}</motion.p>
              )}
              {resetState?.success && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs text-emerald-500">DonnÃ©es rÃ©initialisÃ©es âœ“</motion.p>
              )}
            </AnimatePresence>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isResetPending}
                className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isResetPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Confirmer la rÃ©initialisation
              </button>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="px-4 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
