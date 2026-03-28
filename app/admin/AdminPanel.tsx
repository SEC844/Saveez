"use client";

import { useActionState, useState } from "react";
import {
  createRoleAction,
  createUserAdminAction,
  deleteRoleAction,
  deleteUserAdminAction,
  updateRoleAction,
  updateUserAdminAction,
  updateUserPasswordAdminAction,
} from "@/app/actions/admin";
import { PERMISSION_CATALOG } from "@/lib/rbac";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserMinus,
  X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type RoleDTO = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: unknown;
};

type UserDTO = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  role: { id: string; name: string } | null;
};

interface AdminPanelProps {
  users: UserDTO[];
  roles: RoleDTO[];
  currentUserId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusMessage({ state }: { state: { error?: string; success?: boolean } | null }) {
  if (!state) return null;
  if (state.error)
    return (
      <p className="flex items-center gap-1.5 text-[11px] text-red-500 mt-2">
        <AlertCircle size={12} className="shrink-0" />
        {state.error}
      </p>
    );
  if (state.success)
    return (
      <p className="flex items-center gap-1.5 text-[11px] text-emerald-500 mt-2">
        <CheckCircle size={12} className="shrink-0" />
        Opération réussie
      </p>
    );
  return null;
}

function RoleBadge({ name, isSystem }: { name: string; isSystem: boolean }) {
  const colors: Record<string, string> = {
    admin: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    standard: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  };
  const color =
    colors[name] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${color}`}>
      {isSystem && <Shield size={9} />}
      {name}
    </span>
  );
}

// ─── Carte utilisateur ───────────────────────────────────────────────────────

function UserCard({
  user,
  roles,
  isSelf,
}: {
  user: UserDTO;
  roles: RoleDTO[];
  isSelf: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(
    updateUserAdminAction,
    null
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    updateUserPasswordAdminAction,
    null
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteUserAdminAction,
    null
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">
            {(user.name ?? user.email)[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
              {user.name ?? user.email}
              {isSelf && (
                <span className="ml-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">(vous)</span>
              )}
            </p>
            {user.name && (
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">{user.email}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <RoleBadge
            name={user.role?.name ?? "—"}
            isSystem={roles.find((r) => r.id === user.role?.id)?.isSystem ?? false}
          />
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label={expanded ? "Réduire" : "Modifier"}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded edit panel */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 space-y-4 bg-zinc-50 dark:bg-zinc-800/50">
          {/* Profil */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
              Profil &amp; Rôle
            </p>
            <form action={updateAction} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input type="hidden" name="userId" value={user.id} />
              <input
                name="name"
                defaultValue={user.name ?? ""}
                placeholder="Nom affiché"
                className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <input
                name="email"
                type="email"
                defaultValue={user.email}
                placeholder="E-mail"
                className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <div className="flex gap-2">
                <select
                  name="roleId"
                  defaultValue={user.role?.id ?? ""}
                  className="flex-1 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={updatePending}
                  className="h-9 px-3 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updatePending ? <Loader2 size={12} className="animate-spin" /> : <Pencil size={12} />}
                  Sauver
                </button>
              </div>
            </form>
            <StatusMessage state={updateState} />
          </div>

          {/* Mot de passe */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
              Réinitialiser le mot de passe
            </p>
            <form action={passwordAction} className="flex gap-2">
              <input type="hidden" name="userId" value={user.id} />
              <input
                name="newPassword"
                type="password"
                minLength={12}
                required
                placeholder="Nouveau mot de passe (12+ caractères)"
                className="h-9 flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <button
                type="submit"
                disabled={passwordPending}
                className="h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                {passwordPending ? <Loader2 size={12} className="animate-spin" /> : null}
                Réinitialiser
              </button>
            </form>
            <StatusMessage state={passwordState} />
          </div>

          {/* Suppression */}
          {!isSelf && (
            <div>
              <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wide mb-2">
                Zone dangereuse
              </p>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="h-9 px-3 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs inline-flex items-center gap-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <UserMinus size={12} />
                  Supprimer cet utilisateur
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Confirmer la suppression de {user.email} ?
                  </p>
                  <form action={deleteAction} className="flex gap-1.5">
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      type="submit"
                      disabled={deletePending}
                      className="h-8 px-3 rounded-lg bg-red-600 text-white text-xs font-medium inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      {deletePending ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Trash2 size={11} />
                      )}
                      Supprimer
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    >
                      <X size={11} />
                    </button>
                  </form>
                  <StatusMessage state={deleteState} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Carte rôle ──────────────────────────────────────────────────────────────

function RoleCard({ role, onDeleted }: { role: RoleDTO; onDeleted?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(updateRoleAction, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteRoleAction, null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const permissions = Array.isArray(role.permissions) ? (role.permissions as string[]) : [];

  return (
    <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <RoleBadge name={role.name} isSystem={role.isSystem} />
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {permissions.length} permission{permissions.length > 1 ? "s" : ""}
          </span>
        </div>
        {!role.isSystem && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <Pencil size={13} />}
          </button>
        )}
      </div>

      {role.description && !expanded && (
        <p className="px-3 pb-2.5 text-[11px] text-zinc-400 dark:text-zinc-500">
          {role.description}
        </p>
      )}

      {expanded && !role.isSystem && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-3 space-y-3 bg-zinc-50 dark:bg-zinc-800/50">
          {/* Edit permissions */}
          <form action={updateAction} className="space-y-2">
            <input type="hidden" name="roleId" value={role.id} />
            <input
              name="description"
              defaultValue={role.description ?? ""}
              placeholder="Description"
              className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
              {PERMISSION_CATALOG.map((perm) => (
                <label key={perm} className="flex items-center gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="permissions"
                    value={perm}
                    defaultChecked={permissions.includes(perm)}
                    className="rounded accent-zinc-900 dark:accent-white"
                  />
                  {perm}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updatePending}
                className="h-8 px-3 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {updatePending ? <Loader2 size={11} className="animate-spin" /> : <Pencil size={11} />}
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500"
              >
                Annuler
              </button>
            </div>
            <StatusMessage state={updateState} />
          </form>

          {/* Suppression rôle */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="h-7 px-2.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[11px] inline-flex items-center gap-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 size={11} />
              Supprimer ce rôle
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-red-600 dark:text-red-400">Confirmer ?</p>
              <form action={deleteAction} className="flex gap-1.5">
                <input type="hidden" name="roleId" value={role.id} />
                <button
                  type="submit"
                  disabled={deletePending}
                  className="h-7 px-2.5 rounded-lg bg-red-600 text-white text-[11px] font-medium inline-flex items-center gap-1 disabled:opacity-50"
                >
                  {deletePending ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                  Oui, supprimer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="h-7 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-500"
                >
                  Annuler
                </button>
              </form>
              <StatusMessage state={deleteState} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Panel principal ─────────────────────────────────────────────────────────

export default function AdminPanel({ users, roles, currentUserId }: AdminPanelProps) {
  const [roleState, roleAction, rolePending] = useActionState(createRoleAction, null);
  const [createUserState, createUserAction, createUserPending] = useActionState(
    createUserAdminAction,
    null
  );
  const [showCreateRole, setShowCreateRole] = useState(false);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* ── Colonne gauche : utilisateurs ── */}
      <section className="xl:col-span-2 space-y-4">
        {/* Créer un utilisateur */}
        <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Plus size={14} className="text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Créer un utilisateur
            </h2>
          </div>
          <form action={createUserAction} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              name="name"
              placeholder="Nom affiché (optionnel)"
              className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="email@exemple.com"
              className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <input
              name="password"
              type="password"
              required
              minLength={12}
              placeholder="Mot de passe (12+ caractères)"
              className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <div className="flex gap-2">
              <select
                name="roleId"
                defaultValue={roles[0]?.id ?? ""}
                className="flex-1 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={createUserPending}
                className="h-9 px-4 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {createUserPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Plus size={12} />
                )}
                Créer
              </button>
            </div>
          </form>
          <StatusMessage state={createUserState} />
        </div>

        {/* Liste utilisateurs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Utilisateurs
              <span className="ml-2 text-[11px] font-normal text-zinc-400 dark:text-zinc-500">
                {users.length} compte{users.length > 1 ? "s" : ""}
              </span>
            </h2>
          </div>
          <div className="space-y-2">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                roles={roles}
                isSelf={user.id === currentUserId}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Colonne droite : rôles ── */}
      <section className="space-y-4">
        {/* Rôles existants */}
        <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Rôles</h2>
            </div>
            <button
              onClick={() => setShowCreateRole((v) => !v)}
              className="h-7 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 inline-flex items-center gap-1 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {showCreateRole ? <X size={11} /> : <Plus size={11} />}
              {showCreateRole ? "Annuler" : "Nouveau"}
            </button>
          </div>

          <div className="space-y-2">
            {roles.map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        </div>

        {/* Créer un rôle */}
        {showCreateRole && (
          <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
              Nouveau rôle personnalisé
            </h3>
            <form action={roleAction} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Nom du rôle
                </label>
                <input
                  name="name"
                  required
                  placeholder="ex: moderateur"
                  className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Description
                </label>
                <input
                  name="description"
                  placeholder="Description optionnelle"
                  className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                  Permissions
                </p>
                <div className="grid grid-cols-1 gap-1 max-h-52 overflow-y-auto pr-1">
                  {PERMISSION_CATALOG.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center gap-2 text-[11px] text-zinc-700 dark:text-zinc-300 cursor-pointer py-0.5"
                    >
                      <input
                        type="checkbox"
                        name="permissions"
                        value={permission}
                        className="rounded accent-zinc-900 dark:accent-white"
                      />
                      {permission}
                    </label>
                  ))}
                </div>
              </div>
              <StatusMessage state={roleState} />
              <button
                type="submit"
                disabled={rolePending}
                className="w-full h-9 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {rolePending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Créer le rôle
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
