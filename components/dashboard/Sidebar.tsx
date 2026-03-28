"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  AlertTriangle,
  Settings,
  TrendingUp,
  LogOut,
  History,
  Target,
  Wallet,
  User,
  Shield,
  Users,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { version } from "@/package.json";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/comptes", icon: Wallet, label: "Comptes" },
  { href: "/imprevus", icon: AlertTriangle, label: "Imprévus" },
  { href: "/projections", icon: TrendingUp, label: "Projections" },
  { href: "/objectifs", icon: Target, label: "Objectifs" },
  { href: "/famille", icon: Users, label: "Famille" },
  { href: "/historique", icon: History, label: "Historique" },
  { href: "/profil", icon: User, label: "Profil" },
  { href: "/parametres", icon: Settings, label: "Paramètres" },
];

// ─── Avatar mini ──────────────────────────────────────────────────────────────

function MiniAvatar({ name, email, avatarUrl }: { name?: string | null; email: string; avatarUrl?: string | null }) {
  const colors = ["#EF4444","#F97316","#EAB308","#22C55E","#06B6D4","#8B5CF6","#EC4899","#14B8A6"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];
  const label = (name ?? email)[0]?.toUpperCase() ?? "?";

  if (avatarUrl) {
    return (
      <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
        <Image src={avatarUrl} alt={label} fill className="object-cover" unoptimized />
      </div>
    );
  }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white select-none"
      style={{ backgroundColor: color }}
    >
      {label}
    </div>
  );
}

interface SidebarProps {
  canAccessAdmin: boolean;
  userName?: string | null;
  userEmail?: string;
  userAvatarUrl?: string | null;
}

export default function Sidebar({ canAccessAdmin, userName, userEmail = "", userAvatarUrl }: SidebarProps) {
  const pathname = usePathname();

  const navItems = canAccessAdmin
    ? [...NAV, { href: "/admin", icon: Shield, label: "Administration" }]
    : NAV;

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800 h-screen sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-zinc-100 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-base">
          💰
        </div>
        <span className="font-semibold text-zinc-900 dark:text-white tracking-tight">
          Saveez
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group",
                active
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                  transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                />
              )}
              <Icon size={16} className="relative z-10 flex-shrink-0" />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
        {/* Mini profil */}
        <Link
          href="/profil"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
        >
          <MiniAvatar name={userName} email={userEmail} avatarUrl={userAvatarUrl} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-900 dark:text-white truncate leading-tight">
              {userName ?? userEmail}
            </p>
            {userName && (
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-tight">{userEmail}</p>
            )}
          </div>
        </Link>

        <div className="flex items-center justify-between">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut size={15} />
            <span>Déconnexion</span>
          </button>
          <ThemeToggle />
        </div>
        <div className="px-3 pb-1">
          <span className="text-[10px] text-zinc-300 dark:text-zinc-600 font-mono select-none">
            v{version}
          </span>
        </div>
      </div>
    </aside>
  );
}
