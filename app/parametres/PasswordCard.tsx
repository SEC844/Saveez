"use client";

import { useActionState } from "react";
import { updateMyPasswordAction } from "@/app/actions/profile";
import { Loader2, CheckCircle, AlertCircle, KeyRound } from "lucide-react";

const inputCls = "w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all";

export default function PasswordCard() {
  const [state, action, isPending] = useActionState(updateMyPasswordAction, null);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      <div className="px-6 py-5 flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
          <KeyRound size={14} className="text-zinc-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Changer le mot de passe</p>
          <form action={action} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Mot de passe actuel
              </label>
              <input name="currentPassword" type="password" required autoComplete="current-password" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Nouveau (12 caractères min.)
                </label>
                <input name="newPassword" type="password" required autoComplete="new-password" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Confirmer
                </label>
                <input name="confirmPassword" type="password" required autoComplete="new-password" className={inputCls} />
              </div>
            </div>

            {state?.error && (
              <p className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertCircle size={12} />{state.error}
              </p>
            )}
            {state?.success && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-500">
                <CheckCircle size={12} />Mot de passe mis à jour !
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 size={13} className="animate-spin" /> : null}
              Mettre à jour
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
