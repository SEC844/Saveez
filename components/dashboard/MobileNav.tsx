"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Menu, LayoutDashboard, AlertTriangle, Settings, TrendingUp,
  LogOut, History, Target, Wallet, Shield, Users,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/comptes", icon: Wallet, label: "Comptes" },
  { href: "/imprevus", icon: AlertTriangle, label: "Imprévus" },
  { href: "/projections", icon: TrendingUp, label: "Projections" },
  { href: "/objectifs", icon: Target, label: "Objectifs" },
  { href: "/famille", icon: Users, label: "Famille" },
  { href: "/historique", icon: History, label: "Historique" },
];

function MiniAvatar({ name, email, avatarUrl, size = 32 }: { name?: string | null; email: string; avatarUrl?: string | null; size?: number }) {
  const colors = ["#EF4444","#F97316","#EAB308","#22C55E","#06B6D4","#8B5CF6","#EC4899","#14B8A6"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];
  const label = (name ?? email)[0]?.toUpperCase() ?? "?";
  if (avatarUrl) {
    return (
      <div className="relative rounded-full overflow-hidden shrink-0" style={{ width: size, height: size }}>
        <Image src={avatarUrl} alt={label} fill className="object-cover" unoptimized />
      </div>
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white select-none"
      style={{ width: size, height: size, backgroundColor: color }}
    >
      {label}
    </div>
  );
}

interface MobileNavProps {
  canAccessAdmin: boolean;
  userName?: string | null;
  userEmail?: string;
  userAvatarUrl?: string | null;
}

export default function MobileNav({ canAccessAdmin, userName, userEmail = "", userAvatarUrl }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const navItems = canAccessAdmin
    ? [...NAV, { href: "/admin", icon: Shield, label: "Administration" }]
    : NAV;

  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center text-sm">💰</div>
        <span className="font-semibold text-sm text-zinc-900 dark:text-white">Saveez</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Menu size={18} className="text-zinc-600 dark:text-zinc-400" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-base">💰</div>
              <span className="font-semibold text-zinc-900 dark:text-white">Saveez</span>
            </div>
            <nav className="px-3 py-4 space-y-0.5 overflow-y-auto max-h-[calc(100vh-200px)]">
              {navItems.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      active
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-100 dark:border-zinc-800">
              {/* Mini profil mobile */}
              <Link
                href="/profil"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-6 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800"
              >
                <MiniAvatar name={userName} email={userEmail} avatarUrl={userAvatarUrl} size={28} />
                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                  {userName ?? userEmail}
                </p>
              </Link>
              <div className="px-3 py-3 flex items-center gap-1">
                <Link
                  href="/parametres"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-1"
                >
                  <Settings size={15} />
                  Paramètres
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut size={15} />
                  Déconnexion
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
