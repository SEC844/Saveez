"use client";

import { useActionState, useState, useTransition } from "react";
import { confirm2FAAction, disable2FAAction } from "@/app/actions/two-factor";
import { Loader2, CheckCircle, AlertCircle, ShieldCheck, ShieldOff, QrCode, Copy, Check } from "lucide-react";
import Image from "next/image";

const inputCls = "w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all tracking-widest text-center font-mono";

interface TwoFactorCardProps {
  has2FA: boolean;
}

export default function TwoFactorCard({ has2FA }: TwoFactorCardProps) {
  const [step, setStep] = useState<"idle" | "setup" | "confirm" | "disable">("idle");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [isSetupPending, startSetup] = useTransition();

  const [confirmState, confirmAction, isConfirmPending] = useActionState(confirm2FAAction, null);
  const [disableState, disableAction, isDisablePending] = useActionState(disable2FAAction, null);

  function handleSetupClick() {
    startSetup(async () => {
      const res = await fetch("/api/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (data.qrCodeDataUrl) {
        setQrUrl(data.qrCodeDataUrl);
        setSecret(data.secret ?? null);
        setBackupCodes(data.backupCodes ?? null);
        setStep("confirm");
      }
    });
  }

  function handleCopySecret() {
    if (!secret) return;
    navigator.clipboard.writeText(secret).then(() => {
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    });
  }

  if (confirmState?.success && step === "confirm") {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className="text-emerald-500" />
          <div>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">2FA activée avec succès</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Votre compte est maintenant protégé.</p>
          </div>
        </div>
      </div>
    );
  }

  if (disableState?.success && step === "disable") {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Double authentification désactivée.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      <div className="px-6 py-5 flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
          <QrCode size={14} className="text-zinc-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Authentification à deux facteurs</p>
            {has2FA && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck size={10} />Activée
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            {has2FA
              ? "Protège votre compte avec un code temporaire (Google Authenticator, Authy…)"
              : "Ajoutez une couche de sécurité supplémentaire à votre connexion."}
          </p>

          {/* ── État idle ── */}
          {step === "idle" && !has2FA && (
            <button
              type="button"
              onClick={() => { setStep("setup"); handleSetupClick(); }}
              disabled={isSetupPending}
              className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {isSetupPending ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
              Activer la 2FA
            </button>
          )}

          {step === "idle" && has2FA && (
            <button
              type="button"
              onClick={() => setStep("disable")}
              className="inline-flex items-center gap-2 px-4 h-9 rounded-xl border border-red-200 dark:border-red-800 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <ShieldOff size={12} />Désactiver la 2FA
            </button>
          )}

          {/* ── Configuration — affichage QR ── */}
          {step === "setup" && isSetupPending && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Loader2 size={12} className="animate-spin" />Génération du QR code…
            </div>
          )}

          {step === "confirm" && qrUrl && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 items-start">
                <div className="p-3 bg-white rounded-xl border border-zinc-200 dark:border-zinc-700 inline-block">
                  <Image src={qrUrl} alt="QR code 2FA" width={160} height={160} unoptimized />
                </div>
                {secret && (
                  <div className="flex-1 min-w-[180px] space-y-1.5">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Ou saisissez ce code manuellement
                    </p>
                    <div className="flex items-center gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                      <code className="flex-1 text-xs font-mono text-zinc-800 dark:text-zinc-200 break-all tracking-widest">
                        {secret}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        title="Copier le secret"
                      >
                        {secretCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Scannez le QR code avec <strong>Google Authenticator</strong> ou <strong>Authy</strong>,
                puis saisissez le code généré.
              </p>

              {backupCodes && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Codes de secours — notez-les !</p>
                  <div className="grid grid-cols-4 gap-1">
                    {backupCodes.map((c) => (
                      <code key={c} className="text-[11px] font-mono text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-center">{c}</code>
                    ))}
                  </div>
                </div>
              )}

              <form action={confirmAction} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Code de vérification (6 chiffres)</label>
                  <input name="code" type="text" inputMode="numeric" maxLength={6} placeholder="000000" required className={inputCls} />
                </div>
                {confirmState?.error && (
                  <p className="flex items-center gap-1.5 text-xs text-red-500"><AlertCircle size={12} />{confirmState.error}</p>
                )}
                <div className="flex gap-2">
                  <button type="submit" disabled={isConfirmPending}
                    className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium disabled:opacity-50">
                    {isConfirmPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                    Confirmer
                  </button>
                  <button type="button" onClick={() => setStep("idle")}
                    className="px-4 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Désactivation ── */}
          {step === "disable" && (
            <form action={disableAction} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Entrez votre code actuel pour confirmer la désactivation
                </label>
                <input name="code" type="text" inputMode="numeric" maxLength={6} placeholder="000000" required className={inputCls} />
              </div>
              {disableState?.error && (
                <p className="flex items-center gap-1.5 text-xs text-red-500"><AlertCircle size={12} />{disableState.error}</p>
              )}
              <div className="flex gap-2">
                <button type="submit" disabled={isDisablePending}
                  className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {isDisablePending ? <Loader2 size={13} className="animate-spin" /> : <ShieldOff size={13} />}
                  Désactiver
                </button>
                <button type="button" onClick={() => setStep("idle")}
                  className="px-4 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
