export const dynamic = "force-dynamic";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAuthUser } from "@/lib/authz";
import ProfileClient from "./ProfileClient";
import { prisma } from "@/lib/db";

function computeStreak(entries: { annee: number; mois: number }[]): number {
  if (entries.length === 0) return 0;
  const now = new Date();
  let streak = 0;
  let checkYear = now.getFullYear();
  let checkMonth = now.getMonth() + 1;
  const set = new Set(entries.map((e) => `${e.annee}-${e.mois}`));
  for (let i = 0; i < 120; i++) {
    if (set.has(`${checkYear}-${checkMonth}`)) {
      streak++;
      checkMonth--;
      if (checkMonth === 0) { checkMonth = 12; checkYear--; }
    } else {
      break;
    }
  }
  return streak;
}

export default async function ProfilPage() {
  const user = await requireAuthUser();

  const [epargnes, famille, dbUser, comptes, recentLogs] = await Promise.all([
    prisma.epargneMensuelle.findMany({
      where: { userId: user.id },
      orderBy: [{ annee: "desc" }, { mois: "desc" }],
    }),
    prisma.membreFamille.findFirst({
      where: { userId: user.id },
      include: { famille: { select: { id: true, name: true } } },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true, email: true, bio: true, avatarUrl: true, createdAt: true,
        objectifBase: true, fondsSecurite: true, epargneActuelle: true, revenuNet: true,
      },
    }),
    prisma.compte.findMany({
      where: { userId: user.id, actif: true },
      select: { id: true, label: true, solde: true, couleur: true, type: true },
    }),
    prisma.actionLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  if (!dbUser) return null;

  const totalEpargne = epargnes.reduce((s, e) => s + e.montant, 0);
  const nbMois = epargnes.length;
  const moyenneMensuelle = nbMois > 0 ? totalEpargne / nbMois : 0;
  const meilleurMois = epargnes.length > 0 ? Math.max(...epargnes.map((e) => e.montant)) : 0;
  const streakCourant = computeStreak(epargnes);

  return (
    <DashboardShell>
      <ProfileClient
        userId={user.id}
        defaultName={dbUser.name}
        defaultEmail={dbUser.email}
        defaultBio={dbUser.bio}
        defaultAvatarUrl={dbUser.avatarUrl}
        roleName={user.role?.name ?? "standard"}
        createdAt={dbUser.createdAt}
        stats={{ totalEpargne, nbMois, moyenneMensuelle, meilleurMois, streakCourant }}
        financials={{
          objectifBase: dbUser.objectifBase,
          fondsSecurite: dbUser.fondsSecurite,
          epargneActuelle: dbUser.epargneActuelle,
          revenuNet: dbUser.revenuNet,
        }}
        famille={famille ? { id: famille.familleId, name: famille.famille.name } : null}
        comptes={comptes}
        recentActivity={recentLogs.map((l) => ({
          id: l.id,
          label: l.label,
          montant: l.montant,
          type: l.type,
          createdAt: l.createdAt,
        }))}
      />
    </DashboardShell>
  );
}
