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

  // Récupérer uniquement les comptes spéciaux (vacances, autre)
  // Standard = User.epargneActuelle, Imprévus = table Imprevu
  const comptes = await prisma.compte.findMany({
    where: { userId },
    orderBy: [
      { type: "asc" },
      { createdAt: "asc" },
    ],
  });

  // Récupérer User.epargneActuelle (épargne "standard")
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { epargneActuelle: true },
  });

  // Calculer le total des comptes inactifs avec solde
  const soldeComptesInactifs = comptes
    .filter((c) => !c.actif && c.solde !== 0)
    .reduce((sum, c) => sum + c.solde, 0);

  return (
    <DashboardShell>
      <ComptesClient
        comptes={comptes}
        epargneStandard={user.epargneActuelle}
        soldeComptesInactifs={soldeComptesInactifs}
      />
    </DashboardShell>
  );
}
