"use client";

import { useActionState, useState } from "react";
import { resetUserDataAction } from "@/app/actions/user-settings";
import { Loader2, CheckCircle, Trash2, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DangerZoneCard() {
  const [resetState, resetAction, isResetPending] = useActionState(resetUserDataAction, null);
  const [showReset, setShowReset] = useState(false);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-100 dark:border-red-900/30 overflow-hidden">
      <div className="px-6 py-5 flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert size={14} className="text-red-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Zone de danger</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
            Supprime définitivement toutes vos entrées d&apos;épargne, imprévus, objectifs et
            historique. Votre compte est conservé. <strong>Irréversible.</strong>
          </p>

          {!showReset ? (
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="inline-flex items-center gap-2 px-4 h-8 rounded-xl border border-red-200 dark:border-red-800 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <Trash2 size={12} />
              Réinitialiser toutes mes données
            </button>
          ) : (
            <form action={resetAction} className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Tapez{" "}
                  <strong className="text-zinc-900 dark:text-white">RESET</strong> pour confirmer :
                </label>
                <input
                  name="confirm"
                  type="text"
                  placeholder="RESET"
                  autoComplete="off"
                  className="w-full h-10 rounded-xl border border-red-200 dark:border-red-800 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
              </div>
              <AnimatePresence>
                {resetState?.error && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-xs text-red-500"
                  >
                    {resetState.error}
                  </motion.p>
                )}
                {resetState?.success && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-xs text-emerald-500 flex items-center gap-1.5"
                  >
                    <CheckCircle size={11} /> Données réinitialisées
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isResetPending}
                  className="inline-flex items-center gap-2 px-4 h-8 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isResetPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Confirmer
                </button>
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="px-4 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
