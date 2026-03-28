import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;

  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(dbUser.email, "Saveez", secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

  const backupCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );

  await prisma.twoFactor.upsert({
    where: { userId },
    create: { userId, secret, enabled: false, backupCodes },
    update: { secret, enabled: false, backupCodes },
  });

  return NextResponse.json({ qrCodeDataUrl, backupCodes });
}
