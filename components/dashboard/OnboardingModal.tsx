"use client";

import { useState, useActionState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronRight, Wallet, Target, Shield, PiggyBank } from "lucide-react";
import { updateSettingsAction } from "@/app/actions/user-settings";
import { completeOnboardingAction } from "@/app/actions/user-settings";

interface OnboardingModalProps {
    userName?: string | null;
}

const STEPS = [
    {
        key: "revenuNet",
        icon: Wallet,
        color: "emerald",
        title: "Votre revenu mensuel net",
        desc: "Votre salaire net après impôts. Il nous sert à calculer des suggestions personnalisées.",
        label: "Revenu net mensuel (€)",
        placeholder: "Ex : 2 800",
        name: "revenuNet",
        hint: "Uniquement utilisé pour les suggestions. Reste privé.",
    },
    {
        key: "objectifBase",
        icon: Target,
        color: "blue",
        title: "Votre objectif d'épargne mensuel",
        desc: "Combien souhaitez-vous mettre de côté chaque mois ?",
        label: "Objectif mensuel (€)",
        placeholder: "Ex : 400",
        name: "objectifBase",
        hint: "C'est le montant de base — vous pourrez ajouter des objectifs spéciaux ensuite.",
    },
    {
        key: "fondsSecurite",
        icon: Shield,
        color: "violet",
        title: "Votre matelas de sécurité",
        desc: "Le montant intouchable que vous voulez toujours conserver. Une jauge vous rappellera cette limite.",
        label: "Matelas de sécurité (€)",
        placeholder: "Ex : 5 000",
        name: "fondsSecurite",
        hint: "Un matelas de 3 à 6 mois de charges est généralement recommandé.",
    },
    {
        key: "epargneActuelle",
        icon: PiggyBank,
        color: "rose",
        title: "Votre épargne actuelle",
        desc: "Combien avez-vous déjà mis de côté sur votre compte épargne ?",
        label: "Solde actuel (€)",
        placeholder: "Ex : 2 000",
        name: "epargneActuelle",
        hint: "Indiquez 0 si vous partez de zéro. Ce montant servira de base à vos projections.",
    },
] as const;

const COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    emerald: {
        bg: "bg-emerald-50 dark:bg-emerald-950/20",
        border: "border-emerald-200 dark:border-emerald-800",
        text: "text-emerald-700 dark:text-emerald-300",
        icon: "text-emerald-500",
    },
    blue: {
        bg: "bg-blue-50 dark:bg-blue-950/20",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-700 dark:text-blue-300",
        icon: "text-blue-500",
    },
    violet: {
        bg: "bg-violet-50 dark:bg-violet-950/20",
        border: "border-violet-200 dark:border-violet-800",
        text: "text-violet-700 dark:text-violet-300",
        icon: "text-violet-500",
    },
    rose: {
        bg: "bg-rose-50 dark:bg-rose-950/20",
        border: "border-rose-200 dark:border-rose-800",
        text: "text-rose-700 dark:text-rose-300",
        icon: "text-rose-500",
    },
};

export default function OnboardingModal({ userName }: OnboardingModalProps) {
    const [step, setStep] = useState(0);
    const [values, setValues] = useState<Record<string, string>>({
        revenuNet: "",
        objectifBase: "",
        fondsSecurite: "",
        epargneActuelle: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const current = STEPS[step];
    const c = COLORS[current.color];
    const isLast = step === STEPS.length - 1;

    async function handleNext() {
        // epargneActuelle is optional — empty defaults to 0
        const rawVal = values[current.key];
        const val = current.key === "epargneActuelle" && !rawVal ? 0 : parseFloat(rawVal);
        if (isNaN(val) || val < 0) {
            setError("Veuillez entrer un montant valide.");
            return;
        }
        setError(null);

        if (!isLast) {
            setStep((s) => s + 1);
            return;
        }

        // Final step: save settings then mark onboarding done
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("objectifBase", values.objectifBase || "0");
            fd.append("fondsSecurite", values.fondsSecurite || "0");
            fd.append("epargneActuelle", values.epargneActuelle || "0");
            if (values.revenuNet) fd.append("revenuNet", values.revenuNet);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (updateSettingsAction as any)(null, fd);
            if (result?.error) {
                setError(result.error);
                setSaving(false);
                return;
            }
            await completeOnboardingAction();
            // page will rerender via revalidatePath("/")
        } catch {
            setError("Une erreur est survenue. Veuillez réessayer.");
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.97 }}
                    transition={{ type: "spring", duration: 0.45, bounce: 0.1 }}
                    className="w-full max-w-md mx-4 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden"
                >
                    {/* Progress bar */}
                    <div className="h-1 bg-zinc-100 dark:bg-zinc-800">
                        <motion.div
                            className="h-full bg-zinc-900 dark:bg-white"
                            initial={{ width: `${(step / STEPS.length) * 100}%` }}
                            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>

                    <div className="px-8 py-8">
                        {/* Header (first step only) */}
                        {step === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center text-xl mb-4">
                                    💰
                                </div>
                                <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
                                    Bienvenue{userName ? `, ${userName}` : ""} !
                                </h1>
                                <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                                    Configurons Saveez en 4 étapes rapides.
                                </p>
                            </motion.div>
                        )}

                        {/* Icon + step info */}
                        <div className={`flex items-start gap-4 p-4 rounded-2xl border ${c.bg} ${c.border} mb-6`}>
                            <div className={`mt-0.5 ${c.icon}`}>
                                <current.icon size={20} />
                            </div>
                            <div>
                                <p className={`text-sm font-semibold ${c.text}`}>{current.title}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{current.desc}</p>
                            </div>
                        </div>

                        {/* Input */}
                        <div className="mb-2">
                            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                                {current.label}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={values[current.key]}
                                onChange={(e) => {
                                    setValues((v) => ({ ...v, [current.key]: e.target.value }));
                                    setError(null);
                                }}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNext(); } }}
                                placeholder={current.placeholder}
                                autoFocus
                                className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 text-base text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                            />
                            <p className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">{current.hint}</p>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl mb-3"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* Step indicator + CTA */}
                        <div className="flex items-center justify-between mt-6">
                            <div className="flex gap-1.5">
                                {STEPS.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`rounded-full transition-all ${i === step
                                                ? "w-4 h-1.5 bg-zinc-900 dark:bg-white"
                                                : i < step
                                                    ? "w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600"
                                                    : "w-1.5 h-1.5 bg-zinc-200 dark:bg-zinc-700"
                                            }`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={handleNext}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors"
                            >
                                {saving ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <>
                                        {isLast ? "Commencer" : "Suivant"}
                                        <ChevronRight size={14} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
