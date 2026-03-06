"use client";

import { useState, useActionState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Loader2, ToggleLeft, ToggleRight, X } from "lucide-react";
import {
    createCompteAction,
    deleteCompteAction,
    toggleCompteAction,
} from "@/app/actions/compte";
import type { Compte } from "@prisma/client";

interface CompteSettingsProps {
    comptes: Compte[];
}

type CompteType = "vacances" | "autre";

const TYPE_LABELS: Record<CompteType, string> = {
    vacances: "Vacances",
    autre: "Autre",
};
const TYPE_COLORS: Record<CompteType, string> = {
    vacances: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
    autre: "bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400",
};

export default function CompteSettings({ comptes }: CompteSettingsProps) {
    const [createState, createAction, isCreating] = useActionState(createCompteAction, null);
    const [type, setType] = useState<CompteType>("vacances");
    const [label, setLabel] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    async function handleDelete(id: string) {
        if (!confirm("Supprimer ce compte ? Les objectifs liés seront dissociés.")) return;
        setDeletingId(id);
        await deleteCompteAction(id);
        setDeletingId(null);
    }

    async function handleToggle(id: string) {
        setTogglingId(id);
        await toggleCompteAction(id);
        setTogglingId(null);
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Comptes spéciaux
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Créez des comptes vacances ou autre pour répartir votre épargne par projet.
                </p>
            </div>

            {/* Liste */}
            {comptes.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                    Aucun compte spécial pour l&apos;instant.
                </p>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence initial={false}>
                        {comptes.map((c) => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
                            >
                                {/* Badge type */}
                                <span
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${TYPE_COLORS[c.type as CompteType] ?? "bg-zinc-100 text-zinc-500"
                                        }`}
                                >
                                    {TYPE_LABELS[c.type as CompteType] ?? c.type}
                                </span>

                                {/* Label */}
                                <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-white truncate">
                                    {c.label}
                                </span>

                                {/* Toggle actif */}
                                <button
                                    type="button"
                                    onClick={() => handleToggle(c.id)}
                                    disabled={togglingId === c.id}
                                    title={c.actif ? "Désactiver" : "Activer"}
                                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-40 transition-colors"
                                >
                                    {togglingId === c.id ? (
                                        <Loader2 size={15} className="animate-spin" />
                                    ) : c.actif ? (
                                        <ToggleRight size={18} className="text-green-500" />
                                    ) : (
                                        <ToggleLeft size={18} />
                                    )}
                                </button>

                                {/* Supprimer */}
                                <button
                                    type="button"
                                    onClick={() => handleDelete(c.id)}
                                    disabled={deletingId === c.id}
                                    title="Supprimer"
                                    className="text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 disabled:opacity-40 transition-colors"
                                >
                                    {deletingId === c.id ? (
                                        <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={13} />
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Formulaire création */}
            <form
                action={createAction}
                className="flex flex-col gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800"
                onSubmit={() => setLabel("")}
            >
                <div className="flex gap-2">
                    {(["vacances", "autre"] as CompteType[]).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setType(t)}
                            className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${type === t
                                    ? TYPE_COLORS[t] + " border-current"
                                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300"
                                }`}
                        >
                            {TYPE_LABELS[t]}
                        </button>
                    ))}
                </div>

                <input type="hidden" name="type" value={type} />

                <div className="flex gap-2">
                    <input
                        name="label"
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder={type === "vacances" ? "Ex : Vacances été 2025" : "Ex : Projets maison"}
                        required
                        className="flex-1 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                    />
                    <button
                        type="submit"
                        disabled={isCreating}
                        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors"
                    >
                        {isCreating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                        Ajouter
                    </button>
                </div>

                {createState?.error && (
                    <p className="flex items-center gap-1.5 text-xs text-red-500">
                        <X size={11} />
                        {createState.error}
                    </p>
                )}
            </form>
        </div>
    );
}
