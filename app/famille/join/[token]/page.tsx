export const dynamic = "force-dynamic";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAuthUser } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { joinFamilleAction } from "@/app/actions/famille";
import { redirect } from "next/navigation";
import { Users, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function JoinFamillePage({ params }: Props) {
  const { token } = await params;
  await requireAuthUser();

  const invitation = await prisma.invitationFamille.findUnique({
    where: { token },
    include: { famille: { select: { name: true, _count: { select: { membres: true } } } } },
  });

  // Invalide ou expirée
  if (!invitation || invitation.expiresAt < new Date()) {
    return (
      <DashboardShell>
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Lien invalide</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Ce lien d'invitation est invalide ou a expiré. Demandez un nouveau lien à l'administrateur de la famille.
          </p>
          <a href="/famille" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium">
            Retour à ma famille
          </a>
        </div>
      </DashboardShell>
    );
  }

  // Déjà utilisée
  if (invitation.usedAt) {
    return (
      <DashboardShell>
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-yellow-100 dark:bg-yellow-950/30 flex items-center justify-center mx-auto">
            <AlertCircle size={24} className="text-yellow-500" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Invitation déjà utilisée</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Ce lien a déjà été accepté. Demandez un nouveau lien si nécessaire.
          </p>
          <a href="/famille" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium">
            Ma famille
          </a>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto">
          <Users size={28} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Rejoindre la famille
          </h1>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            « {invitation.famille.name} »
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">
            {invitation.famille._count.membres} membre{invitation.famille._count.membres > 1 ? "s" : ""} actuellement
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await joinFamilleAction(token);
            redirect("/famille");
          }}
        >
          <button
            type="submit"
            className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle size={16} />
            Accepter et rejoindre
          </button>
        </form>

        <a
          href="/famille"
          className="block text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          Refuser et retourner à ma famille
        </a>
      </div>
    </DashboardShell>
  );
}
