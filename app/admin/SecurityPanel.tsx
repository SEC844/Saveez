"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Monitor,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoginAttemptDTO = {
  id: string;
  email: string;
  ip: string | null;
  success: boolean;
  userAgent: string | null;
  createdAt: Date;
  with2FA: boolean;
};

export type LockoutStatusDTO = {
  email: string;
  failCount: number;
  isLocked: boolean;
};

interface SecurityPanelProps {
  recentAttempts: LoginAttemptDTO[];
  lockoutStatuses: LockoutStatusDTO[];
  statsToday: { total: number; success: number; failed: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffH = Math.floor(diffMins / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `Il y a ${diffD}j`;
}

function parseUA(ua: string | null): string {
  if (!ua) return "Inconnu";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("curl")) return "curl";
  return "Autre";
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "zinc" | "emerald" | "red";
}) {
  const bg = {
    zinc: "bg-zinc-50 dark:bg-zinc-800/50",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30",
    red: "bg-red-50 dark:bg-red-950/30",
  }[color];
  const text = {
    zinc: "text-zinc-900 dark:text-white",
    emerald: "text-emerald-700 dark:text-emerald-400",
    red: "text-red-700 dark:text-red-400",
  }[color];
  return (
    <div className={`rounded-xl p-3 ${bg}`}>
      <p className={`text-xl font-bold ${text}`}>{value}</p>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
        {label}
      </p>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SecurityPanel({
  recentAttempts,
  lockoutStatuses,
  statsToday,
}: SecurityPanelProps) {
  const [filterEmail, setFilterEmail] = useState("");
  const [showOnlyFailed, setShowOnlyFailed] = useState(false);

  const filtered = recentAttempts.filter((a) => {
    if (showOnlyFailed && a.success) return false;
    if (filterEmail && !a.email.toLowerCase().includes(filterEmail.toLowerCase()))
      return false;
    return true;
  });

  const lockedUsers = lockoutStatuses.filter((s) => s.isLocked);

  return (
    <div className="space-y-5">
      {/* ── En-tête ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <ShieldCheck size={14} className="text-zinc-500" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Sécurité & Connexions
          </h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Historique des tentatives de connexion (24h)
          </p>
        </div>
      </div>

      {/* ── Stats du jour ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Tentatives aujourd'hui" value={statsToday.total} color="zinc" />
        <StatCard label="Connexions réussies" value={statsToday.success} color="emerald" />
        <StatCard label="Échecs" value={statsToday.failed} color="red" />
      </div>

      {/* ── Comptes bloqués ─────────────────────────────────────────────────── */}
      {lockedUsers.length > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={13} className="text-red-500" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {lockedUsers.length} compte{lockedUsers.length > 1 ? "s" : ""} temporairement
              bloqué{lockedUsers.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="space-y-1.5">
            {lockedUsers.map((s) => (
              <div
                key={s.email}
                className="flex items-center justify-between rounded-lg bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/30 px-3 py-2"
              >
                <span className="text-xs text-zinc-700 dark:text-zinc-300">{s.email}</span>
                <span className="text-[11px] font-medium text-red-600 dark:text-red-400">
                  {s.failCount} échecs (15 min)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Activité suspecte (beaucoup d'échecs, pas encore bloqué) ─────────── */}
      {lockoutStatuses.filter((s) => !s.isLocked && s.failCount >= 3).length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={13} className="text-amber-500" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Activité suspecte détectée
            </p>
          </div>
          <div className="space-y-1.5">
            {lockoutStatuses
              .filter((s) => !s.isLocked && s.failCount >= 3)
              .map((s) => (
                <div
                  key={s.email}
                  className="flex items-center justify-between rounded-lg bg-white dark:bg-zinc-900 border border-amber-100 dark:border-amber-900/30 px-3 py-2"
                >
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">{s.email}</span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400">
                    {s.failCount} échecs (15 min)
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Historique des connexions ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        {/* Barre de filtres */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Filtrer par email…"
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
          <label className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-300 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={showOnlyFailed}
              onChange={(e) => setShowOnlyFailed(e.target.checked)}
              className="rounded accent-red-600"
            />
            Échecs seulement
          </label>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-zinc-400 py-8">
            Aucune tentative de connexion enregistrée.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Statut
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide hidden sm:table-cell">
                    IP
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide hidden md:table-cell">
                    Navigateur
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Heure
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      {attempt.success ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            <span className="hidden sm:inline">Succès</span>
                          </span>
                          {attempt.with2FA && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-medium">
                              <ShieldCheck size={9} />
                              2FA
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500">
                          <XCircle size={12} />
                          <span className="hidden sm:inline">Échec</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300 max-w-[180px] truncate">
                      {attempt.email}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400 font-mono hidden sm:table-cell">
                      {attempt.ip ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                        <Monitor size={10} />
                        {parseUA(attempt.userAgent)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                        <Clock size={10} />
                        {timeAgo(attempt.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Légende fail-to-ban ──────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
        <ShieldAlert size={13} className="text-zinc-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Fail-to-ban actif : un compte est automatiquement bloqué après{" "}
          <strong className="text-zinc-700 dark:text-zinc-300">10 tentatives échouées</strong> en
          15 minutes. Le blocage se lève automatiquement après 15 minutes.
        </p>
      </div>
    </div>
  );
}
