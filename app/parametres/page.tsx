export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SettingsForm from "./SettingsForm";
import { Settings } from "lucide-react";

export default async function ParametresPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      objectifBase: true,
      fondsSecurite: true,
      epargneActuelle: true,
      revenuNet: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <DashboardShell>
      <div className="p-6 md:p-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Settings size={16} className="text-zinc-600 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Paramètres</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Configurez votre profil et vos préférences</p>
          </div>
        </div>

        <SettingsForm
          defaultValues={{
            name: user.name,
            objectifBase: user.objectifBase,
            fondsSecurite: user.fondsSecurite,
            epargneActuelle: user.epargneActuelle,
            revenuNet: user.revenuNet,
          }}
        />
      </div>
    </DashboardShell>
  );
}
