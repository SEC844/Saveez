"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getAuthUserId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Non authentifié");
    return session.user.id;
}

export type CompteState = { error?: string; success?: boolean } | null;

// ─── Créer un compte spécial ──────────────────────────────────────────────────

export async function createCompteAction(
    _prev: CompteState,
    formData: FormData
): Promise<CompteState> {
    const userId = await getAuthUserId();

    const type = (formData.get("type") as string)?.trim();
    const label = (formData.get("label") as string)?.trim();
    const couleur = (formData.get("couleur") as string)?.trim() || "#8B5CF6";
    const soldeInitial = parseFloat(formData.get("soldeInitial") as string) || 0;
    const familleId = (formData.get("familleId") as string)?.trim() || null;

    if (!type || !["vacances", "autre", "famille"].includes(type)) {
        return { error: "Type de compte invalide." };
    }

    // Vérifier que l'utilisateur appartient bien à cette famille
    if (type === "famille") {
        if (!familleId) return { error: "Famille non spécifiée." };
        const membre = await prisma.membreFamille.findUnique({
            where: { familleId_userId: { familleId, userId } },
        });
        if (!membre) return { error: "Vous n'appartenez pas à cette famille." };
    }
    if (!label || label.length < 2) {
        return { error: "Veuillez saisir un nom pour ce compte." };
    }
    if (soldeInitial < 0) {
        return { error: "Le solde initial ne peut pas être négatif." };
    }

    // Chaque compte est indépendant — le solde initial appartient à ce compte uniquement.
    // On NE touche PAS epargneActuelle (compte principal).
    await prisma.compte.create({
        data: {
            userId, type, label, couleur, solde: soldeInitial, actif: true,
            ...(familleId ? { familleId } : {}),
        },
    });

    revalidatePath("/parametres");
    revalidatePath("/objectifs");
    revalidatePath("/comptes");
    revalidatePath("/");
    return { success: true };
}

// ─── Supprimer un compte spécial ─────────────────────────────────────────────

export async function deleteCompteAction(compteId: string): Promise<CompteState> {
    const userId = await getAuthUserId();

    const compte = await prisma.compte.findUnique({ where: { id: compteId } });
    if (!compte || compte.userId !== userId) return { error: "Introuvable." };

    // Si le compte a un solde non nul, empêcher la suppression (sécurité)
    if (compte.solde !== 0) {
        return {
            error: `Ce compte contient encore ${Math.abs(compte.solde).toLocaleString("fr-FR")} €. Transférez le solde avant de supprimer.`
        };
    }

    // Supprimer explicitement les objectifs liés avant la suppression du compte
    // (la contrainte onDelete: SetNull met seulement compteId à null — on veut une vraie suppression)
    await prisma.$transaction([
        prisma.objectif.deleteMany({ where: { compteId, userId } }),
        prisma.compte.delete({ where: { id: compteId } }),
    ]);

    revalidatePath("/parametres");
    revalidatePath("/objectifs");
    revalidatePath("/comptes");
    revalidatePath("/");
    return { success: true };
}

// ─── Activer / désactiver un compte ──────────────────────────────────────────

export async function toggleCompteAction(compteId: string): Promise<CompteState> {
    const userId = await getAuthUserId();

    const compte = await prisma.compte.findUnique({ where: { id: compteId } });
    if (!compte || compte.userId !== userId) return { error: "Introuvable." };

    const nouvelEtat = !compte.actif;

    if (!nouvelEtat) {
        // Désactivation : on clôture les objectifs liés en leur mettant une dateFin = maintenant
        // (ils restent en base pour l'historique mais ne sont plus actifs)
        const maintenant = new Date();
        await prisma.objectif.updateMany({
            where: { compteId, userId },
            data: { dateFin: maintenant },
        });
    } else {
        // Réactivation : rouvrir les objectifs liés dont dateFin <= maintenant
        // (on remet dateFin à null pour les rendre indéfinis)
        await prisma.objectif.updateMany({
            where: { compteId, userId, dateFin: { not: null } },
            data: { dateFin: null },
        });
    }

    await prisma.compte.update({
        where: { id: compteId },
        data: { actif: nouvelEtat },
    });

    revalidatePath("/parametres");
    revalidatePath("/objectifs");
    revalidatePath("/comptes");
    revalidatePath("/");
    return { success: true };
}

// ─── Effectuer un retrait d'un compte ────────────────────────────────────────

export async function retraitCompteAction(
    _prev: CompteState,
    formData: FormData
): Promise<CompteState> {
    const userId = await getAuthUserId();

    const compteId = (formData.get("compteId") as string)?.trim();
    const montant = parseFloat(formData.get("montant") as string);
    const note = (formData.get("note") as string)?.trim() || null;

    if (!compteId) return { error: "Compte non spécifié." };
    if (isNaN(montant) || montant <= 0) return { error: "Montant invalide." };

    const compte = await prisma.compte.findUnique({ where: { id: compteId } });
    if (!compte) return { error: "Introuvable." };

    // Vérification d'accès : propriétaire OU membre de la famille propriétaire
    if (compte.userId !== userId) {
        if (!compte.familleId) return { error: "Accès non autorisé." };
        const membre = await prisma.membreFamille.findUnique({
            where: { familleId_userId: { familleId: compte.familleId, userId } },
        });
        if (!membre) return { error: "Accès non autorisé." };
    }

    if (montant > compte.solde) {
        return { error: `Solde insuffisant. Disponible : ${compte.solde.toLocaleString("fr-FR")} €` };
    }

    // Comptes indépendants — on ne touche PAS epargneActuelle (compte principal)
    await prisma.$transaction([
        prisma.compte.update({
            where: { id: compteId },
            data: { solde: { decrement: montant } },
        }),
        prisma.transaction.create({
            data: {
                userId,
                type: "retrait",
                montant,
                note,
                compteSourceId: compteId,
            },
        }),
        prisma.actionLog.create({
            data: {
                userId,
                type: "retrait_compte",
                label: `Retrait de ${montant.toLocaleString("fr-FR")} € sur « ${compte.label} »${note ? ` — ${note}` : ""}`,
                montant,
            },
        }),
    ]);

    revalidatePath("/comptes");
    revalidatePath("/");
    return { success: true };
}

// ─── Effectuer un transfert entre comptes ────────────────────────────────────

export async function transfertCompteAction(
    _prev: CompteState,
    formData: FormData
): Promise<CompteState> {
    const userId = await getAuthUserId();

    const compteSourceId = (formData.get("compteSourceId") as string)?.trim();
    const compteDestinationId = (formData.get("compteDestinationId") as string)?.trim();
    const montant = parseFloat(formData.get("montant") as string);
    const note = (formData.get("note") as string)?.trim() || null;

    if (!compteSourceId || !compteDestinationId) return { error: "Comptes non spécifiés." };
    if (compteSourceId === compteDestinationId) return { error: "Les comptes doivent être différents." };
    if (isNaN(montant) || montant <= 0) return { error: "Montant invalide." };

    const [compteSource, compteDestination] = await Promise.all([
        prisma.compte.findUnique({ where: { id: compteSourceId } }),
        prisma.compte.findUnique({ where: { id: compteDestinationId } }),
    ]);

    if (!compteSource) return { error: "Compte source introuvable." };
    if (!compteDestination) return { error: "Compte destination introuvable." };

    // Helper : l'utilisateur doit posséder le compte ou être membre de sa famille
    async function canAccess(c: { userId: string; familleId: string | null }): Promise<boolean> {
        if (c.userId === userId) return true;
        if (!c.familleId) return false;
        const m = await prisma.membreFamille.findUnique({
            where: { familleId_userId: { familleId: c.familleId, userId } },
        });
        return !!m;
    }

    const [okSrc, okDst] = await Promise.all([canAccess(compteSource), canAccess(compteDestination)]);
    if (!okSrc) return { error: "Accès non autorisé sur le compte source." };
    if (!okDst) return { error: "Accès non autorisé sur le compte destination." };

    if (montant > compteSource.solde) {
        return { error: `Solde insuffisant. Disponible : ${compteSource.solde.toLocaleString("fr-FR")} €` };
    }

    await prisma.$transaction([
        prisma.compte.update({
            where: { id: compteSourceId },
            data: { solde: { decrement: montant } },
        }),
        prisma.compte.update({
            where: { id: compteDestinationId },
            data: { solde: { increment: montant } },
        }),
        prisma.transaction.create({
            data: {
                userId,
                type: "transfert",
                montant,
                note,
                compteSourceId,
                compteDestinationId,
            },
        }),
        prisma.actionLog.create({
            data: {
                userId,
                type: "transfert_compte",
                label: `Transfert de ${montant.toLocaleString("fr-FR")} € : « ${compteSource.label} » → « ${compteDestination.label} »${note ? ` — ${note}` : ""}`,
                montant,
            },
        }),
    ]);

    revalidatePath("/comptes");
    revalidatePath("/");
    return { success: true };
}

// ─── Modifier le nom/couleur d'un compte ─────────────────────────────────────

export async function updateCompteAction(
    _prev: CompteState,
    formData: FormData
): Promise<CompteState> {
    const userId = await getAuthUserId();

    const compteId = (formData.get("compteId") as string)?.trim();
    const label = (formData.get("label") as string)?.trim();
    const couleur = (formData.get("couleur") as string)?.trim() || "#8B5CF6";

    if (!compteId) return { error: "Compte non spécifié." };
    if (!label || label.length < 2) return { error: "Veuillez saisir un nom pour ce compte." };

    const compte = await prisma.compte.findUnique({ where: { id: compteId } });
    if (!compte || compte.userId !== userId) return { error: "Introuvable." };

    await prisma.compte.update({
        where: { id: compteId },
        data: { label, couleur },
    });

    revalidatePath("/comptes");
    revalidatePath("/objectifs");
    revalidatePath("/");
    return { success: true };
}

// ─── Récupérer l'historique des transactions d'un compte ─────────────────────

export async function getTransactionsCompte(compteId: string) {
    const userId = await getAuthUserId();

    const compte = await prisma.compte.findUnique({ where: { id: compteId } });
    if (!compte || compte.userId !== userId) return [];

    const transactions = await prisma.transaction.findMany({
        where: {
            userId,
            OR: [
                { compteSourceId: compteId },
                { compteDestinationId: compteId },
            ],
        },
        include: {
            compteSource: { select: { label: true } },
            compteDestination: { select: { label: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    // Ajouter compteSourceId explicitement (déjà dans transaction)
    return transactions;
}
