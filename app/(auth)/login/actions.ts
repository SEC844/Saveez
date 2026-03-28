"use server";

import { signIn } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createChallengeToken, verifyChallengeToken } from "@/lib/2fa-challenge";
import { verifyTOTP } from "@/app/actions/two-factor";

const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_THRESHOLD = 10;

export type LoginState = {
  error?: string;
  needs2fa?: boolean;
  challengeToken?: string;
} | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  // ── Étape 2 : vérification du code TOTP ─────────────────────────────────
  const challengeToken = formData.get("challengeToken") as string | null;
  const totpCode = (formData.get("totpCode") as string | null)?.replace(/\s/g, "");

  if (challengeToken) {
    if (!totpCode || totpCode.length < 6) {
      return {
        error: "Code à 6 chiffres requis.",
        needs2fa: true,
        challengeToken,
      };
    }

    // Vérifier que le challenge token est encore valide
    const payload = verifyChallengeToken(challengeToken);
    if (!payload) {
      return { error: "Session expirée. Recommencez la connexion." };
    }

    // Vérifier le code TOTP (ou code de secours)
    const isValid = await verifyTOTP(payload.userId, totpCode);
    if (!isValid) {
      return {
        error: "Code incorrect. Vérifiez votre application.",
        needs2fa: true,
        challengeToken,
      };
    }

    // Code valide → lancer la session via NextAuth (chemin challengeToken dans authorize)
    try {
      await signIn("credentials", {
        challengeToken,
        totpCode,
        redirectTo: "/",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return {
          error: "Erreur d'authentification. Réessayez.",
          needs2fa: true,
          challengeToken,
        };
      }
      throw error; // NEXT_REDIRECT — laisser propager
    }

    return null;
  }

  // ── Étape 1 : email + mot de passe ──────────────────────────────────────
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Veuillez remplir tous les champs." };
  }

  // Rate limit par IP (mémoire)
  try {
    await checkRateLimit(ip);
  } catch {
    return { error: "Trop de tentatives. Réessayez dans 15 minutes." };
  }

  // Blocage compte par email (DB-backed, survive aux redémarrages)
  const recentFailures = await prisma.loginAttempt.count({
    where: {
      email,
      success: false,
      createdAt: { gte: new Date(Date.now() - LOCKOUT_WINDOW_MS) },
    },
  });
  if (recentFailures >= LOCKOUT_THRESHOLD) {
    return {
      error:
        "Compte temporairement bloqué suite à trop de tentatives. Réessayez dans 15 minutes.",
    };
  }

  // Pré-vérification des identifiants pour détecter si la 2FA est requise
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  if (user) {
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (isValid) {
      // Vérifier si la 2FA est activée
      const tf = await prisma.twoFactor.findUnique({
        where: { userId: user.id },
        select: { enabled: true },
      });
      if (tf?.enabled) {
        // Créer un challenge token signé, valable 5 minutes
        const token = createChallengeToken(user.id);
        return { needs2fa: true, challengeToken: token };
      }
    }
  }

  // Connexion standard (authorize gère le log + la validation finale)
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const causeMsg =
        ((error.cause as { err?: Error })?.err?.message) ?? "";
      if (causeMsg === "ACCOUNT_LOCKED") {
        return {
          error:
            "Compte temporairement bloqué. Réessayez dans 15 minutes.",
        };
      }
      return { error: "Email ou mot de passe incorrect." };
    }
    throw error; // NEXT_REDIRECT
  }

  return null;
}
