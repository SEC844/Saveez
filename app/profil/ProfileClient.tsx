"use client";

import { useActionState } from "react";
import { updateMyPasswordAction, updateProfileIdentityAction } from "@/app/actions/profile";
import { Loader2, CheckCircle, AlertCircle, Shield } from "lucide-react";

interface ProfileClientProps {
  defaultName?: string | null;
  defaultEmail: string;
  roleName: string;
}

export default function ProfileClient({ defaultName, defaultEmail, roleName }: ProfileClientProps) {
  const [identityState, identityAction, identityPending] = useActionState(updateProfileIdentityAction, null);
  const [passwordState, passwordAction, passwordPending] = useActionState(updateMyPasswordAction, null);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="flex items-center gap-2 mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          <Shield size={14} />
          Rôle actuel : <span className="font-medium text-zinc-900 dark:text-white">{roleName}</span>
        </div>

        <form action={identityAction} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Nom</label>
            <input
              name="name"
              defaultValue={defaultName ?? ""}
              placeholder="Votre nom"
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Adresse e-mail</label>
            <input
              name="email"
              type="email"
              required
              defaultValue={defaultEmail}
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white"
            />
          </div>

          {identityState?.error && (
            <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle size={13} />{identityState.error}</p>
          )}
          {identityState?.success && (
            <p className="text-xs text-emerald-500 flex items-center gap-1.5"><CheckCircle size={13} />Profil mis à jour</p>
          )}

          <button
            type="submit"
            disabled={identityPending}
            className="h-10 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium inline-flex items-center gap-2"
          >
            {identityPending && <Loader2 size={14} className="animate-spin" />}
            Enregistrer le profil
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Changer le mot de passe</h2>

        <form action={passwordAction} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Mot de passe actuel</label>
            <input
              name="currentPassword"
              type="password"
              required
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Nouveau mot de passe (12+)</label>
            <input
              name="newPassword"
              type="password"
              required
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Confirmer le nouveau mot de passe</label>
            <input
              name="confirmPassword"
              type="password"
              required
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white"
            />
          </div>

          {passwordState?.error && (
            <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle size={13} />{passwordState.error}</p>
          )}
          {passwordState?.success && (
            <p className="text-xs text-emerald-500 flex items-center gap-1.5"><CheckCircle size={13} />Mot de passe mis à jour</p>
          )}

          <button
            type="submit"
            disabled={passwordPending}
            className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium inline-flex items-center gap-2"
          >
            {passwordPending && <Loader2 size={14} className="animate-spin" />}
            Mettre à jour le mot de passe
          </button>
        </form>
      </div>
    </div>
  );
}
