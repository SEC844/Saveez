"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Plane, Star, PiggyBank, Activity, History, Plus, ChevronDown, MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import AddCompteModal from "@/components/dashboard/AddCompteModal";
import EditCompteModal from "@/components/dashboard/EditCompteModal";
import CompteActionModal from "@/components/dashboard/CompteActionModal";
import CompteHistoriqueModal from "@/components/dashboard/CompteHistoriqueModal";
import { toggleCompteAction, deleteCompteAction } from "@/app/actions/compte";
import type { Compte } from "@prisma/client";

type Props = {
  comptes: Compte[];
  epargneStandard: number;
  soldeComptesInactifs: number;
};

const ICONS = {
  vacances: Plane,
  autre: Star,
};

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 139, g: 92, b: 246 };
}

// --- Dropdown "Nouveau compte" ---
function NewCompteDropdown() {
  const [dropOpen, setDropOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<"vacances" | "autre">("vacances");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function choose(type: "vacances" | "autre") {
    setSelectedType(type);
    setDropOpen(false);
    setModalOpen(true);
  }

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setDropOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
      >
        <Plus size={15} />
        Nouveau compte
        <ChevronDown size={13} className={`transition-transform ${dropOpen ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {dropOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl z-50 overflow-hidden"
          >
            <button
              onClick={() => choose("vacances")}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Plane size={14} className="text-amber-500" />
              Vacances
            </button>
            <div className="border-t border-zinc-100 dark:border-zinc-800" />
            <button
              onClick={() => choose("autre")}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Star size={14} className="text-violet-500" />
              Autre
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AddCompteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultType={selectedType}
      />
    </div>
  );
}

// --- Menu 3 points d'un compte ---
function CompteMenu({ compte }: { compte: Compte }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [toggling, startToggle] = useTransition();
  const [deleting, startDelete] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleToggle() {
    setMenuOpen(false);
    startToggle(async () => {
      await toggleCompteAction(compte.id);
    });
  }

  function handleDelete() {
    setMenuOpen(false);
    startDelete(async () => {
      await deleteCompteAction(compte.id);
    });
  }

  // Règle : si solde = 0 → proposer suppression ; sinon activer/désactiver
  const canDelete = compte.solde === 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Options"
      >
        <MoreHorizontal size={16} />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl z-50 overflow-hidden"
          >
            <button
              onClick={() => { setMenuOpen(false); setEditOpen(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Pencil size={13} />
              Modifier
            </button>
            <div className="border-t border-zinc-100 dark:border-zinc-800" />

            {canDelete ? (
              // Compte à 0€ → proposer suppression
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <Trash2 size={13} className="text-red-500" />
                <span className="text-red-600 dark:text-red-400">Supprimer</span>
              </button>
            ) : (
              // Compte avec solde → activer / désactiver
              <button
                onClick={handleToggle}
                disabled={toggling}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <Power size={13} className={compte.actif ? "text-red-500" : "text-emerald-500"} />
                <span className={compte.actif ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
                  {compte.actif ? "Desactiver" : "Activer"}
                </span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <EditCompteModal
        compte={compte}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}

export default function ComptesClient({ comptes, epargneStandard, soldeComptesInactifs }: Props) {
  const comptesActifs = comptes.filter((c) => c.actif);
  const comptesInactifs = comptes.filter((c) => !c.actif);
  const totalComptesActifs = comptesActifs.reduce((sum, c) => sum + c.solde, 0);
  const total = epargneStandard + totalComptesActifs + soldeComptesInactifs;
  const [showInactifs, setShowInactifs] = useState(false);

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Mes Comptes
          </h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
            Vue d&apos;ensemble de vos soldes par compte
          </p>
        </div>
        <NewCompteDropdown />
      </div>

      {/* Epargne Standard */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-200 dark:border-blue-900 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/50 dark:bg-zinc-900/50 rounded-xl">
              <PiggyBank className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Epargne Standard</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                {epargneStandard.toLocaleString("fr-FR")} €
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Solde principal de votre epargne</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Comptes inactifs — banniere avec bouton Afficher */}
      {comptesInactifs.length > 0 && (
        <Card className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {soldeComptesInactifs > 0 && (
                <><span className="font-medium">{soldeComptesInactifs.toLocaleString("fr-FR")} €</span> présent sur{" "}</>
              )}
              <span className="font-medium">{comptesInactifs.length}</span> compte{comptesInactifs.length > 1 ? "s" : ""} désactivé{comptesInactifs.length > 1 ? "s" : ""}.
            </p>
            <button
              onClick={() => setShowInactifs((v) => !v)}
              className="flex-shrink-0 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showInactifs ? "Masquer" : "Afficher"}
            </button>
          </div>
        </Card>
      )}

      {/* Comptes speciaux actifs */}
      {comptesActifs.length > 0 && (
        <>
          <div className="pt-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight mb-4">
              Comptes Speciaux
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comptesActifs.map((compte, index) => {
              const Icon = ICONS[compte.type as keyof typeof ICONS] || Star;
              const rgb = hexToRgb(compte.couleur || "#8B5CF6");
              const isNegative = compte.solde < 0;
              const isZero = compte.solde === 0;
              const autresComptesActifs = comptesActifs.filter((c) => c.id !== compte.id);

              return (
                <motion.div
                  key={compte.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                >
                  <Card
                    className="p-5 border transition-all hover:shadow-md"
                    style={{
                      background: `linear-gradient(135deg, rgba(${rgb.r},${rgb.g},${rgb.b},0.1) 0%, rgba(${rgb.r},${rgb.g},${rgb.b},0.05) 100%)`,
                      borderColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)` }}>
                          <Icon className="w-5 h-5" style={{ color: compte.couleur }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{compte.label}</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 capitalize">{compte.type}</p>
                        </div>
                      </div>
                      {/* Menu 3 points */}
                      <CompteMenu compte={compte} />
                    </div>

                    {/* Solde */}
                    <div className="mt-2">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Solde</p>
                      <p className={`text-2xl font-bold tracking-tight ${
                        isNegative ? "text-red-600 dark:text-red-400"
                          : isZero ? "text-zinc-400 dark:text-zinc-500"
                          : "text-zinc-900 dark:text-white"
                      }`}>
                        {compte.solde >= 0 ? "" : "-"}{Math.abs(compte.solde).toLocaleString("fr-FR")} €
                      </p>
                    </div>

                    {/* Barre de progression */}
                    {total > 0 && compte.solde > 0 && (
                      <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-700/50">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-zinc-500 dark:text-zinc-400">Part du total</span>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {((compte.solde / total) * 100).toFixed(1)} %
                          </span>
                        </div>
                        <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(compte.solde / total) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + index * 0.05 }}
                            className="h-full"
                            style={{ background: `linear-gradient(90deg, ${compte.couleur}, ${compte.couleur}dd)` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Boutons Action et Historique */}
                    <div className="mt-4 flex gap-2">
                      <CompteActionModal
                        compte={compte}
                        autresComptes={autresComptesActifs}
                        trigger={
                          <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
                            <Activity size={14} />
                            Action
                          </button>
                        }
                      />
                      <CompteHistoriqueModal
                        compteId={compte.id}
                        compteLabel={compte.label}
                        trigger={
                          <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
                            <History size={14} />
                            Historique
                          </button>
                        }
                      />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Vide */}
      {comptesActifs.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="p-8 text-center bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <Wallet className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">Aucun compte special cree</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              Cliquez sur &quot;Nouveau compte&quot; pour commencer.
            </p>
          </Card>
        </motion.div>
      )}

      {/* Comptes désactivés — visibles via le bouton "Afficher" */}
      <AnimatePresence>
        {showInactifs && comptesInactifs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 overflow-hidden"
          >
            <div className="pt-2">
              <h2 className="text-lg font-semibold text-zinc-400 dark:text-zinc-500 tracking-tight mb-4">
                Comptes Désactivés
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comptesInactifs.map((compte, index) => {
                const Icon = ICONS[compte.type as keyof typeof ICONS] || Star;
                const rgb = hexToRgb(compte.couleur || "#8B5CF6");

                return (
                  <motion.div
                    key={compte.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      className="p-5 border opacity-60 transition-all"
                      style={{
                        background: `linear-gradient(135deg, rgba(${rgb.r},${rgb.g},${rgb.b},0.06) 0%, rgba(${rgb.r},${rgb.g},${rgb.b},0.03) 100%)`,
                        borderColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.1)` }}>
                            <Icon className="w-5 h-5" style={{ color: compte.couleur }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{compte.label}</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">Désactivé · {compte.type}</p>
                          </div>
                        </div>
                        <CompteMenu compte={compte} />
                      </div>

                      <div className="mt-2">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Solde</p>
                        <p className="text-2xl font-bold tracking-tight text-zinc-400 dark:text-zinc-500">
                          {compte.solde.toLocaleString("fr-FR")} €
                        </p>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <CompteHistoriqueModal
                          compteId={compte.id}
                          compteLabel={compte.label}
                          trigger={
                            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
                              <History size={14} />
                              Historique
                            </button>
                          }
                        />
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
