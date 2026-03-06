"use client";

import { motion } from "framer-motion";
import type { Imprevu } from "@prisma/client";
import { getProgressionImprevu } from "@/lib/epargne";
import { CheckCircle2, Trash2 } from "lucide-react";
import { deleteImprevuAction } from "@/app/actions/imprevu";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ImprevuProgressCardProps {
  imprevu: Imprevu;
  delay?: number;
  onDeleted?: () => void;
}

export default function ImprevuProgressCard({ imprevu, delay = 0, onDeleted }: ImprevuProgressCardProps) {
  const pct = getProgressionImprevu(imprevu);
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleDelete() {
    setDeleting(true);
    startTransition(async () => {
      await deleteImprevuAction(imprevu.id);
      onDeleted?.();
    });
  }

  const moisRestants = imprevu.dureeRemboursement - Math.floor(imprevu.montantRembourse / imprevu.montantMensuel);

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Supprimer "${imprevu.nom}" ?`}
        description="L'imprévu sera définitivement supprimé. Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
        loading={isPending}
        onConfirm={handleDelete}
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: deleting ? 0 : 1, y: 0 }}
        transition={{ duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                {imprevu.nom}
              </p>
              {imprevu.estSolde && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-medium">
                  <CheckCircle2 size={12} />
                  Soldé
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              {imprevu.montantMensuel.toLocaleString("fr-FR")} €/mois · {imprevu.montantTotal.toLocaleString("fr-FR")} € total
            </p>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={isPending}
            className="ml-3 p-1.5 rounded-lg text-zinc-300 dark:text-zinc-700 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, delay: delay + 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
              "h-full rounded-full",
              pct >= 100 ? "bg-emerald-500" : "bg-zinc-900 dark:bg-white"
            )}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <p className="text-zinc-400 dark:text-zinc-500">
            {imprevu.montantRembourse.toLocaleString("fr-FR")} € remboursé
          </p>
          <p className={cn(
            "font-medium",
            pct >= 100 ? "text-emerald-500" : "text-zinc-500 dark:text-zinc-400"
          )}>
            {pct >= 100 ? "100 %" : `${pct.toFixed(0)} % · ${moisRestants}m restants`}
          </p>
        </div>
      </motion.div>
    </>
  );
}
