"use client";

import { useActionState } from "react";
import { toggleRegistrationAction } from "@/app/actions/admin";
import { CheckCircle, AlertCircle, Loader2, UserPlus, UserX } from "lucide-react";

interface AdminSettingsPanelProps {
  registrationEnabled: boolean;
}

function StatusMessage({ state }: { state: { error?: string; success?: boolean } | null }) {
  if (!state) return null;
  if (state.error)
    return (
      <p className="flex items-center gap-1.5 text-[11px] text-red-500 mt-2">
        <AlertCircle size={12} className="shrink-0" />
        {state.error}
      </p>
    );
  if (state.success)
    return (
      <p className="flex items-center gap-1.5 text-[11px] text-emerald-500 mt-2">
        <CheckCircle size={12} className="shrink-0" />
        Paramètre mis à jour
      </p>
    );
  return null;
}

export default function AdminSettingsPanel({ registrationEnabled }: AdminSettingsPanelProps) {
  const [state, action, isPending] = useActionState(toggleRegistrationAction, null);

  return (
    <div className="space-y-6">
      {/* Inscription publique */}
      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
            <UserPlus size={14} className="text-zinc-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Création de comptes
              </p>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  registrationEnabled
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                }`}
              >
                {registrationEnabled ? "Activée" : "Désactivée"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              {registrationEnabled
                ? "Les nouveaux utilisateurs peuvent créer un compte via la page d'inscription."
                : "La page d'inscription est désactivée. Un message sera affiché aux visiteurs."}
            </p>

            <div className="flex gap-2 flex-wrap">
              <form action={action}>
                <input type="hidden" name="enabled" value="true" />
                <button
                  type="submit"
                  disabled={isPending || registrationEnabled}
                  className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                  Activer l&apos;inscription
                </button>
              </form>

              <form action={action}>
                <input type="hidden" name="enabled" value="false" />
                <button
                  type="submit"
                  disabled={isPending || !registrationEnabled}
                  className="inline-flex items-center gap-2 px-4 h-9 rounded-xl border border-red-200 dark:border-red-800 text-xs font-medium text-red-600 dark:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : <UserX size={12} />}
                  Désactiver l&apos;inscription
                </button>
              </form>
            </div>

            <StatusMessage state={state} />
          </div>
        </div>
      </div>
    </div>
  );
}
