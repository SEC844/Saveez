"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/app/actions/user-settings";
import { Loader2, CheckCircle, Save, User, PiggyBank, TrendingUp } from "lucide-react";
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

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-0.5">{label}</label>
      {hint && <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all";

export default function SettingsForm({ defaultValues }: SettingsFormProps) {
  const [state, action, isPending] = useActionState(updateSettingsAction, null);

  return (
    <div className="space-y-4 max-w-lg">

      {/* ── Formulaire principal ─────────────────────────────────────────── */}
      <form action={action}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">

          {/* Profil */}
          <div className="px-6 py-5 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
              <User size={14} className="text-zinc-500" />
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Profil</p>
              <FieldGroup label="Prénom">
                <input name="name" type="text" defaultValue={defaultValues.name ?? ""} placeholder="Votre prénom" className={inputCls} />
              </FieldGroup>
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800" />

          {/* Revenus */}
          <div className="px-6 py-5 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp size={14} className="text-zinc-500" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Revenus</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Permettra des suggestions d&apos;objectifs à 15 %, 20 % et 30 %.</p>
              </div>
              <FieldGroup label="Revenu mensuel net (€)">
                <input name="revenuNet" type="number" min="0" step="50" defaultValue={defaultValues.revenuNet ?? ""} placeholder="Ex : 2 500" className={inputCls} />
              </FieldGroup>
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800" />

          {/* Épargne */}
          <div className="px-6 py-5 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
              <PiggyBank size={14} className="text-zinc-500" />
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Épargne</p>

              <FieldGroup label="Épargne actuelle (€)" hint="Solde réel de votre compte épargne aujourd'hui.">
                <input name="epargneActuelle" type="number" min="0" step="0.01" defaultValue={defaultValues.epargneActuelle} className={inputCls} />
              </FieldGroup>

              <FieldGroup label="Objectif mensuel de repli (€)" hint="Utilisé quand aucun objectif temporel n'est actif pour le mois.">
                <input name="objectifBase" type="number" min="0" step="1" defaultValue={defaultValues.objectifBase} className={inputCls} />
              </FieldGroup>

              <FieldGroup label="Fonds de sécurité (€)" hint="Palier « intouchable » à atteindre en priorité.">
                <input name="fondsSecurite" type="number" min="0" step="100" defaultValue={defaultValues.fondsSecurite} className={inputCls} />
              </FieldGroup>
            </div>
          </div>

          {/* Footer avec bouton */}
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
            <AnimatePresence mode="wait">
              {state?.error && (
                <motion.p key="err" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-500">{state.error}</motion.p>
              )}
              {state?.success && (
                <motion.p key="ok" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-xs text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle size={12} /> Enregistré
                </motion.p>
              )}
              {!state?.error && !state?.success && <span />}
            </AnimatePresence>

            <motion.button type="submit" disabled={isPending} whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-5 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors shrink-0">
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Enregistrer
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  );
}

