export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PasswordCard from "./PasswordCard";
import DangerZoneCard from "./DangerZoneCard";
import TwoFactorCard from "./TwoFactorCard";
import { Settings } from "lucide-react";

export default async function ParametresPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tf = await prisma.twoFactor.findUnique({ where: { userId: session.user.id } });
  const has2FA = tf?.enabled === true;

  return (
    <DashboardShell>
      <div className="p-6 md:p-8 max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Settings size={16} className="text-zinc-600 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Paramètres</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Sécurité et gestion du compte</p>
          </div>
        </div>

        <div className="space-y-6">
          <PasswordCard />
          <TwoFactorCard has2FA={has2FA} />
          <DangerZoneCard />
        </div>
      </div>
    </DashboardShell>
  );
}
