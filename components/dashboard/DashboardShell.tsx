import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

/**
 * Shell serveur — lit les permissions depuis le JWT au rendu,
 * ce qui évite le flash "pas d'onglet Admin" côté client.
 * Aussi fetch name + avatarUrl pour le mini-profil sidebar.
 */
export default async function DashboardShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const perms = session?.user?.permissions ?? [];
  const canAccessAdmin = perms.includes("admin.access");

  let userName: string | null = null;
  let userAvatarUrl: string | null = null;
  let userEmail = "";

  if (session?.user?.id) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, avatarUrl: true, email: true },
    });
    userName = u?.name ?? null;
    userAvatarUrl = u?.avatarUrl ?? null;
    userEmail = u?.email ?? "";
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 overflow-hidden">
      <Sidebar
        canAccessAdmin={canAccessAdmin}
        userName={userName}
        userEmail={userEmail}
        userAvatarUrl={userAvatarUrl}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileNav
          canAccessAdmin={canAccessAdmin}
          userName={userName}
          userEmail={userEmail}
          userAvatarUrl={userAvatarUrl}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
