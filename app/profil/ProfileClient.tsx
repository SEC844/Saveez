"use client";

import { useActionState, useState } from "react";
import {
  updateProfileIdentityAction,
  updateFinancialProfileAction,
} from "@/app/actions/profile";
import {
  Loader2, CheckCircle, AlertCircle, Shield, Users, Flame, TrendingUp,
  Calendar, Star, Pencil, X, Check, PiggyBank, ArrowDownLeft,
  ArrowUpRight, ArrowRightLeft, Wallet,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileStats {
  totalEpargne: number;
  nbMois: number;
  moyenneMensuelle: number;
  meilleurMois: number;
  streakCourant: number;
}

interface ProfileFinancials {
  objectifBase: number;
  fondsSecurite: number;
  epargneActuelle: number;
  revenuNet: number | null;
}

interface ProfileCompte {
  id: string;
  label: string;
  solde: number;
  couleur: string;
  type: string;
}

interface ActivityItem {
  id: string;
  label: string;
  montant: number | null;
  type: string;
  createdAt: Date;
}

interface ProfileClientProps {
  userId: string;
  defaultName?: string | null;
  defaultEmail: string;
  defaultBio?: string | null;
  defaultAvatarUrl?: string | null;
  roleName: string;
  createdAt: Date;
  stats: ProfileStats;
  financials: ProfileFinancials;
  famille: { id: string; name: string } | null;
  comptes: ProfileCompte[];
  recentActivity: ActivityItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAvatarColor(str: string): string {
  const colors = ["#EF4444","#F97316","#EAB308","#22C55E","#06B6D4","#8B5CF6","#EC4899","#14B8A6"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function Avatar({ name, email, avatarUrl, size = 80 }: { name?: string | null; email: string; avatarUrl?: string | null; size?: number }) {
  const label = (name ?? email)[0]?.toUpperCase() ?? "?";
  const color = getAvatarColor(email);
  if (avatarUrl) {
    return (
      <div className="relative rounded-full overflow-hidden shrink-0" style={{ width: size, height: size }}>
        <Image src={avatarUrl} alt={label} fill className="object-cover" unoptimized />
      </div>
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 font-bold text-white select-none"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}>
      {label}
    </div>
  );
}

function StatusMsg({ state, successMsg }: { state: { error?: string; success?: boolean } | null; successMsg?: string }) {
  if (!state) return null;
  if (state.error) return <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2"><AlertCircle size={13} />{state.error}</p>;
  if (state.success) return <p className="flex items-center gap-1.5 text-xs text-emerald-500 mt-2"><CheckCircle size={13} />{successMsg ?? "Enregistré"}</p>;
  return null;
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + "20" }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-lg font-semibold text-zinc-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

const inputCls = "w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400";

// ─── Section identité ─────────────────────────────────────────────────────────

function IdentitySection({ defaultName, defaultEmail, defaultBio, defaultAvatarUrl }: {
  defaultName?: string | null;
  defaultEmail: string;
  defaultBio?: string | null;
  defaultAvatarUrl?: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, isPending] = useActionState(updateProfileIdentityAction, null);
  if (state?.success && editing) setEditing(false);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Identité</h2>
        <button onClick={() => setEditing(!editing)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
          {editing ? <><X size={12} />Annuler</> : <><Pencil size={12} />Modifier</>}
        </button>
      </div>

      {!editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-1">Nom</p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">{defaultName ?? <span className="text-zinc-400 font-normal italic">non renseigné</span>}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-1">E-mail</p>
              <p className="text-base text-zinc-700 dark:text-zinc-200 truncate">{defaultEmail}</p>
            </div>
          </div>
          {defaultBio && (
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-1">Bio</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 italic leading-relaxed">{defaultBio}</p>
            </div>
          )}
        </div>
      ) : (
        <form action={action} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Nom</label>
              <input name="name" defaultValue={defaultName ?? ""} placeholder="Votre nom" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">E-mail</label>
              <input name="email" type="email" required defaultValue={defaultEmail} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Bio (optionnelle)</label>
            <textarea name="bio" defaultValue={defaultBio ?? ""} placeholder="Quelques mots..." rows={2}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">URL de l&apos;avatar</label>
            <input name="avatarUrl" type="url" defaultValue={defaultAvatarUrl ?? ""} placeholder="https://..." className={inputCls} />
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Laissez vide pour utiliser vos initiales</p>
          </div>
          <StatusMsg state={state} successMsg="Profil mis à jour !" />
          <button type="submit" disabled={isPending}
            className="h-9 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50">
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}Enregistrer
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Section financière ───────────────────────────────────────────────────────

function FinancialSection({ financials, comptes }: { financials: ProfileFinancials; comptes: ProfileCompte[] }) {
  const [editing, setEditing] = useState(false);
  const [state, action, isPending] = useActionState(updateFinancialProfileAction, null);
  if (state?.success && editing) setEditing(false);

  const totalComptes = comptes.reduce((s, c) => s + c.solde, 0);
  const patrimoinTotal = financials.epargneActuelle + totalComptes;
  const progressFonds = financials.fondsSecurite > 0
    ? Math.min(100, Math.round((patrimoinTotal / financials.fondsSecurite) * 100))
    : 0;

  const items = [
    { label: "Compte principal", value: financials.epargneActuelle, suffix: " €" },
    { label: "Revenu mensuel net", value: financials.revenuNet, suffix: " €", optional: true },
    { label: "Objectif mensuel de repli", value: financials.objectifBase, suffix: " €" },
    { label: "Fonds de sécurité cible", value: financials.fondsSecurite, suffix: " €" },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <PiggyBank size={15} className="text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Données financières</h2>
        </div>
        <button onClick={() => setEditing(!editing)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
          {editing ? <><X size={12} />Annuler</> : <><Pencil size={12} />Modifier</>}
        </button>
      </div>

      {!editing ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            {items.map((item) => (
              <div key={item.label}>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-base font-semibold text-zinc-900 dark:text-white">
                  {item.value != null
                    ? `${item.value.toLocaleString("fr-FR")}${item.suffix}`
                    : <span className="text-zinc-400 font-normal italic">non renseigné</span>}
                </p>
              </div>
            ))}
          </div>

          {/* Jauge fonds de sécurité */}
          {financials.fondsSecurite > 0 && (
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-zinc-500 dark:text-zinc-400">Progression vers le fonds de sécurité</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{progressFonds}%</span>
              </div>
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressFonds}%`,
                    background: progressFonds >= 100 ? "#22C55E" : progressFonds >= 50 ? "#3B82F6" : "#F97316",
                  }}
                />
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">
                {patrimoinTotal.toLocaleString("fr-FR")} € sur {financials.fondsSecurite.toLocaleString("fr-FR")} € visés
              </p>
            </div>
          )}
        </div>
      ) : (
        <form action={action} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Compte principal (€)</label>
              <input name="epargneActuelle" type="number" min="0" step="0.01" defaultValue={financials.epargneActuelle} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Revenu mensuel net (€) <span className="text-zinc-400 font-normal">optionnel</span></label>
              <input name="revenuNet" type="number" min="0" step="50" defaultValue={financials.revenuNet ?? ""} placeholder="Ex : 2 500" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Objectif mensuel de repli (€)</label>
              <input name="objectifBase" type="number" min="0" step="1" defaultValue={financials.objectifBase} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Fonds de sécurité cible (€)</label>
              <input name="fondsSecurite" type="number" min="0" step="100" defaultValue={financials.fondsSecurite} className={inputCls} />
            </div>
          </div>
          <StatusMsg state={state} successMsg="Données financières mises à jour !" />
          <button type="submit" disabled={isPending}
            className="h-9 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50">
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}Enregistrer
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Section comptes ──────────────────────────────────────────────────────────

function ComptesSection({ comptes, epargneActuelle }: { comptes: ProfileCompte[]; epargneActuelle: number }) {
  const total = epargneActuelle + comptes.reduce((s, c) => s + c.solde, 0);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Wallet size={15} className="text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Répartition de l&apos;épargne</h2>
        </div>
        <Link href="/comptes" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors underline underline-offset-2">
          Gérer
        </Link>
      </div>

      <div className="space-y-3">
        {/* Compte principal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">Compte principal</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: total > 0 ? `${(epargneActuelle / total) * 100}%` : "0%" }} />
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white w-24 text-right">{epargneActuelle.toLocaleString("fr-FR")} €</p>
          </div>
        </div>

        {comptes.map((c) => (
          <div key={c.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.couleur }} />
              <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{c.label}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 capitalize">{c.type}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: total > 0 ? `${(c.solde / total) * 100}%` : "0%", backgroundColor: c.couleur }} />
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white w-24 text-right">{c.solde.toLocaleString("fr-FR")} €</p>
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total patrimoine</p>
          <p className="text-base font-bold text-zinc-900 dark:text-white">{total.toLocaleString("fr-FR")} €</p>
        </div>
      </div>
    </div>
  );
}

// ─── Section activité récente ─────────────────────────────────────────────────

function ActivitySection({ activity }: { activity: ActivityItem[] }) {
  function TxIcon({ type }: { type: string }) {
    if (type.includes("transfert")) return <ArrowRightLeft size={13} className="text-blue-400 shrink-0" />;
    if (type.includes("retrait")) return <ArrowDownLeft size={13} className="text-red-400 shrink-0" />;
    return <ArrowUpRight size={13} className="text-emerald-400 shrink-0" />;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Activité récente</h2>
        </div>
        <Link href="/historique" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors underline underline-offset-2">
          Tout voir
        </Link>
      </div>

      {activity.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">Aucune activité récente.</p>
      ) : (
        <div className="space-y-3">
          {activity.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                <TxIcon type={item.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-snug truncate">{item.label}</p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {new Date(item.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {item.montant != null && (
                <p className={`text-xs font-semibold shrink-0 ${item.type.includes("retrait") || item.type.includes("depense") ? "text-red-500" : "text-emerald-500"}`}>
                  {item.type.includes("retrait") || item.type.includes("depense") ? "−" : "+"}{item.montant.toLocaleString("fr-FR")} €
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function ProfileClient({
  defaultName, defaultEmail, defaultBio, defaultAvatarUrl,
  roleName, createdAt, stats, financials, famille, comptes, recentActivity,
}: ProfileClientProps) {
  const memberSince = new Date(createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
        <div className="flex items-start gap-6">
          <div className="relative shrink-0">
            <Avatar name={defaultName} email={defaultEmail} avatarUrl={defaultAvatarUrl} size={80} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white truncate">
              {defaultName ?? defaultEmail}
            </h1>
            {defaultName && (
              <p className="text-base text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{defaultEmail}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                <Shield size={11} />{roleName}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">Membre depuis {memberSince}</span>
              {famille && (
                <Link href="/famille" className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-medium hover:opacity-80">
                  <Users size={11} />{famille.name}
                </Link>
              )}
            </div>
            {defaultBio && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 italic leading-relaxed">{defaultBio}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} label="Total épargné" value={`${stats.totalEpargne.toLocaleString("fr-FR")} €`} color="#22C55E" />
        <StatCard icon={Calendar} label="Mois renseignés" value={`${stats.nbMois} mois`} color="#8B5CF6" />
        <StatCard icon={Star} label="Meilleur mois" value={stats.meilleurMois > 0 ? `${stats.meilleurMois.toLocaleString("fr-FR")} €` : "—"} color="#EAB308" />
        <StatCard icon={Flame} label="Streak courant" value={stats.streakCourant > 0 ? `${stats.streakCourant} mois` : "Aucun"} color="#F97316" />
      </div>

      {/* ── Grille 2 colonnes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Colonne gauche */}
        <div className="space-y-5">
          <IdentitySection
            defaultName={defaultName}
            defaultEmail={defaultEmail}
            defaultBio={defaultBio}
            defaultAvatarUrl={defaultAvatarUrl}
          />
          <FinancialSection financials={financials} comptes={comptes} />
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          <ComptesSection comptes={comptes} epargneActuelle={financials.epargneActuelle} />
          <ActivitySection activity={recentActivity} />
        </div>
      </div>
    </div>
  );
}
