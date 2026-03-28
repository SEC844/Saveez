"use client";

import { useActionState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loginAction } from "./actions";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  const is2FAStep = state?.needs2fa === true && !!state?.challengeToken;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4 transition-colors duration-300">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 dark:bg-white shadow-lg mb-5"
          >
            <span className="text-2xl">💰</span>
          </motion.div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Saveez
          </h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={is2FAStep ? "2fa" : "login"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400"
            >
              {is2FAStep
                ? "Vérification en deux étapes"
                : "Connectez-vous à votre espace"}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-200/60 dark:shadow-none border border-zinc-100 dark:border-zinc-800 px-8 py-9 overflow-hidden">
          <AnimatePresence mode="wait">
            {is2FAStep ? (
              /* ── Étape 2FA ─────────────────────────────────────────────── */
              <motion.form
                key="totp"
                action={action}
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="space-y-5"
              >
                <input
                  type="hidden"
                  name="challengeToken"
                  value={state?.challengeToken ?? ""}
                />

                {/* Indicateur 2FA */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30">
                  <ShieldCheck
                    size={18}
                    className="text-blue-500 shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-snug">
                    Ouvrez votre application d&apos;authentification et saisissez
                    le code à 6 chiffres.
                  </p>
                </div>

                {/* Input TOTP */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Code de vérification
                  </label>
                  <input
                    name="totpCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="000000"
                    autoFocus
                    autoComplete="one-time-code"
                    required
                    className="w-full h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 text-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all duration-150 tracking-[0.35em] text-center font-mono"
                  />
                  <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500 text-center">
                    Vous pouvez aussi saisir un code de secours
                  </p>
                </div>

                {/* Erreur */}
                {state?.error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3"
                  >
                    <AlertCircle
                      size={15}
                      className="text-red-500 shrink-0"
                    />
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {state.error}
                    </p>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-1">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 h-11 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Vérification…
                      </>
                    ) : (
                      "Confirmer"
                    )}
                  </button>
                  <a
                    href="/login"
                    className="h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <ArrowLeft size={14} />
                    Retour
                  </a>
                </div>
              </motion.form>
            ) : (
              /* ── Connexion standard ─────────────────────────────────────── */
              <motion.form
                key="credentials"
                action={action}
                initial={{ opacity: 0, x: -32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 32 }}
                transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Adresse e-mail
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="vous@exemple.com"
                    className="w-full h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all duration-150"
                  />
                </div>

                {/* Mot de passe */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      className="w-full h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 pr-11 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all duration-150"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                      aria-label="Afficher/masquer le mot de passe"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Erreur */}
                {state?.error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3"
                  >
                    <AlertCircle
                      size={15}
                      className="text-red-500 flex-shrink-0"
                    />
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {state.error}
                    </p>
                  </motion.div>
                )}

                {/* Soumettre */}
                <motion.button
                  type="submit"
                  disabled={isPending}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-11 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2 mt-1"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Connexion…
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {!is2FAStep && (
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-6">
            Première utilisation ?{" "}
            <a
              href="/setup"
              className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
            >
              Créer votre compte
            </a>
          </p>
        )}
      </motion.div>
    </div>
  );
}
