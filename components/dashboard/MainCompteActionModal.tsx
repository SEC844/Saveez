"use client";

import { useActionState, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  retraitEpargneStandardAction,
  transfertDepuisEpargneAction,
} from "@/app/actions/epargne-standard";
import { ArrowDownLeft, ArrowRightLeft, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { Compte } from "@prisma/client";

interface MainCompteActionModalProps {
  epargneActuelle: number;
  autresComptes: Compte[];
  trigger: React.ReactNode;
}

export default function MainCompteActionModal({
  epargneActuelle,
  autresComptes,
  trigger,
}: MainCompteActionModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"retrait" | "transfert">("retrait");
  const [montant, setMontant] = useState("");
  const [note, setNote] = useState("");

  const [stateRetrait, actionRetrait, isPendingRetrait] = useActionState(
    retraitEpargneStandardAction,
    null
  );
  const [stateTransfert, actionTransfert, isPendingTransfert] = useActionState(
    transfertDepuisEpargneAction,
    null
  );

  const state = mode === "retrait" ? stateRetrait : stateTransfert;
  const isPending = isPendingRetrait || isPendingTransfert;

  function reset() {
    setMontant("");
    setNote("");
    setMode("retrait");
  }

  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(() => {
        setOpen(false);
        reset();
      }, 800);
      return () => clearTimeout(t);
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const comptesActifs = autresComptes.filter((c) => c.actif);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white">
            Compte Principal
          </DialogTitle>
        </DialogHeader>

        {/* Sélection mode */}
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => setMode("retrait")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
              mode === "retrait"
                ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-500 text-zinc-900 dark:text-white"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300"
            }`}
          >
            <ArrowDownLeft size={16} />
            Dépense
          </button>
          <button
            type="button"
            onClick={() => setMode("transfert")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
              mode === "transfert"
                ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-500 text-zinc-900 dark:text-white"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300"
            }`}
          >
            <ArrowRightLeft size={16} />
            Transférer
          </button>
        </div>

        <form
          action={mode === "retrait" ? actionRetrait : actionTransfert}
          className="space-y-4 mt-4"
        >
          {/* Compte destination si transfert */}
          {mode === "transfert" && (
            <div>
              {comptesActifs.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Aucun compte spécial actif disponible.
                </p>
              ) : (
                <>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Vers le compte
                  </label>
                  <select
                    name="compteDestinationId"
                    defaultValue={comptesActifs[0]?.id}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  >
                    {comptesActifs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} ({c.solde.toLocaleString("fr-FR")} €)
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          )}

          {/* Montant */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Montant (€)
            </label>
            <input
              name="montant"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              required
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Disponible : {epargneActuelle.toLocaleString("fr-FR")} €
            </p>
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Commentaire <span className="text-zinc-400">(optionnel)</span>
            </label>
            <textarea
              name="note"
              rows={2}
              placeholder="Ex: Loyer juillet"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
            />
          </div>

          {/* Erreur */}
          {state?.error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
            </div>
          )}

          {/* Succès */}
          {state?.success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            >
              <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
              <p className="text-xs text-green-600 dark:text-green-400">
                {mode === "retrait" ? "Dépense enregistrée !" : "Transfert effectué !"}
              </p>
            </motion.div>
          )}

          {!state?.success && (
            <button
              type="submit"
              disabled={isPending || (mode === "transfert" && comptesActifs.length === 0)}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <><Loader2 size={16} className="animate-spin" />En cours…</>
              ) : mode === "retrait" ? (
                "Enregistrer la dépense"
              ) : (
                "Effectuer le transfert"
              )}
            </button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
