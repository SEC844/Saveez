import crypto from "crypto";

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getSecret(): string {
  return process.env.NEXTAUTH_SECRET ?? "fallback-dev-only";
}

/**
 * Crée un token signé HMAC (userId:expiresAt:hmac) encodé en base64url.
 * Valable 5 minutes — utilisé pour la 2e étape du login 2FA.
 */
export function createChallengeToken(userId: string): string {
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;
  const payload = `${userId}:${expiresAt}`;
  const hmac = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

/**
 * Vérifie un challenge token. Retourne { userId } si valide, null sinon.
 */
export function verifyChallengeToken(token: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    // Format: userId:expiresAt:hmac  (userId = cuid, pas de ":")
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;
    const [userId, expiresAtStr, hmac] = parts;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return null;

    const payload = `${userId}:${expiresAt}`;
    const expected = crypto
      .createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");

    // Comparaison en temps constant pour éviter les timing attacks
    const hmacBuf = Buffer.from(hmac);
    const expectedBuf = Buffer.from(expected);
    if (hmacBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(hmacBuf, expectedBuf)) return null;

    return { userId };
  } catch {
    return null;
  }
}
