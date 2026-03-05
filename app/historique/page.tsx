export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getActionLogs } from "@/lib/queries";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { History, TrendingUp, PiggyBank, AlertTriangle, Settings, Target, Trash2, RotateCcw } from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: typeof History; color: string; bg: string }> = {
  add_epargne: { icon: PiggyBank, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  add_imprevu: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  delete_imprevu: { icon: Trash2, color: "text-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
  rembourser: { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  add_objectif: { icon: Target, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
  delete_objectif: { icon: Trash2, color: "text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-800" },
  update_settings: { icon: Settings, color: "text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-800" },
  reset: { icon: RotateCcw, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
};

const TYPE_LABEL: Record<string, string> = {
  add_epargne: "Épargne",
  add_imprevu: "Imprévu",
  delete_imprevu: "Suppression",
  rembourser: "Remboursement",
  add_objectif: "Objectif",
  delete_objectif: "Suppression",
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

export default async function HistoriquePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const logs = await getActionLogs(session.user.id, 100);

  // Grouper par type pour filtrage
  const types = [...new Set(logs.map((l) => l.type))];

  return (
    <DashboardShell>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <History size={16} className="text-zinc-600 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Historique</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Toutes vos actions — {logs.length} entrée{logs.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl mb-4">📋</div>
            <p className="text-zinc-600 dark:text-zinc-300 font-medium">Aucune action pour l&apos;instant</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              Vos actions apparaîtront ici au fur et à mesure.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filtres par type */}
            {types.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {types.map((t) => {
                  const cfg = TYPE_CONFIG[t] ?? { color: "text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-800" };
                  return (
                    <span
                      key={t}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}
                    >
                      {TYPE_LABEL[t] ?? t}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              {logs.map((log, i) => {
                const cfg = TYPE_CONFIG[log.type] ?? {
                  icon: History,
                  color: "text-zinc-400",
                  bg: "bg-zinc-100 dark:bg-zinc-800",
                };
                const Icon = cfg.icon;
                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-4 px-5 py-4 ${
                      i < logs.length - 1 ? "border-b border-zinc-50 dark:border-zinc-800/60" : ""
                    }`}
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 ${cfg.bg}`}>
                      <Icon size={14} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-snug">{log.label}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{formatDate(log.createdAt)}</p>
                    </div>
                    {log.montant != null && (
                      <span className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">
                        {log.montant.toLocaleString("fr-FR")} €
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
