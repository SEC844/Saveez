"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

async function requireAuthUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user;
}

export type TwoFactorState = {
  error?: string;
  success?: boolean;
  qrCodeDataUrl?: string;
  secret?: string;
  backupCodes?: string[];
} | null;

// ─── Générer un secret TOTP et renvoyer un QR code ───────────────────────────

export async function setup2FAAction(): Promise<TwoFactorState> {
  const user = await requireAuthUser();

  // Générer un nouveau secret
  const secret = authenticator.generateSecret();

  // Construire l'URI TOTP
  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { email: true },
  });
  const otpauth = authenticator.keyuri(dbUser.email, "Saveez", secret);

  // Générer le QR code (data URL PNG)
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

  // Générer des codes de secours
  const backupCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );

  // Sauvegarder en DB (disabled jusqu'à confirmation)
  await prisma.twoFactor.upsert({
    where: { userId: user.id },
    create: { userId: user.id, secret, enabled: false, backupCodes },
    update: { secret, enabled: false, backupCodes },
  });

  return { success: true, qrCodeDataUrl, secret, backupCodes };
}

// ─── Confirmer et activer la 2FA ─────────────────────────────────────────────

export async function confirm2FAAction(
  _prev: TwoFactorState,
  formData: FormData
): Promise<TwoFactorState> {
  const user = await requireAuthUser();
  const code = (formData.get("code") as string)?.replace(/\s/g, "");

  if (!code || code.length !== 6) return { error: "Code à 6 chiffres requis." };

  const tf = await prisma.twoFactor.findUnique({ where: { userId: user.id } });
  if (!tf) return { error: "Aucun secret configuré. Recommencez la configuration." };

  const isValid = authenticator.verify({ token: code, secret: tf.secret });
  if (!isValid) return { error: "Code incorrect. Vérifiez votre application." };

  await prisma.twoFactor.update({
    where: { userId: user.id },
    data: { enabled: true },
  });

  revalidatePath("/parametres");
  return { success: true };
}

// ─── Désactiver la 2FA ───────────────────────────────────────────────────────

export async function disable2FAAction(
  _prev: TwoFactorState,
  formData: FormData
): Promise<TwoFactorState> {
  const user = await requireAuthUser();
  const code = (formData.get("code") as string)?.replace(/\s/g, "");

  if (!code || code.length !== 6) return { error: "Code à 6 chiffres requis pour confirmer." };

  const tf = await prisma.twoFactor.findUnique({ where: { userId: user.id } });
  if (!tf || !tf.enabled) return { error: "La 2FA n'est pas activée." };

  const isValid = authenticator.verify({ token: code, secret: tf.secret });
  if (!isValid) return { error: "Code incorrect." };

  await prisma.twoFactor.delete({ where: { userId: user.id } });

  revalidatePath("/parametres");
  return { success: true };
}

// ─── Vérifier un code TOTP (appelé depuis auth.ts) ───────────────────────────

export async function verifyTOTP(userId: string, code: string): Promise<boolean> {
  const tf = await prisma.twoFactor.findUnique({ where: { userId } });
  if (!tf || !tf.enabled) return true; // pas de 2FA → OK

  const cleaned = code.replace(/\s/g, "");

  // Vérifier code TOTP
  if (authenticator.verify({ token: cleaned, secret: tf.secret })) return true;

  // Vérifier codes de secours
  if (tf.backupCodes.includes(cleaned.toUpperCase())) {
    // Consommer le code de secours
    await prisma.twoFactor.update({
      where: { userId },
      data: { backupCodes: tf.backupCodes.filter((c) => c !== cleaned.toUpperCase()) },
    });
    return true;
  }

  return false;
}

// ─── Checker si un user a la 2FA activée ─────────────────────────────────────

export async function has2FAEnabled(userId: string): Promise<boolean> {
  const tf = await prisma.twoFactor.findUnique({ where: { userId } });
  return tf?.enabled === true;
}
