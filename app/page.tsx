import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardData, getGraphData } from "@/lib/queries";
import {
  getObjectifDynamique,
  getEcart,
  getProjectionFinAnnee,
} from "@/lib/epargne";
import DashboardShell from "@/components/dashboard/DashboardShell";
import StatCard from "@/components/dashboard/StatCard";
import EpargneChart from "@/components/dashboard/EpargneChart";
import FondsGauge from "@/components/dashboard/FondsGauge";
import ImprevuProgressCard from "@/components/dashboard/ImprevuProgressCard";
import AddEpargneModal from "@/components/dashboard/AddEpargneModal";
import AddImprevuModal from "@/components/dashboard/AddImprevuModal";
import WhatIfModal from "@/components/dashboard/WhatIfModal";
import { Wallet, Target, TrendingUp, ArrowUpDown, History } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getDashboardData(session.user.id);
  const { user, epargneMensuelles, imprévusActifs, currentYear, currentMonth, objectifs } = data;
  const allImprévus = [...imprévusActifs, ...data.imprévusSoldés];

  const objectifDuMois = getObjectifDynamique(
    user.objectifBase,
    allImprévus,
    currentYear,
    currentMonth,
    objectifs
  );

  const entreeCourante = epargneMensuelles.find(
    (e) => e.annee === currentYear && e.mois === currentMonth
  );
  const ecart = entreeCourante
    ? getEcart(entreeCourante.montant, objectifDuMois)
    : null;

  const projection = getProjectionFinAnnee(
    user.epargneActuelle,
    user.objectifBase,
    allImprévus,
    epargneMensuelles,
    currentYear,
    objectifs
  );

  const graphData = await getGraphData(session.user.id, user.objectifBase, allImprévus, objectifs);

  const moisLabel = new Date(currentYear, currentMonth - 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Bonjour{user.name ? `, ${user.name}` : ""} 👋
          </h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5 capitalize">{moisLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddEpargneModal />
          <AddImprevuModal objectifBase={user.objectifBase} />
          <WhatIfModal epargneActuelle={user.epargneActuelle} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Épargne actuelle"
          value={`${user.epargneActuelle.toLocaleString("fr-FR")} €`}
          icon={Wallet}
          highlight
          delay={0}
        />
        <StatCard
          label="Objectif du mois"
          value={`${objectifDuMois.toLocaleString("fr-FR")} €`}
          subValue={imprévusActifs.length > 0 ? `dont ${(objectifDuMois - user.objectifBase).toLocaleString("fr-FR")} € remb.` : undefined}
          icon={Target}
          delay={0.05}
        />
        <StatCard
          label="Projection fin d'année"
          value={`${Math.round(projection.projection).toLocaleString("fr-FR")} €`}
          subValue={`+${Math.round(projection.totalEpargnéCetteAnnee).toLocaleString("fr-FR")} € cette année`}
          icon={TrendingUp}
          trend="up"
          delay={0.1}
        />
        <StatCard
          label={`Écart — ${new Date(currentYear, currentMonth - 1).toLocaleDateString("fr-FR", { month: "short" })}`}
          value={
            ecart === null
              ? "Non saisi"
              : `${ecart >= 0 ? "+" : ""}${ecart.toLocaleString("fr-FR")} €`
          }
          icon={ArrowUpDown}
          trend={ecart === null ? "neutral" : ecart >= 0 ? "up" : "down"}
          trendLabel={ecart === null ? undefined : ecart >= 0 ? "Bonus ✓" : "Déficit"}
          delay={0.15}
        />
      </div>

      {/* Chart + Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <div className="lg:col-span-2">
          <EpargneChart data={graphData} />
        </div>
        <div className="space-y-3">
          <FondsGauge
            epargneActuelle={user.epargneActuelle}
            fondsSecurite={user.fondsSecurite}
          />

          {/* Quick stats */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-3">
              Bilan {currentYear}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Mois au-dessus</span>
                <span className="font-medium text-emerald-500">{projection.moisBonis}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Mois en déficit</span>
                <span className="font-medium text-red-400">{projection.moisDeficit}</span>
              </div>
              <Separator className="my-1 dark:bg-zinc-800" />
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Imprévus actifs</span>
                <span className="font-medium text-zinc-900 dark:text-white">{imprévusActifs.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Imprévus actifs */}
      {imprévusActifs.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              Imprévus en cours
              <Badge variant="secondary" className="text-xs rounded-lg">
                {imprévusActifs.length}
              </Badge>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {imprévusActifs.map((imp, i) => (
              <ImprevuProgressCard key={imp.id} imprevu={imp} delay={i * 0.05} />
            ))}
          </div>
        </div>
      )}

      {/* Historique récent */}
      {epargneMensuelles.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-3">
            <History size={14} />
            Historique récent
          </h2>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Mois</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Montant</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Objectif</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Écart</th>
                </tr>
              </thead>
              <tbody>
                {epargneMensuelles.slice(0, 6).map((e, i) => {
                  const obj = getObjectifDynamique(user.objectifBase, allImprévus, e.annee, e.mois);
                  const diff = getEcart(e.montant, obj);
                  return (
                    <tr key={e.id} className={i < 5 ? "border-b border-zinc-50 dark:border-zinc-800/50" : ""}>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 capitalize">
                        {new Date(e.annee, e.mois - 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">
                        {e.montant.toLocaleString("fr-FR")} €
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400 dark:text-zinc-500">
                        {obj.toLocaleString("fr-FR")} €
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${diff >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                        {diff >= 0 ? "+" : ""}{diff.toLocaleString("fr-FR")} €
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {epargneMensuelles.length === 0 && imprévusActifs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl mb-4">💰</div>
          <p className="text-zinc-600 dark:text-zinc-300 font-medium">Bienvenue dans votre espace !</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">
            Commencez par saisir votre premier mois d&apos;épargne ou définissez vos paramètres.
          </p>
        </div>
      )}
    </DashboardShell>
  );
}
