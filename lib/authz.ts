import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ensureUserRolesAssigned, getPermissionsFromRole, hasPermission, type UserWithRole } from "@/lib/rbac";
import { redirect } from "next/navigation";

export async function requireAuthUser(): Promise<UserWithRole> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await ensureUserRolesAssigned();

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
  return user as UserWithRole;
}

export async function requirePermission(permission: string): Promise<UserWithRole> {
  const user = await requireAuthUser();
  const permissions = getPermissionsFromRole(user.role);

  if (!hasPermission(permissions, permission)) {
    redirect("/");
  }

  return user;
}
