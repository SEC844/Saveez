"use server";

import { prisma } from "@/lib/db";
import { requireAuthUser } from "@/lib/authz";
import { revalidatePath } from "next/cache";

export type FamilleState = { error?: string; success?: boolean; token?: string } | null;

// ─── Créer une famille ────────────────────────────────────────────────────────

export async function createFamilleAction(
  _prev: FamilleState,
  formData: FormData
): Promise<FamilleState> {
  const user = await requireAuthUser();

  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 2) return { error: "Le nom de la famille doit faire au moins 2 caractères." };

  // Vérifier que l'utilisateur n'est pas déjà dans une famille
  const existing = await prisma.membreFamille.findFirst({ where: { userId: user.id } });
  if (existing) return { error: "Vous êtes déjà membre d'une famille. Quittez-la d'abord." };

  const famille = await prisma.famille.create({
    data: {
      name,
      membres: {
        create: { userId: user.id, role: "admin" },
      },
    },
  });

  await prisma.actionLog.create({
    data: {
      userId: user.id,
      type: "famille_create",
      label: `Famille créée : « ${name} »`,
    },
  });

  revalidatePath("/famille");
  return { success: true };
}

// ─── Quitter sa famille ───────────────────────────────────────────────────────

export async function leaveFamilleAction(_prev: FamilleState, _formData?: FormData): Promise<FamilleState> {
  const user = await requireAuthUser();

  const membre = await prisma.membreFamille.findFirst({
    where: { userId: user.id },
    include: { famille: { include: { membres: true } } },
  });

  if (!membre) return { error: "Vous n'êtes membre d'aucune famille." };

  const { famille } = membre;
  const admins = famille.membres.filter((m) => m.role === "admin");

  // Le dernier admin ne peut pas quitter
  if (membre.role === "admin" && admins.length === 1 && famille.membres.length > 1) {
    return {
      error:
        "Vous êtes le seul administrateur. Promouvez un autre membre avant de quitter.",
    };
  }

  // Si l'admin est le seul membre, supprimer la famille entière
  if (famille.membres.length === 1) {
    await prisma.famille.delete({ where: { id: famille.id } });
  } else {
    await prisma.membreFamille.delete({
      where: { familleId_userId: { familleId: famille.id, userId: user.id } },
    });
  }

  await prisma.actionLog.create({
    data: {
      userId: user.id,
      type: "famille_leave",
      label: `A quitté la famille « ${famille.name} »`,
    },
  });

  revalidatePath("/famille");
  return { success: true };
}

// ─── Générer une invitation ───────────────────────────────────────────────────

export async function createInvitationAction(
  _prev: FamilleState,
  formData: FormData
): Promise<FamilleState> {
  const user = await requireAuthUser();

  const email = (formData.get("email") as string)?.trim().toLowerCase() || "invitation";

  const membre = await prisma.membreFamille.findFirst({ where: { userId: user.id } });
  if (!membre) return { error: "Vous devez être membre d'une famille pour inviter." };
  if (membre.role !== "admin") return { error: "Seuls les admins de famille peuvent inviter." };

  // Créer l'invitation (expire dans 7 jours)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invitation = await prisma.invitationFamille.create({
    data: {
      familleId: membre.familleId,
      email,
      expiresAt,
    },
  });

  revalidatePath("/famille");
  return { success: true, token: invitation.token };
}

// ─── Accepter une invitation (via token) ─────────────────────────────────────

export async function joinFamilleAction(token: string): Promise<FamilleState> {
  const user = await requireAuthUser();

  const invitation = await prisma.invitationFamille.findUnique({
    where: { token },
    include: { famille: true },
  });

  if (!invitation) return { error: "Lien d'invitation invalide ou expiré." };
  if (invitation.usedAt) return { error: "Ce lien d'invitation a déjà été utilisé." };
  if (invitation.expiresAt < new Date()) return { error: "Ce lien d'invitation a expiré." };

  // Vérifier que l'utilisateur n'est pas déjà dans une famille
  const existing = await prisma.membreFamille.findFirst({ where: { userId: user.id } });
  if (existing) return { error: "Vous êtes déjà membre d'une famille. Quittez-la d'abord." };

  // Vérifier qu'il n'est pas déjà membre de cette famille
  const alreadyMember = await prisma.membreFamille.findUnique({
    where: { familleId_userId: { familleId: invitation.familleId, userId: user.id } },
  });
  if (alreadyMember) return { error: "Vous êtes déjà membre de cette famille." };

  await prisma.$transaction([
    prisma.membreFamille.create({
      data: { familleId: invitation.familleId, userId: user.id, role: "membre" },
    }),
    prisma.invitationFamille.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  await prisma.actionLog.create({
    data: {
      userId: user.id,
      type: "famille_join",
      label: `A rejoint la famille « ${invitation.famille.name} »`,
    },
  });

  revalidatePath("/famille");
  return { success: true };
}

// ─── Promouvoir un membre en admin ───────────────────────────────────────────

export async function promouvoirMembreAction(
  _prev: FamilleState,
  formData: FormData
): Promise<FamilleState> {
  const user = await requireAuthUser();
  const targetUserId = (formData.get("targetUserId") as string)?.trim();

  const actor = await prisma.membreFamille.findFirst({ where: { userId: user.id } });
  if (!actor || actor.role !== "admin") return { error: "Action non autorisée." };

  const target = await prisma.membreFamille.findUnique({
    where: { familleId_userId: { familleId: actor.familleId, userId: targetUserId } },
  });
  if (!target || target.familleId !== actor.familleId) return { error: "Membre introuvable." };

  await prisma.membreFamille.update({
    where: { familleId_userId: { familleId: actor.familleId, userId: targetUserId } },
    data: { role: "admin" },
  });

  revalidatePath("/famille");
  return { success: true };
}

// ─── Exclure un membre ───────────────────────────────────────────────────────

export async function exclureMembreAction(
  _prev: FamilleState,
  formData: FormData
): Promise<FamilleState> {
  const user = await requireAuthUser();
  const targetUserId = (formData.get("targetUserId") as string)?.trim();

  if (targetUserId === user.id) return { error: "Vous ne pouvez pas vous exclure vous-même." };

  const actor = await prisma.membreFamille.findFirst({ where: { userId: user.id } });
  if (!actor || actor.role !== "admin") return { error: "Action non autorisée." };

  const target = await prisma.membreFamille.findUnique({
    where: { familleId_userId: { familleId: actor.familleId, userId: targetUserId } },
  });
  if (!target || target.familleId !== actor.familleId) return { error: "Membre introuvable." };

  await prisma.membreFamille.delete({
    where: { familleId_userId: { familleId: actor.familleId, userId: targetUserId } },
  });

  revalidatePath("/famille");
  return { success: true };
}

// ─── Créer un compte familial ─────────────────────────────────────────────────

export async function createCompteFamilleAction(
  _prev: FamilleState,
  formData: FormData
): Promise<FamilleState> {
  const user = await requireAuthUser();

  const label = (formData.get("label") as string)?.trim();
  const type = (formData.get("type") as string)?.trim() || "epargne_commune";
  const couleur = (formData.get("couleur") as string)?.trim() || "#10B981";

  if (!label || label.length < 2) return { error: "Nom du compte obligatoire." };
  if (!["epargne_commune", "projet", "vacances"].includes(type)) {
    return { error: "Type de compte invalide." };
  }

  const membre = await prisma.membreFamille.findFirst({ where: { userId: user.id } });
  if (!membre) return { error: "Vous devez être membre d'une famille." };

  await prisma.compteFamille.create({
    data: { familleId: membre.familleId, label, type, couleur },
  });

  revalidatePath("/famille");
  return { success: true };
}

// ─── Contribuer à un compte familial ─────────────────────────────────────────

export async function contribuerCompteFamilleAction(
  _prev: FamilleState,
  formData: FormData
): Promise<FamilleState> {
  const user = await requireAuthUser();

  const compteId = (formData.get("compteId") as string)?.trim();
  const montant = parseFloat(formData.get("montant") as string);
  const note = (formData.get("note") as string)?.trim() || null;

  if (!compteId) return { error: "Compte non spécifié." };
  if (isNaN(montant) || montant <= 0) return { error: "Montant invalide." };

  const membre = await prisma.membreFamille.findFirst({ where: { userId: user.id } });
  if (!membre) return { error: "Vous devez être membre d'une famille." };

  const compte = await prisma.compteFamille.findUnique({ where: { id: compteId } });
  if (!compte || compte.familleId !== membre.familleId) {
    return { error: "Compte familial introuvable." };
  }

  await prisma.$transaction([
    prisma.compteFamille.update({
      where: { id: compteId },
      data: { solde: { increment: montant } },
    }),
    prisma.contributionFamille.create({
      data: { compteId, userId: user.id, montant, note },
    }),
  ]);

  await prisma.actionLog.create({
    data: {
      userId: user.id,
      type: "famille_contribution",
      label: `Contribution de ${montant.toLocaleString("fr-FR")} € sur « ${compte.label} »${note ? ` — ${note}` : ""}`,
      montant,
    },
  });

  revalidatePath("/famille");
  return { success: true };
}

// ─── Retrait d'un compte familial ────────────────────────────────────────────

export async function retraitCompteFamilleAction(
  _prev: FamilleState,
  formData: FormData
): Promise<FamilleState> {
  const user = await requireAuthUser();

  const compteId = (formData.get("compteId") as string)?.trim();
  const montant = parseFloat(formData.get("montant") as string);
  const note = (formData.get("note") as string)?.trim() || null;

  if (!compteId) return { error: "Compte non spécifié." };
  if (isNaN(montant) || montant <= 0) return { error: "Montant invalide." };

  const membre = await prisma.membreFamille.findFirst({ where: { userId: user.id } });
  if (!membre || membre.role !== "admin") {
    return { error: "Seuls les admins peuvent effectuer un retrait familial." };
  }

  const compte = await prisma.compteFamille.findUnique({ where: { id: compteId } });
  if (!compte || compte.familleId !== membre.familleId) {
    return { error: "Compte familial introuvable." };
  }
  if (montant > compte.solde) {
    return { error: `Solde insuffisant (${compte.solde.toLocaleString("fr-FR")} € disponibles).` };
  }

  await prisma.$transaction([
    prisma.compteFamille.update({
      where: { id: compteId },
      data: { solde: { decrement: montant } },
    }),
    prisma.contributionFamille.create({
      data: { compteId, userId: user.id, montant: -montant, note },
    }),
  ]);

  await prisma.actionLog.create({
    data: {
      userId: user.id,
      type: "famille_retrait",
      label: `Retrait de ${montant.toLocaleString("fr-FR")} € sur « ${compte.label} »`,
      montant,
    },
  });

  revalidatePath("/famille");
  return { success: true };
}
