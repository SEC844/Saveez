"use client";

import { useActionState } from "react";
import {
  createRoleAction,
  createUserAdminAction,
  updateUserAdminAction,
  updateUserPasswordAdminAction,
} from "@/app/actions/admin";
import { PERMISSION_CATALOG } from "@/lib/rbac";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

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
}

function UserCard({ user, roles }: { user: UserDTO; roles: RoleDTO[] }) {
  const [updateState, updateAction, updatePending] = useActionState(updateUserAdminAction, null);
  const [passwordState, passwordAction, passwordPending] = useActionState(updateUserPasswordAdminAction, null);

  return (
    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-900 dark:text-white">{user.email}</p>
        <span className="text-[11px] px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
          {user.role?.name ?? "standard"}
        </span>
      </div>

      <form action={updateAction} className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input type="hidden" name="userId" value={user.id} />
        <input
          name="name"
          defaultValue={user.name ?? ""}
          placeholder="Nom"
          className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs"
        />
        <input
          name="email"
          type="email"
          defaultValue={user.email}
          placeholder="E-mail"
          className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs"
        />
        <select
          name="roleId"
          defaultValue={user.role?.id ?? ""}
          className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs"
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
          className="h-9 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium inline-flex items-center justify-center gap-1.5"
        >
          {updatePending && <Loader2 size={12} className="animate-spin" />}
          Enregistrer
        </button>
      </form>

      {updateState?.error && <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={12} />{updateState.error}</p>}
      {updateState?.success && <p className="text-[11px] text-emerald-500 flex items-center gap-1"><CheckCircle size={12} />Profil mis à jour</p>}

      <form action={passwordAction} className="flex flex-col md:flex-row gap-2">
        <input type="hidden" name="userId" value={user.id} />
        <input
          name="newPassword"
          type="password"
          minLength={12}
          required
          placeholder="Nouveau mot de passe (12+)"
          className="h-9 flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs"
        />
        <button
          type="submit"
          disabled={passwordPending}
          className="h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 inline-flex items-center justify-center gap-1.5"
        >
          {passwordPending && <Loader2 size={12} className="animate-spin" />}
          Réinitialiser MDP
        </button>
      </form>

      {passwordState?.error && <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={12} />{passwordState.error}</p>}
      {passwordState?.success && <p className="text-[11px] text-emerald-500 flex items-center gap-1"><CheckCircle size={12} />Mot de passe mis à jour</p>}
    </div>
  );
}

export default function AdminPanel({ users, roles }: AdminPanelProps) {
  const [roleState, roleAction, rolePending] = useActionState(createRoleAction, null);
  const [createUserState, createUserAction, createUserPending] = useActionState(createUserAdminAction, null);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <section className="xl:col-span-2 space-y-3">
        <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Créer un utilisateur</h2>
          <form action={createUserAction} className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input
              name="name"
              placeholder="Nom"
              className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="email@exemple.com"
              className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs"
            />
            <input
              name="password"
              type="password"
              required
              minLength={12}
              placeholder="Mot de passe (12+)"
              className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs"
            />
            <select
              name="roleId"
              defaultValue={roles[0]?.id ?? ""}
              className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs"
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
              className="h-9 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium inline-flex items-center justify-center gap-1.5"
            >
              {createUserPending && <Loader2 size={12} className="animate-spin" />}
              Créer utilisateur
            </button>
          </form>
          {createUserState?.error && <p className="text-[11px] text-red-500 flex items-center gap-1 mt-2"><AlertCircle size={12} />{createUserState.error}</p>}
          {createUserState?.success && <p className="text-[11px] text-emerald-500 flex items-center gap-1 mt-2"><CheckCircle size={12} />Utilisateur créé</p>}
        </div>

        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Utilisateurs</h2>
        {users.map((user) => (
          <UserCard key={user.id} user={user} roles={roles} />
        ))}
      </section>

      <section className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 h-fit">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Créer un rôle</h2>

        <form action={roleAction} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Nom du rôle</label>
            <input
              name="name"
              required
              placeholder="ex: manager"
              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Description</label>
            <input
              name="description"
              placeholder="Description du rôle"
              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Permissions</p>
            <div className="space-y-1.5 max-h-56 overflow-auto pr-1">
              {PERMISSION_CATALOG.map((permission) => (
                <label key={permission} className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                  <input type="checkbox" name="permissions" value={permission} className="rounded" />
                  {permission}
                </label>
              ))}
            </div>
          </div>

          {roleState?.error && <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={12} />{roleState.error}</p>}
          {roleState?.success && <p className="text-[11px] text-emerald-500 flex items-center gap-1"><CheckCircle size={12} />Rôle créé</p>}

          <button
            type="submit"
            disabled={rolePending}
            className="w-full h-9 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium inline-flex items-center justify-center gap-1.5"
          >
            {rolePending && <Loader2 size={12} className="animate-spin" />}
            Créer le rôle
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Rôles existants</p>
          <div className="space-y-2">
            {roles.map((role) => {
              const permissions = Array.isArray(role.permissions)
                ? (role.permissions as string[])
                : [];

              return (
                <div key={role.id} className="rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2">
                  <p className="text-xs font-medium text-zinc-900 dark:text-white">
                    {role.name} {role.isSystem ? "(système)" : ""}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {permissions.length} permission(s)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
