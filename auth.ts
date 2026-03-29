import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getPermissionsFromRole } from "@/lib/rbac";
import { ensureSystemRoles } from "@/lib/rbac-server";
import { verifyChallengeToken } from "@/lib/2fa-challenge";
import { verifyTOTP } from "@/app/actions/two-factor";

const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_THRESHOLD = 10; // tentatives échouées avant blocage

async function logAttempt(
  email: string,
  ip: string,
  success: boolean,
  userAgent?: string | null,
  with2FA = false
) {
  try {
    await prisma.loginAttempt.create({
      data: { email, ip, success, userAgent: userAgent ?? undefined, with2FA },
    });
  } catch {
    // Ne pas bloquer l'auth si le logging échoue
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        totpCode: { label: "Code 2FA", type: "text" },
        challengeToken: { label: "Challenge Token", type: "text" },
      },
      authorize: async (credentials, request) => {
        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request?.headers?.get("x-real-ip") ??
          "unknown";
        const userAgent = request?.headers?.get("user-agent");

        await ensureSystemRoles();

        // ── Chemin 2FA — étape 2 (challenge token) ──────────────────────────
        if (credentials?.challengeToken) {
          const payload = verifyChallengeToken(
            credentials.challengeToken as string
          );
          if (!payload) return null;

          const totpCode = (credentials.totpCode as string) ?? "";
          const isValid = await verifyTOTP(payload.userId, totpCode);

          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: {
              role: { select: { id: true, name: true, permissions: true } },
            },
          });
          if (!user) return null;

          await logAttempt(user.email, ip, isValid, userAgent, true);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role?.name ?? "standard",
            permissions: getPermissionsFromRole(user.role),
          };
        }

        // ── Chemin standard — email + mot de passe ───────────────────────────
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email as string;

        // Vérification du blocage compte (DB-backed, par email)
        const recentFailures = await prisma.loginAttempt.count({
          where: {
            email,
            success: false,
            createdAt: { gte: new Date(Date.now() - LOCKOUT_WINDOW_MS) },
          },
        });
        if (recentFailures >= LOCKOUT_THRESHOLD) {
          throw new Error("ACCOUNT_LOCKED");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            role: { select: { id: true, name: true, permissions: true } },
          },
        });

        if (!user) {
          await logAttempt(email, ip, false, userAgent);
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          await logAttempt(email, ip, false, userAgent);
          return null;
        }

        // Attribution du rôle standard aux anciens comptes sans rôle
        let role = user.role;
        if (!role) {
          const standardRole = await prisma.role.findUnique({
            where: { name: "standard" },
          });
          if (standardRole) {
            await prisma.user.update({
              where: { id: user.id },
              data: { roleId: standardRole.id },
            });
            role = standardRole;
          }
        }

        await logAttempt(email, ip, true, userAgent);

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: role?.name ?? "standard",
          permissions: getPermissionsFromRole(role),
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24h
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
        path: "/",
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "standard";
        token.permissions =
          (user as { permissions?: string[] }).permissions ?? [];
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      session.user.role = (token.role as string) ?? "standard";
      session.user.permissions = Array.isArray(token.permissions)
        ? (token.permissions as string[])
        : [];
      return session;
    },
  },
});
