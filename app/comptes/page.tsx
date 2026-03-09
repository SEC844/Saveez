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

  // Récupérer User.epargneActuelle (total de toute l'épargne)
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { epargneActuelle: true },
  });

  // Calculer les soldes
  const totalComptesActifs = comptes.filter(c => c.actif).reduce((sum, c) => sum + c.solde, 0);
  const soldeComptesInactifs = comptes.filter(c => !c.actif).reduce((sum, c) => sum + c.solde, 0);
  
  // Épargne standard = Total - (comptes actifs + comptes inactifs)
  const epargneStandard = user.epargneActuelle - totalComptesActifs - soldeComptesInactifs;

  return (
    <DashboardShell>
      <ComptesClient
        comptes={comptes}
        epargneStandard={epargneStandard}
        soldeComptesInactifs={soldeComptesInactifs}
      />
    </DashboardShell>
  );
}
