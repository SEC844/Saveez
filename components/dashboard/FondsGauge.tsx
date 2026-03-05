"use client";

import { motion } from "framer-motion";
import { Shield, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface FondsGaugeProps {
  epargneActuelle: number;
  fondsSecurite: number;
}

export default function FondsGauge({ epargneActuelle, fondsSecurite }: FondsGaugeProps) {
  const pct = Math.min(100, (epargneActuelle / fondsSecurite) * 100);
  const atteint = epargneActuelle >= fondsSecurite;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-zinc-400 dark:text-zinc-500">
            Fonds de sécurité
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
            {epargneActuelle.toLocaleString("fr-FR")} € sur {fondsSecurite.toLocaleString("fr-FR")} €
          </p>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center",
          atteint ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-amber-50 dark:bg-amber-950/30"
        )}>
          {atteint
            ? <Shield size={15} className="text-emerald-500" />
            : <ShieldAlert size={15} className="text-amber-500" />
          }
        </div>
      </div>

      {/* Track */}
      <div className="relative h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn(
            "h-full rounded-full",
            atteint
              ? "bg-emerald-500"
              : pct > 50
                ? "bg-amber-400"
                : "bg-red-400"
          )}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <p className={cn(
          "text-xs font-medium",
          atteint ? "text-emerald-500" : "text-amber-500"
        )}>
          {pct.toFixed(0)} %
        </p>
        {!atteint && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Encore {(fondsSecurite - epargneActuelle).toLocaleString("fr-FR")} € à constituer
          </p>
        )}
        {atteint && (
          <p className="text-xs text-emerald-500 font-medium">
            Fonds constitué ✓
          </p>
        )}
      </div>
    </motion.div>
  );
}
