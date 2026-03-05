"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, LayoutDashboard, AlertTriangle, Settings, TrendingUp, LogOut, History, Target } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/imprévus", icon: AlertTriangle, label: "Imprévus" },
  { href: "/projections", icon: TrendingUp, label: "Projections" },
  { href: "/objectifs", icon: Target, label: "Objectifs" },
  { href: "/historique", icon: History, label: "Historique" },
  { href: "/parametres", icon: Settings, label: "Paramètres" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
            <nav className="px-3 py-4 space-y-0.5">
              {NAV.map(({ href, icon: Icon, label }) => {
                const active = pathname === href;
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
            <div className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full"
              >
                <LogOut size={15} />
                Déconnexion
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
