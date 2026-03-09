"use client";

import { motion } from "framer-motion";
import { Wallet, AlertCircle, Plane, Star, PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Compte } from "@prisma/client";

type Props = {
  comptes: Compte[];
  soldeTotal: number;
  totalSoldesComptes: number;
};

// Icônes par type de compte
const ICONS = {
  standard: PiggyBank,
  imprevus: AlertCircle,
  vacances: Plane,
  autre: Star,
};

// Couleurs par type de compte (Tailwind classes)
const COLORS = {
  standard: "from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-900",
  imprevus: "from-orange-500/10 to-orange-600/5 border-orange-200 dark:border-orange-900",
  vacances: "from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-900",
  autre: "from-green-500/10 to-green-600/5 border-green-200 dark:border-green-900",
};

// Labels affichés par type
const LABELS = {
  standard: "Épargne Standard",
  imprevus: "Remboursements Imprévus",
  vacances: "Vacances",
  autre: "Autre",
};

export default function ComptesClient({ comptes, soldeTotal, totalSoldesComptes }: Props) {
  // Grouper les comptes par type pour l'affichage
  const comptesStandard = comptes.filter((c) => c.type === "standard");
  const comptesImprevus = comptes.filter((c) => c.type === "imprevus");
  const comptesVacances = comptes.filter((c) => c.type === "vacances");
  const comptesAutre = comptes.filter((c) => c.type === "autre");

  const orderedComptes = [
    ...comptesStandard,
    ...comptesImprevus,
    ...comptesVacances,
    ...comptesAutre,
  ];

  // Vérification de cohérence (optionnelle, pour debug)
  const ecart = Math.abs(soldeTotal - totalSoldesComptes);
  const hasEcart = ecart > 0.01; // Tolérance de 1 centime pour les arrondis

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

      {/* Carte du total global */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="p-6 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Solde Total
              </p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                {soldeTotal.toLocaleString("fr-FR")} €
              </p>
              {hasEcart && (
                <p className="text-xs text-orange-500 dark:text-orange-400 mt-2">
                  ⚠️ Écart de {ecart.toFixed(2)} € détecté (somme comptes : {totalSoldesComptes.toFixed(2)} €)
                </p>
              )}
            </div>
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <Wallet className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Liste des comptes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orderedComptes.map((compte, index) => {
          const Icon = ICONS[compte.type as keyof typeof ICONS];
          const colorClasses = COLORS[compte.type as keyof typeof COLORS];
          const label = compte.label || LABELS[compte.type as keyof typeof LABELS];
          const isNegative = compte.solde < 0;
          const isZero = compte.solde === 0;

          return (
            <motion.div
              key={compte.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card
                className={`p-5 bg-gradient-to-br ${colorClasses} border transition-all hover:shadow-md ${
                  !compte.actif ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/50 dark:bg-zinc-900/50 rounded-lg">
                      <Icon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {label}
                      </p>
                      {!compte.actif && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          (Désactivé)
                        </p>
                      )}
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
                {soldeTotal > 0 && compte.solde > 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-700/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Part du total
                      </span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {((compte.solde / soldeTotal) * 100).toFixed(1)} %
                      </span>
                    </div>
                    {/* Barre de progression */}
                    <div className="mt-2 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(compte.solde / soldeTotal) * 100}%` }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
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

      {/* Message si aucun compte (ne devrait pas arriver après migration) */}
      {comptes.length === 0 && (
        <Card className="p-8 text-center bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 dark:text-zinc-400">
            Aucun compte trouvé. Créez vos premiers comptes dans les paramètres.
          </p>
        </Card>
      )}
    </div>
  );
}
