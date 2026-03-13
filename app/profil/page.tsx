import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAuthUser } from "@/lib/authz";
import ProfileClient from "./ProfileClient";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const user = await requireAuthUser();

  return (
    <DashboardShell>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <User size={16} className="text-zinc-600 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Profil</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Gérez votre identité, e-mail et mot de passe</p>
          </div>
        </div>

        <ProfileClient
          defaultName={user.name}
          defaultEmail={user.email}
          roleName={user.role?.name ?? "standard"}
        />
      </div>
    </DashboardShell>
  );
}
