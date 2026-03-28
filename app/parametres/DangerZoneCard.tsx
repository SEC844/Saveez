"use client";

import { useActionState, useState } from "react";
import { resetUserDataAction } from "@/app/actions/user-settings";
import { deleteAccountAction } from "@/app/actions/profile";
import { Loader2, CheckCircle, Trash2, ShieldAlert, UserX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ConfirmInput({ word, label }: { word: string; label: string }) {
  return (
    <div>
      <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
        Tapez <strong className="text-zinc-900 dark:text-white">{word}</strong> pour confirmer :
      </label>
      <input
        name="confirm"
        type="text"
        placeholder={word}
        autoComplete="off"
        className="w-full h-10 rounded-xl border border-red-200 dark:border-red-800 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
      />
    </div>
  );
}

export default function DangerZoneCard() {
  const [resetState, resetAction, isResetPending] = useActionState(resetUserDataAction, null);
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteAccountAction, null);
  const [showReset, setShowReset] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-100 dark:border-red-900/30 overflow-hidden">
      <div className="px-6 py-5 flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert size={14} className="text-red-500" />
        </div>
        <div className="flex-1 space-y-5">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">Zone de danger</p>

          {/* ── Réinitialiser les données ── */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Réinitialiser toutes mes données</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Supprime toutes vos entrées d&apos;épargne, imprévus, objectifs et historique. Votre compte est conservé. <strong>Irréversible.</strong>
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!showReset ? (
                <motion.button
                  key="reset-btn"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="inline-flex items-center gap-2 px-4 h-8 rounded-xl border border-red-200 dark:border-red-800 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 size={12} />
                  Réinitialiser mes données
                </motion.button>
              ) : (
                <motion.form
                  key="reset-form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  action={resetAction}
                  className="space-y-3"
                >
                  <ConfirmInput word="RESET" label="RESET" />
                  {resetState?.error && <p className="text-xs text-red-500">{resetState.error}</p>}
                  {resetState?.success && (
                    <p className="text-xs text-emerald-500 flex items-center gap-1.5">
                      <CheckCircle size={11} />Données réinitialisées
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button type="submit" disabled={isResetPending} className="inline-flex items-center gap-2 px-4 h-8 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                      {isResetPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Confirmer
                    </button>
                    <button type="button" onClick={() => setShowReset(false)} className="px-4 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                      Annuler
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-red-100 dark:border-red-900/30" />

          {/* ── Supprimer son compte ── */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Supprimer mon compte</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Supprime définitivement votre compte et toutes vos données. <strong>Cette action est irréversible.</strong>
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!showDelete ? (
                <motion.button
                  key="delete-btn"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  type="button"
                  onClick={() => setShowDelete(true)}
                  className="inline-flex items-center gap-2 px-4 h-8 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                >
                  <UserX size={12} />
                  Supprimer mon compte
                </motion.button>
              ) : (
                <motion.form
                  key="delete-form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  action={deleteAction}
                  className="space-y-3"
                >
                  <ConfirmInput word="SUPPRIMER" label="SUPPRIMER" />
                  {deleteState?.error && <p className="text-xs text-red-500">{deleteState.error}</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={isDeletePending} className="inline-flex items-center gap-2 px-4 h-8 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                      {isDeletePending ? <Loader2 size={12} className="animate-spin" /> : <UserX size={12} />}
                      Supprimer définitivement
                    </button>
                    <button type="button" onClick={() => setShowDelete(false)} className="px-4 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                      Annuler
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
