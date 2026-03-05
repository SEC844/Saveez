"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  AlertTriangle,
  Settings,
  TrendingUp,
  LogOut,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/imprévus", icon: AlertTriangle, label: "Imprévus" },
  { href: "/projections", icon: TrendingUp, label: "Projections" },
  { href: "/parametres", icon: Settings, label: "Paramètres" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800 h-screen sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-zinc-100 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-base">
          💰
        </div>
        <span className="font-semibold text-zinc-900 dark:text-white tracking-tight">
          Épargne
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
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
      <div className="px-3 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full"
        >
          <LogOut size={15} />
          <span>Déconnexion</span>
        </button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
