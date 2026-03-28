"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  TrendingUp,
  PiggyBank,
  AlertTriangle,
  Settings,
  Target,
  Trash2,
  RotateCcw,
} from "lucide-react";

type ActionLog = {
  id: string;
  type: string;
  label: string;
  montant: number | null;
  createdAt: Date;
};

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; border: string }
> = {
  add_epargne: {
    icon: PiggyBank,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-100 dark:border-emerald-900/30",
  },
  add_imprevu: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-100 dark:border-amber-900/30",
  },
  delete_imprevu: {
    icon: Trash2,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-100 dark:border-red-900/30",
  },
  rembourser: {
    icon: TrendingUp,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-100 dark:border-blue-900/30",
  },
  add_objectif: {
    icon: Target,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-100 dark:border-violet-900/30",
  },
  delete_objectif: {
    icon: Trash2,
    color: "text-zinc-500",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    border: "border-zinc-100 dark:border-zinc-700",
  },
  update_settings: {
    icon: Settings,
    color: "text-zinc-500",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    border: "border-zinc-100 dark:border-zinc-700",
  },
  reset: {
    icon: RotateCcw,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-100 dark:border-red-900/30",
  },
};

const TYPE_LABEL: Record<string, string> = {
  add_epargne: "Épargne",
  add_imprevu: "Imprévu",
  delete_imprevu: "Suppression",
  rembourser: "Remboursement",
  add_objectif: "Objectif",
  delete_objectif: "Objectif supprimé",
  update_settings: "Paramètres",
  reset: "Réinitialisation",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface HistoriqueClientProps {
  logs: ActionLog[];
  totalCount: number;
}

export default function HistoriqueClient({ logs, totalCount }: HistoriqueClientProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const types = [...new Set(logs.map((l) => l.type))];
  const filtered = activeFilter ? logs.filter((l) => l.type === activeFilter) : logs;

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl mb-4">
          📋
        </div>
        <p className="text-zinc-600 dark:text-zinc-300 font-medium">Aucune action pour l&apos;instant</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
          Vos actions apparaîtront ici au fur et à mesure.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      {types.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter(null)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === null
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
          >
            Tout ({totalCount})
          </button>
          {types.map((t) => {
            const cfg = TYPE_CONFIG[t] ?? {
              color: "text-zinc-400",
              bg: "bg-zinc-100 dark:bg-zinc-800",
              border: "",
            };
            const count = logs.filter((l) => l.type === t).length;
            return (
              <button
                key={t}
                onClick={() => setActiveFilter(activeFilter === t ? null : t)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === t
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : `${cfg.bg} ${cfg.color} hover:opacity-80`
                  }`}
              >
                {TYPE_LABEL[t] ?? t} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {filtered.map((log, i) => {
            const cfg = TYPE_CONFIG[log.type] ?? {
              icon: History,
              color: "text-zinc-400",
              bg: "bg-zinc-100 dark:bg-zinc-800",
              border: "border-zinc-100 dark:border-zinc-700",
            };
            const Icon = cfg.icon;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ delay: i * 0.02 }}
                className={`flex items-start gap-4 px-5 py-4 ${i < filtered.length - 1
                    ? "border-b border-zinc-50 dark:border-zinc-800"
                    : ""
                  }`}
              >
                {/* Icône */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}
                >
                  <Icon size={14} className={cfg.color} />
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-800 dark:text-zinc-100 leading-snug">{log.label}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{formatDate(log.createdAt)}</p>
                </div>

                {/* Montant */}
                {log.montant !== null && (
                  <span
                    className={`text-sm font-semibold flex-shrink-0 ${log.type === "add_epargne" || log.type === "rembourser" || log.type === "delete_imprevu"
                        ? "text-emerald-500"
                        : "text-red-400"
                      }`}
                  >
                    {log.type === "add_imprevu" ? "-" : "+"}
                    {log.montant.toLocaleString("fr-FR")} €
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && activeFilter && (
        <p className="text-center text-sm text-zinc-400 py-8">
          Aucune action de ce type.
        </p>
      )}
    </div>
  );
}
