import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  getPermissionsFromRole,
  hasPermission,
  type UserWithRole,
} from "@/lib/rbac";
import { assignDefaultRoleIfMissing } from "@/lib/rbac-server";
import { redirect } from "next/navigation";

/**
 * Vérifie l'authentification et retourne l'utilisateur avec son rôle.
 *
 * ⚡ Performance : les permissions sont TOUJOURS lues depuis la DB (pas le JWT),
 * ce qui garantit leur fraîcheur même après un changement de rôle admin.
 * Le JWT ne sert qu'aux hints UI côté client (sidebar).
 */
export async function requireAuthUser(): Promise<UserWithRole> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      role: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
  });

  if (!user) redirect("/login?error=session");

  // Assignation paresseuse du rôle standard pour les comptes sans rôle (migration)
  if (!user.role) {
    const assignedRole = await assignDefaultRoleIfMissing(user.id, user.roleId);
    if (assignedRole) {
      (user as UserWithRole).role = assignedRole;
    }
  }

  return user as UserWithRole;
}

/**
 * Vérifie qu'un utilisateur possède la permission requise.
 * Redirige vers "/" en cas de permission insuffisante.
 */
export async function requirePermission(permission: string): Promise<UserWithRole> {
  const user = await requireAuthUser();
  const permissions = getPermissionsFromRole(user.role);

  if (!hasPermission(permissions, permission)) {
    redirect("/");
  }

  return user;
}
