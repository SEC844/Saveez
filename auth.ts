import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { ensureUserRolesAssigned, getPermissionsFromRole } from "@/lib/rbac";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // Required for Docker / proxied environments
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        await ensureUserRolesAssigned();

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            role: {
              select: {
                name: true,
                permissions: true,
              },
            },
          },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role?.name ?? "standard",
          permissions: getPermissionsFromRole(user.role),
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        // Use Secure flag only when the app is served over HTTPS.
        // On HTTP (e.g. local Unraid without TLS), Secure cookies are
        // rejected by browsers and the session can never be established.
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
        token.permissions = (user as { permissions?: string[] }).permissions ?? [];
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
