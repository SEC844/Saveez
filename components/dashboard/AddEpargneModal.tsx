"use client";

import { useActionState, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { upsertEpargneMensuelleAction } from "@/app/actions/epargne-mensuelle";
import { Plus, Loader2, CheckCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Compte } from "@prisma/client";

const MOIS_LABELS = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];

interface ObjectifDuMoisItem {
  key: string;
  label: string;
  cible: number;
}

interface AddEpargneModalProps {
  comptesActifs: Compte[];
  objectifStandard: number;
  objectifsComptes: Record<string, number>;
  montantImprevu?: number;
}

export default function AddEpargneModal({ comptesActifs, objectifStandard, objectifsComptes, montantImprevu = 0 }: AddEpargneModalProps) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(upsertEpargneMensuelleAction, null);

  const [annee, setAnnee] = useState(now.getFullYear());
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [total, setTotal] = useState("");
  const [note, setNote] = useState("");

  const items: ObjectifDuMoisItem[] = [
    { key: "standard", label: "Objectif mensuel", cible: objectifStandard },
    ...comptesActifs.map((c) => ({
      key: c.id,
      label: c.label,
      cible: objectifsComptes[c.id] ?? 0,
    })),
  ];

  const totalCible = items.reduce((s, it) => s + it.cible, 0);
  const [repartition, setRepartition] = useState<Record<string, string>>({});

  useEffect(() => {
    const t = parseFloat(total);
    if (isNaN(t) || t <= 0) { setRepartition({}); return; }
    const next: Record<string, string> = {};
    let restant = t;
    const specials = items.filter((it) => it.key !== "standard");
    let totalSpecials = 0;
    for (const it of specials) {
      const val = Math.min(it.cible, restant);
      next[it.key] = String(Math.round(val * 100) / 100);
      totalSpecials += val;
      restant -= val;
    }
    const standardVal = Math.max(0, t - totalSpecials);
    next["standard"] = String(Math.round(standardVal * 100) / 100);
    setRepartition(next);
  }, [total]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(() => { setOpen(false); setTotal(""); setNote(""); setRepartition({}); }, 800);
      return () => clearTimeout(t);
    }
  }, [state]);

  const hasComptes = comptesActifs.length > 0;
  const years = [now.getFullYear() - 1, now.getFullYear()];
  const totalNum = parseFloat(total) || 0;
  const totalReparti = Object.values(repartition).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const ecart = Math.round((totalNum - totalReparti) * 100) / 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors">
          <Plus size={15} />
          Saisir un mois
        </motion.button>
      </DialogTrigger>

      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white">{"Saisir l'epargne mensuelle"}</DialogTitle>
        </DialogHeader>

        <form action={action} className="space-y-4 mt-2">
          {/* Mois / Annee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Mois</label>
              <div className="relative">
                <select name="mois" value={mois} onChange={(e) => setMois(Number(e.target.value))}
                  className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 pr-8 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all appearance-none">
                  {MOIS_LABELS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">{"Annee"}</label>
              <div className="relative">
                <select name="annee" value={annee} onChange={(e) => setAnnee(Number(e.target.value))}
                  className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 pr-8 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all appearance-none">
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Montant total */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{"Epargne totale ce mois (€)"}</label>
            {totalCible > 0 && (
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1">
                Objectif global : {totalCible.toLocaleString("fr-FR")} €
              </p>
            )}
            {montantImprevu > 0 && (
              <p className="text-[10px] text-amber-500 mb-1.5">
                + Imprévus en cours : {montantImprevu.toLocaleString("fr-FR")} €
              </p>
            )}
            <input name="montant" type="number" min="0" step="0.01" required value={total} onChange={(e) => setTotal(e.target.value)}
              placeholder="ex: 600"
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all" />
          </div>

          {/* Repartition — visible seulement si comptes actifs et total saisi */}
          {hasComptes && total && parseFloat(total) > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{"Repartition"}</label>
                {Math.abs(ecart) > 0.01 && (
                  <span className={"text-[10px] font-medium " + (ecart > 0 ? "text-emerald-500" : "text-red-400")}>
                    {ecart > 0 ? "+" + ecart.toLocaleString("fr-FR") : ecart.toLocaleString("fr-FR")} € disponible
                  </span>
                )}
              </div>
              {items.map((it) => (
                <div key={it.key} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate">{it.label}</p>
                    {it.cible > 0 && <p className="text-[10px] text-zinc-400">cible : {it.cible.toLocaleString("fr-FR")} €</p>}
                  </div>
                  <input name={"repartition_" + it.key} type="number" min="0" step="0.01"
                    value={repartition[it.key] ?? ""}
                    onChange={(e) => setRepartition((prev) => ({ ...prev, [it.key]: e.target.value }))}
                    className="w-24 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 text-xs text-right text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all" />
                </div>
              ))}
            </motion.div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Note <span className="text-zinc-300 font-normal">(optionnel)</span></label>
            <input name="note" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex: Prime recue ce mois"
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all" />
          </div>

          <AnimatePresence>
            {state?.error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-red-500">{state.error}</motion.p>
            )}
          </AnimatePresence>

          <motion.button type="submit" disabled={isPending || ecart < -0.01} whileTap={{ scale: 0.97 }}
            className="w-full h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : state?.success ? <CheckCircle size={14} /> : <Plus size={14} />}
            {state?.success ? "Enregistre !" : "Enregistrer"}
          </motion.button>
        </form>
      </DialogContent>
    </Dialog>
  );
}