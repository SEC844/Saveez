import DashboardShell from "@/components/dashboard/DashboardShell";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/db";
import AdminPanel from "./AdminPanel";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requirePermission("admin.access");

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      include: {
        role: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
  ]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Shield size={16} className="text-zinc-600 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Administration</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Gérez les utilisateurs, rôles et permissions</p>
          </div>
        </div>

        <AdminPanel users={users} roles={roles} />
      </div>
    </DashboardShell>
  );
}
