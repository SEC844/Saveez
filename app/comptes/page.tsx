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

  // Récupérer tous les comptes de l'utilisateur
  const comptes = await prisma.compte.findMany({
    where: { userId },
    orderBy: [
      { type: "asc" }, // Standard → Imprévus → Vacances → Autre
      { createdAt: "asc" },
    ],
  });

  // Récupérer le solde total (User.epargneActuelle)
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { epargneActuelle: true },
  });

  // Calculer le total des soldes de comptes (pour vérification)
  const totalSoldesComptes = comptes.reduce((sum, c) => sum + c.solde, 0);

  return (
    <DashboardShell>
      <ComptesClient
        comptes={comptes}
        soldeTotal={user.epargneActuelle}
        totalSoldesComptes={totalSoldesComptes}
      />
    </DashboardShell>
  );
}
