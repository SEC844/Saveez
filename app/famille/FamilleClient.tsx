"use client";

import { useActionState, useState } from "react";
import {
  createFamilleAction,
  createInvitationAction,
  leaveFamilleAction,
  promouvoirMembreAction,
  exclureMembreAction,
} from "@/app/actions/famille";
import {
  Users, Plus, Link2, Crown, LogOut, Trash2,
  CheckCircle, AlertCircle, Loader2, Copy, Check, X,
  ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  type: string;
  montant: number;
  note: string | null;
  createdAt: Date;
  userName: string;
  isMe: boolean;
  detail: string | null;
}

interface CompteFamilial {
  id: string;
  label: string;
  type: string;
  solde: number;
  couleur: string;
  transactions: Transaction[];
}

interface Membre {
  userId: string;
  role: string;
  joinedAt: Date;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface Invitation {
  id: string;
  email: string;
  token: string;
  expiresAt: Date;
}

interface FamilleData {
  id: string;
  name: string;
  membres: Membre[];
  comptes: CompteFamilial[];
  invitations: Invitation[];
}

interface FamilleClientProps {
  currentUserId: string;
  myRole: "admin" | "membre" | null;
  famille: FamilleData | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ name, email, avatarUrl, size = 32 }: { name?: string | null; email: string; avatarUrl?: string | null; size?: number }) {
  const colors = ["#EF4444","#F97316","#EAB308","#22C55E","#06B6D4","#8B5CF6","#EC4899"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];
  const label = (name ?? email)[0]?.toUpperCase() ?? "?";
  if (avatarUrl)
    return <div className="relative rounded-full overflow-hidden shrink-0" style={{ width: size, height: size }}><Image src={avatarUrl} alt={label} fill className="object-cover" unoptimized /></div>;
  return <div className="rounded-full flex items-center justify-center shrink-0 font-semibold text-white text-xs" style={{ width: size, height: size, backgroundColor: color }}>{label}</div>;
}

function StatusMsg({ state }: { state: { error?: string; success?: boolean } | null }) {
  if (!state) return null;
  if (state.error) return <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2"><AlertCircle size={12} />{state.error}</p>;
  if (state.success) return <p className="flex items-center gap-1.5 text-xs text-emerald-500 mt-2"><CheckCircle size={12} />Fait !</p>;
  return null;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
      {copied ? "Copié !" : "Copier"}
    </button>
  );
}

// ─── Vue "pas de famille" ─────────────────────────────────────────────────────

function NoFamilleView() {
  const [createState, createAction, createPending] = useActionState(createFamilleAction, null);
  return (
    <div className="max-w-md mx-auto py-12 space-y-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl mx-auto">👨‍👩‍👧‍👦</div>
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Aucune famille</h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
          Créez une famille pour partager votre épargne avec vos proches, ou rejoignez-en une via un lien d'invitation.
        </p>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 text-left">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Créer ma famille</h3>
        <form action={createAction} className="space-y-3">
          <input name="name" required placeholder="Ex : Famille Dupont" className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400" />
          <StatusMsg state={createState} />
          <button type="submit" disabled={createPending} className="w-full h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            {createPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Créer
          </button>
        </form>
      </div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Vous avez un lien d'invitation ?<br />
        <a href="/famille/join" className="underline text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white">Rejoindre une famille</a>
      </p>
    </div>
  );
}

// ─── Carte compte familial (lecture seule) ───────────────────────────────────

function CompteReadCard({ compte }: { compte: CompteFamilial }) {
  const [expanded, setExpanded] = useState(false);

  function TxIcon({ type, montant }: { type: string; montant: number }) {
    if (type === "transfert") return <ArrowRightLeft size={12} className="text-blue-400 shrink-0" />;
    if (montant < 0) return <ArrowDownLeft size={12} className="text-red-400 shrink-0" />;
    return <ArrowUpRight size={12} className="text-emerald-400 shrink-0" />;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: compte.couleur }} />
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{compte.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-lg font-bold text-zinc-900 dark:text-white">
            {compte.solde.toLocaleString("fr-FR")} €
          </p>
          {compte.transactions.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {expanded ? "Masquer" : `${compte.transactions.length} opérations`}
            </button>
          )}
        </div>
      </div>

      {expanded && compte.transactions.length > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3">
          <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">Historique</p>
          <div className="space-y-2">
            {compte.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <TxIcon type={t.type} montant={t.montant} />
                  <span className={t.montant >= 0 ? "text-emerald-500 shrink-0 font-medium" : "text-red-400 shrink-0 font-medium"}>
                    {t.montant >= 0 ? "+" : ""}{t.montant.toLocaleString("fr-FR")} €
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-500 truncate">
                    {t.isMe ? "Vous" : t.userName}
                    {t.note && ` · ${t.note}`}
                    {t.detail && ` ${t.detail}`}
                  </span>
                </div>
                <span className="text-zinc-300 dark:text-zinc-600 text-[10px] shrink-0 ml-2">
                  {new Date(t.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lien vers la page comptes pour agir */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2">
        <Link href="/comptes" className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
          <Wallet size={11} />
          Gérer ce compte dans Mes Comptes
        </Link>
      </div>
    </div>
  );
}

// ─── Vue principale famille ───────────────────────────────────────────────────

export default function FamilleClient({ currentUserId, myRole, famille }: FamilleClientProps) {
  const [leaveState, leaveAction, leavePending] = useActionState(leaveFamilleAction, null);
  const [inviteState, inviteAction, invitePending] = useActionState(createInvitationAction, null);
  const [promouvoirState, promouvoirAction, promouvoirPending] = useActionState(promouvoirMembreAction, null);
  const [exclureState, exclureAction, exclurePending] = useActionState(exclureMembreAction, null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const isAdmin = myRole === "admin";

  if (!famille) return <NoFamilleView />;

  const inviteLink = inviteState?.token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/famille/join/${inviteState.token}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
            <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">{famille.name}</h1>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {famille.membres.length} membre{famille.membres.length > 1 ? "s" : ""}
              {isAdmin && <span className="ml-2 text-emerald-500 font-medium">· Admin</span>}
            </p>
          </div>
        </div>
        {!confirmLeave ? (
          <button onClick={() => setConfirmLeave(true)} className="h-8 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 flex items-center gap-1.5 transition-colors">
            <LogOut size={12} />Quitter
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-xs text-red-500">Confirmer ?</p>
            <form action={leaveAction} className="flex gap-1.5">
              <button type="submit" disabled={leavePending} className="h-8 px-3 rounded-xl bg-red-600 text-white text-xs font-medium flex items-center gap-1 disabled:opacity-50">
                {leavePending ? <Loader2 size={11} className="animate-spin" /> : null}Oui
              </button>
              <button type="button" onClick={() => setConfirmLeave(false)} className="h-8 w-8 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                <X size={13} />
              </button>
            </form>
            <StatusMsg state={leaveState} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : comptes familiaux (lecture seule) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Comptes familiaux</h2>
            <Link href="/comptes" className="h-8 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <Plus size={11} />Créer depuis Mes Comptes
            </Link>
          </div>

          {famille.comptes.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-10 text-center">
              <Wallet size={28} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Aucun compte familial</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 mb-3">
                Créez un compte de type &quot;Famille&quot; depuis la page Comptes.
              </p>
              <Link href="/comptes" className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 underline hover:text-zinc-900 dark:hover:text-white">
                <Wallet size={12} />Aller aux Comptes
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {famille.comptes.map((c) => (
                <CompteReadCard key={c.id} compte={c} />
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite : membres + invitations */}
        <div className="space-y-4">
          {/* Membres */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Membres</h3>
            <div className="space-y-2.5">
              {famille.membres.map((m) => (
                <div key={m.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={m.name} email={m.email} avatarUrl={m.avatarUrl} size={32} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                        {m.name ?? m.email}
                        {m.userId === currentUserId && <span className="ml-1 text-zinc-400 dark:text-zinc-500">(vous)</span>}
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {m.role === "admin"
                          ? <span className="flex items-center gap-0.5"><Crown size={9} className="text-yellow-500" />Admin</span>
                          : "Membre"}
                      </p>
                    </div>
                  </div>
                  {isAdmin && m.userId !== currentUserId && (
                    <div className="flex gap-1 shrink-0">
                      {m.role !== "admin" && (
                        <form action={promouvoirAction}>
                          <input type="hidden" name="targetUserId" value={m.userId} />
                          <button type="submit" disabled={promouvoirPending} title="Promouvoir admin"
                            className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-yellow-500 hover:border-yellow-200 transition-colors disabled:opacity-50">
                            <Crown size={12} />
                          </button>
                        </form>
                      )}
                      <form action={exclureAction}>
                        <input type="hidden" name="targetUserId" value={m.userId} />
                        <button type="submit" disabled={exclurePending} title="Exclure"
                          className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50">
                          <Trash2 size={12} />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <StatusMsg state={promouvoirState ?? exclureState} />
          </div>

          {/* Invitations (admin seulement) */}
          {isAdmin && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Inviter un membre</h3>
              <form action={inviteAction} className="space-y-2">
                <input name="email" type="email" placeholder="Email (informatif)" className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400" />
                <button type="submit" disabled={invitePending} className="w-full h-9 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50">
                  {invitePending ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
                  Générer un lien
                </button>
              </form>

              {inviteLink && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                  <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 mb-1.5">Lien d'invitation (7 jours) :</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 break-all flex-1 font-mono">{inviteLink}</p>
                    <CopyButton value={inviteLink} />
                  </div>
                </div>
              )}

              {famille.invitations.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">En attente</p>
                  <div className="space-y-1.5">
                    {famille.invitations.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-600 dark:text-zinc-300 truncate">{inv.email === "invitation" ? "Lien générique" : inv.email}</span>
                        <span className="text-zinc-400 shrink-0 ml-2">
                          exp. {new Date(inv.expiresAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
