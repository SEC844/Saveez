export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getActionLogs } from "@/lib/queries";
import DashboardShell from "@/components/dashboard/DashboardShell";
import HistoriqueClient from "./HistoriqueClient";
import { History } from "lucide-react";

export default async function HistoriquePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const logs = await getActionLogs(session.user.id, 200);

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
              Toutes vos actions
            </p>
          </div>
        </div>

        <HistoriqueClient logs={logs} totalCount={logs.length} />
      </div>
    </DashboardShell>
  );
}