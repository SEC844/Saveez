"use client";

import { motion } from "framer-motion";
import { Wallet, Plane, Star, PiggyBank, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Compte } from "@prisma/client";

type Props = {
  comptes: Compte[];
  epargneStandard: number;
  soldeComptesInactifs: number;
};

// Icônes par type de compte spécial
const ICONS = {
  vacances: Plane,
  autre: Star,
};

// Couleurs par type de compte (Tailwind classes)
const COLORS = {
  vacances: "from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-900",
  autre: "from-green-500/10 to-green-600/5 border-green-200 dark:border-green-900",
};

export default function ComptesClient({ comptes, epargneStandard, soldeComptesInactifs }: Props) {
  // Filtrer uniquement les comptes actifs pour l'affichage principal
  const comptesActifs = comptes.filter((c) => c.actif);

  // Calculer le total des soldes des comptes actifs
  const totalComptesActifs = comptesActifs.reduce((sum, c) => sum + c.solde, 0);

  // Total général
  const total = epargneStandard + totalComptesActifs + soldeComptesInactifs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Mes Comptes 💰
          </h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
            Vue d'ensemble de vos soldes par compte
          </p>
        </div>
      </div>

      {/* Carte de l'épargne standard (User.epargneActuelle) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-200 dark:border-blue-900 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/50 dark:bg-zinc-900/50 rounded-xl">
                <PiggyBank className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Épargne Standard
                </p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                  {epargneStandard.toLocaleString("fr-FR")} €
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  Solde principal de votre épargne
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Message pour les comptes inactifs avec solde */}
      {soldeComptesInactifs !== 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Comptes désactivés
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-0.5">
                  Dont <span className="font-semibold">{Math.abs(soldeComptesInactifs).toLocaleString("fr-FR")} €</span> provenant de comptes désactivés.
                  {soldeComptesInactifs > 0 
                    ? " Réactivez-les ou transférez le solde depuis les paramètres."
                    : " Solde négatif sur compte inactif."}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Liste des comptes spéciaux actifs */}
      {comptesActifs.length > 0 && (
        <>
          <div className="pt-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight mb-4">
              Comptes Spéciaux
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comptesActifs.map((compte, index) => {
              const Icon = ICONS[compte.type as keyof typeof ICONS] || Star;
              const colorClasses = COLORS[compte.type as keyof typeof COLORS] || COLORS.autre;
              const isNegative = compte.solde < 0;
              const isZero = compte.solde === 0;

              return (
                <motion.div
                  key={compte.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                >
                  <Card
                    className={`p-5 bg-gradient-to-br ${colorClasses} border transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/50 dark:bg-zinc-900/50 rounded-lg">
                          <Icon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {compte.label}
                          </p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 capitalize">
                            {compte.type}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Solde */}
                    <div className="mt-3">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Solde</p>
                      <p
                        className={`text-2xl font-bold tracking-tight ${
                          isNegative
                            ? "text-red-600 dark:text-red-400"
                            : isZero
                            ? "text-zinc-400 dark:text-zinc-500"
                            : "text-zinc-900 dark:text-white"
                        }`}
                      >
                        {compte.solde >= 0 ? "" : "-"}
                        {Math.abs(compte.solde).toLocaleString("fr-FR")} €
                      </p>
                    </div>

                    {/* Pourcentage du total */}
                    {total > 0 && compte.solde > 0 && (
                      <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-700/50">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 dark:text-zinc-400">
                            Part du total
                          </span>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {((compte.solde / total) * 100).toFixed(1)} %
                          </span>
                        </div>
                        {/* Barre de progression */}
                        <div className="mt-2 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(compte.solde / total) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + index * 0.05 }}
                            className="h-full bg-gradient-to-r from-zinc-600 to-zinc-800 dark:from-zinc-400 dark:to-zinc-500"
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Message si aucun compte spécial */}
      {comptesActifs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-8 text-center bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <Wallet className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
              Aucun compte spécial créé
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              Créez des comptes (Vacances, Autre) dans les paramètres pour répartir votre épargne.
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
