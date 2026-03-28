import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ComptesClient from "./ComptesClient";

export const dynamic = "force-dynamic";

export default async function ComptesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Récupérer l'utilisateur (épargne actuelle + famille éventuelle)
  const [user, membre] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { epargneActuelle: true },
    }),
    prisma.membreFamille.findFirst({
      where: { userId },
      include: { famille: { select: { id: true, name: true } } },
    }),
  ]);

  const familleId = membre?.familleId ?? null;

  // Comptes personnels (vacances, autre)
  const comptesPerso = await prisma.compte.findMany({
    where: { userId, type: { not: "famille" } },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });

  // Comptes familiaux (partagés, accessibles à tous les membres de la famille)
  const comptesFamille = familleId
    ? await prisma.compte.findMany({
        where: { familleId },
        orderBy: [{ createdAt: "asc" }],
        include: { user: { select: { name: true, email: true } } },
      })
    : [];

  // Comptes indépendants — epargneActuelle = solde du compte principal (pas une différence)
  const soldeComptesInactifs = comptesPerso.filter((c) => !c.actif).reduce((s, c) => s + c.solde, 0);
  const epargneStandard = user.epargneActuelle;

  const allComptesActifs = [
    ...comptesPerso.filter((c) => c.actif),
    ...comptesFamille.filter((c) => c.actif),
  ];

  return (
    <DashboardShell>
      <ComptesClient
        comptes={comptesPerso}
        comptesFamille={comptesFamille as any}
        epargneStandard={epargneStandard}
        soldeComptesInactifs={soldeComptesInactifs}
        familleId={familleId}
        familleName={membre?.famille.name ?? null}
        currentUserId={userId}
        allComptesActifs={allComptesActifs as any}
      />
    </DashboardShell>
  );
}
