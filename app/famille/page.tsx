export const dynamic = "force-dynamic";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAuthUser } from "@/lib/authz";
import { prisma } from "@/lib/db";
import FamilleClient from "./FamilleClient";

export default async function FamillePage() {
  const user = await requireAuthUser();

  const membreRaw = await prisma.membreFamille.findFirst({
    where: { userId: user.id },
    include: {
      famille: {
        include: {
          membres: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
          // Comptes familiaux partagés (modèle Compte avec familleId)
          comptesShared: {
            where: { actif: true },
            orderBy: { createdAt: "asc" },
            include: {
              transactionsSource: {
                orderBy: { createdAt: "desc" },
                take: 15,
                include: {
                  user: { select: { id: true, name: true, email: true } },
                  compteDestination: { select: { label: true } },
                },
              },
              transactionsDestination: {
                orderBy: { createdAt: "desc" },
                take: 15,
                include: {
                  user: { select: { id: true, name: true, email: true } },
                  compteSource: { select: { label: true } },
                },
              },
            },
          },
          invitations: {
            where: { usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  if (!membreRaw) {
    return (
      <DashboardShell>
        <FamilleClient currentUserId={user.id} famille={null} myRole={null} />
      </DashboardShell>
    );
  }

  const { famille } = membreRaw;

  // Construire les transactions de chaque compte familial
  const comptes = famille.comptesShared.map((c) => {
    // Transactions sortantes (retrait/transfert depuis ce compte)
    const txSource = c.transactionsSource.map((t) => ({
      id: `out-${t.id}`,
      type: t.type,
      montant: -Math.abs(t.montant),
      note: t.note,
      createdAt: t.createdAt,
      userName: t.user?.name ?? t.user?.email ?? "?",
      isMe: t.userId === user.id,
      detail: t.compteDestination ? `→ ${t.compteDestination.label}` : null,
    }));
    // Transactions entrantes (transfert vers ce compte)
    const txDest = c.transactionsDestination.map((t) => ({
      id: `in-${t.id}`,
      type: t.type,
      montant: Math.abs(t.montant),
      note: t.note,
      createdAt: t.createdAt,
      userName: t.user?.name ?? t.user?.email ?? "?",
      isMe: t.userId === user.id,
      detail: t.compteSource ? `← ${t.compteSource.label}` : null,
    }));
    const allTx = [...txSource, ...txDest]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      id: c.id,
      label: c.label,
      type: c.type,
      solde: c.solde,
      couleur: c.couleur,
      transactions: allTx,
    };
  });

  return (
    <DashboardShell>
      <FamilleClient
        currentUserId={user.id}
        myRole={membreRaw.role as "admin" | "membre"}
        famille={{
          id: famille.id,
          name: famille.name,
          membres: famille.membres.map((m) => ({
            userId: m.userId,
            role: m.role,
            joinedAt: m.joinedAt,
            name: m.user.name,
            email: m.user.email,
            avatarUrl: m.user.avatarUrl,
          })),
          comptes,
          invitations: famille.invitations.map((inv) => ({
            id: inv.id,
            email: inv.email,
            token: inv.token,
            expiresAt: inv.expiresAt,
          })),
        }}
      />
    </DashboardShell>
  );
}
