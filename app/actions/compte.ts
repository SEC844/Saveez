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

    if (!type || !["vacances", "autre"].includes(type)) {
        return { error: "Type de compte invalide." };
    }
    if (!label || label.length < 2) {
        return { error: "Veuillez saisir un nom pour ce compte." };
    }
    if (soldeInitial < 0) {
        return { error: "Le solde initial ne peut pas être négatif." };
    }

    await prisma.compte.create({
        data: { userId, type, label, couleur, solde: soldeInitial, actif: true },
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

    // Détache les objectifs liés (compteId → null via onDelete: SetNull en cascade)
    await prisma.compte.delete({ where: { id: compteId } });

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

    // Si on désactive le compte, détacher les objectifs liés
    if (!nouvelEtat) {
        await prisma.objectif.updateMany({
            where: { compteId, userId },
            data: { compteId: null, categorie: "standard" },
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
    if (!compte || compte.userId !== userId) return { error: "Introuvable." };

    if (montant > compte.solde) {
        return { error: `Solde insuffisant. Disponible : ${compte.solde.toLocaleString("fr-FR")} €` };
    }

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

    if (!compteSource || compteSource.userId !== userId) return { error: "Compte source introuvable." };
    if (!compteDestination || compteDestination.userId !== userId) return { error: "Compte destination introuvable." };

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
    ]);

    revalidatePath("/comptes");
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
        take: 50, // Limiter à 50 transactions
    });

    return transactions;
}
