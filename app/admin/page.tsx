import DashboardShell from "@/components/dashboard/DashboardShell";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/db";
import AdminPanel from "./AdminPanel";
import SecurityPanel from "./SecurityPanel";
import AdminTabs from "./AdminTabs";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_THRESHOLD = 10;

export default async function AdminPage() {
  const actor = await requirePermission("admin.access");

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since15min = new Date(Date.now() - LOCKOUT_WINDOW_MS);

  const [users, roles, recentAttempts, failGroups, statsToday] =
    await Promise.all([
      prisma.user.findMany({
        include: { role: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.role.findMany({
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      }),
      // 50 dernières tentatives (24h)
      prisma.loginAttempt.findMany({
        where: { createdAt: { gte: since24h } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      // Grouper les échecs des 15 dernières minutes par email
      prisma.loginAttempt.groupBy({
        by: ["email"],
        where: { success: false, createdAt: { gte: since15min } },
        _count: { _all: true },
        orderBy: { _count: { email: "desc" } },
      }),
      // Stats du jour
      prisma.loginAttempt.aggregate({
        where: { createdAt: { gte: since24h } },
        _count: { _all: true },
      }),
    ]);

  // Stats succès / échec
  const [successCount] = await Promise.all([
    prisma.loginAttempt.count({
      where: { createdAt: { gte: since24h }, success: true },
    }),
  ]);

  const totalToday = statsToday._count._all;
  const failedToday = totalToday - successCount;

  // Lockout statuses
  const lockoutStatuses = failGroups.map((g) => ({
    email: g.email,
    failCount: g._count._all,
    isLocked: g._count._all >= LOCKOUT_THRESHOLD,
  }));

  return (
    <DashboardShell>
      <div className="space-y-6 p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Shield size={16} className="text-zinc-600 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Administration
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Gérez les utilisateurs, rôles, permissions et sécurité
            </p>
          </div>
        </div>

        <AdminTabs
          usersTab={
            <AdminPanel
              users={users}
              roles={roles}
              currentUserId={actor.id}
            />
          }
          securityTab={
            <SecurityPanel
              recentAttempts={recentAttempts}
              lockoutStatuses={lockoutStatuses}
              statsToday={{
                total: totalToday,
                success: successCount,
                failed: failedToday,
              }}
            />
          }
        />
      </div>
    </DashboardShell>
  );
}
