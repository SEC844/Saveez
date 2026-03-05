export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AddObjectifModal from "@/components/dashboard/AddObjectifModal";
import ObjectifsList from "./ObjectifsList";
import { Target } from "lucide-react";

export default async function ObjectifsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [objectifs, user] = await Promise.all([
    prisma.objectif.findMany({
      where: { userId: session.user.id },
      orderBy: { dateDebut: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { revenuNet: true, objectifBase: true },
    }),
  ]);

  if (!user) redirect("/login?error=session");

  return (
    <DashboardShell>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Target size={16} className="text-zinc-600 dark:text-zinc-300" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Objectifs</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Définissez vos objectifs d&apos;épargne par période
              </p>
            </div>
          </div>
          <AddObjectifModal revenuNet={user.revenuNet} />
        </div>

        <ObjectifsList
          objectifs={objectifs}
          objectifBase={user.objectifBase}
          revenuNet={user.revenuNet}
        />
      </div>
    </DashboardShell>
  );
}
