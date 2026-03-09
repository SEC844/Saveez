"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getTransactionsCompte } from "@/app/actions/compte";
import { Clock, ArrowDownLeft, ArrowRightLeft } from "lucide-react";
import { motion } from "framer-motion";

interface Transaction {
  id: string;
  type: string;
  montant: number;
  note: string | null;
  createdAt: Date;
  compteSource: { label: string } | null;
  compteDestination: { label: string } | null;
}

interface CompteHistoriqueModalProps {
  compteId: string;
  compteLabel: string;
  trigger: React.ReactNode;
}

export default function CompteHistoriqueModal({ compteId, compteLabel, trigger }: CompteHistoriqueModalProps) {
  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && transactions.length === 0) {
      setLoading(true);
      getTransactionsCompte(compteId)
        .then(setTransactions)
        .finally(() => setLoading(false));
    }
  }, [open, compteId, transactions.length]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white">
            Historique : {compteLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-1 space-y-3 mt-4">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3">Chargement...</p>
            </div>
          )}

          {!loading && transactions.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucune transaction</p>
            </div>
          )}

          {!loading && transactions.map((t) => {
            const isRetrait = t.type === "retrait";
            const isSource = t.compteSource && compteId === t.compteSource.label;
            const montantSign = isRetrait || !isSource ? "-" : "+";
            const montantColor = isRetrait || !isSource
              ? "text-red-600 dark:text-red-400"
              : "text-green-600 dark:text-green-400";

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg">
                      {isRetrait ? (
                        <ArrowDownLeft size={16} className="text-red-600 dark:text-red-400" />
                      ) : (
                        <ArrowRightLeft size={16} className="text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white mb-0.5">
                        {isRetrait ? "Retrait" : "Transfert"}
                      </p>
                      {!isRetrait && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {isSource ? `Vers ${t.compteDestination?.label}` : `De ${t.compteSource?.label}`}
                        </p>
                      )}
                      {t.note && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 truncate">
                          {t.note}
                        </p>
                      )}
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        {new Date(t.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${montantColor}`}>
                      {montantSign} {t.montant.toLocaleString("fr-FR")} €
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
