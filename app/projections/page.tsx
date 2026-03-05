export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardData, getGraphData } from "@/lib/queries";
import { getObjectifDynamique, getProjectionFinAnnee } from "@/lib/epargne";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ProjectionsClient from "./ProjectionsClient";
import { TrendingUp } from "lucide-react";

export default async function ProjectionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dashboardData = await getDashboardData(session.user.id);
  const { user, epargneMensuelles, imprévusActifs, currentYear, currentMonth, objectifs } = dashboardData;

  const graphData = await getGraphData(session.user.id, user.objectifBase, imprévusActifs, objectifs);

  const objectifMensuelDynamique = getObjectifDynamique(
    user.objectifBase,
    imprévusActifs,
    currentYear,
    currentMonth,
    objectifs
  );

  const projectionResult = getProjectionFinAnnee(
    user.epargneActuelle,
    user.objectifBase,
    imprévusActifs,
    epargneMensuelles,
    currentYear,
    objectifs
  );

  const moisRestants = 12 - currentMonth;

  return (
    <DashboardShell>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <TrendingUp size={16} className="text-zinc-600 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Projections</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Visualisez l&apos;évolution de votre épargne</p>
          </div>
        </div>

        <ProjectionsClient
          graphData={graphData}
          projection={{
            projectionFinAnnee: projectionResult.projection,
            totalEpargnéCetteAnnee: projectionResult.totalEpargnéCetteAnnee,
            moisBonis: projectionResult.moisBonis,
            moisDeficit: projectionResult.moisDeficit,
            moisRestants,
            objectifMensuelDynamique,
          }}
          epargneActuelle={user.epargneActuelle}
        />
      </div>
    </DashboardShell>
  );
}
