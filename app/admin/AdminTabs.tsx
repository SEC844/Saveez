"use client";

import { useState, type ReactNode } from "react";
import { Lock, Settings, Users } from "lucide-react";

interface AdminTabsProps {
  usersTab: ReactNode;
  securityTab: ReactNode;
  settingsTab: ReactNode;
}

const tabs = [
  { id: "users", label: "Utilisateurs & Rôles", icon: Users },
  { id: "security", label: "Sécurité", icon: Lock },
  { id: "settings", label: "Paramètres", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function AdminTabs({ usersTab, securityTab, settingsTab }: AdminTabsProps) {
  const [active, setActive] = useState<TabId>("users");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 w-fit mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`inline-flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-medium transition-all duration-150 ${
              active === id
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {active === "users" && usersTab}
      {active === "security" && securityTab}
      {active === "settings" && settingsTab}
    </div>
  );
}
