"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { setupAction } from "./actions";
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

export default function SetupForm() {
  const [state, action, isPending] = useActionState(setupAction, null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
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
            Bienvenue sur Épargne
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
            C&apos;est votre première visite. Créez votre compte personnel
            pour commencer à suivre votre épargne.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-200/60 dark:shadow-none border border-zinc-100 dark:border-zinc-800 px-8 py-9">
          <form action={action} className="space-y-5">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Prénom <span className="text-zinc-400 font-normal">(optionnel)</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="given-name"
                placeholder="Marie"
                className="w-full h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
              />
            </div>

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
                className="w-full h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Mot de passe{" "}
                <span className="text-zinc-400 font-normal">(12 car. min.)</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="••••••••••••"
                  className="w-full h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 pr-11 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirm"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="••••••••••••"
                  className="w-full h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 pr-11 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Épargne actuelle */}
            <div>
              <label
                htmlFor="epargneActuelle"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Solde épargne actuel{" "}
                <span className="text-zinc-400 font-normal">(optionnel)</span>
              </label>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">
                Montant déjà mis de côté sur votre compte épargne
              </p>
              <div className="relative">
                <input
                  id="epargneActuelle"
                  name="epargneActuelle"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="w-full h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 pr-12 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
                  €
                </span>
              </div>
            </div>

            {/* Error / Success */}
            {state?.error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3"
              >
                <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isPending}
              whileTap={{ scale: 0.98 }}
              className="w-full h-11 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Création…
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  Créer mon compte
                </>
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-6">
          Déjà un compte ?{" "}
          <a
            href="/login"
            className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
          >
            Se connecter
          </a>
        </p>
      </motion.div>
    </div>
  );
}
