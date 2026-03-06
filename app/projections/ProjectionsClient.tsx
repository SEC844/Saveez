"use client";

import { useMemo, useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { TrendingUp, Target, Calendar, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface GraphPoint {
  label: string;
  annee: number;
  mois: number;
  reel: number | null;
  objectif: number;
  objectifStandard: number;
  objectifVacances: number;
  objectifAutre: number;
  remboursements: number;
}

interface Props {
  graphData: GraphPoint[];
  projection: {
    projectionFinAnnee: number;
    totalEpargnéCetteAnnee: number;
    moisBonis: number;
    moisDeficit: number;
    moisRestants: number;
    objectifMensuelDynamique: number;
  };
  epargneActuelle: number;
}

function formatEuro(v: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const labels: Record<string, string> = {
    reel: "Réel",
    objectifStandard: "Standard",
    objectifVacances: "🏖 Vacances",
    objectifAutre: "📌 Autre",
    remboursements: "Remboursements",
    cumReel: "Réel / Projeté",
    cumObjectif: "Objectif",
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-700 rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} style={{ color: p.color }}>
          {labels[p.name] ?? p.name}: {formatEuro(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function ProjectionsClient({ graphData, projection, epargneActuelle }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === "dark" : false;

  const colors = {
    grid: isDark ? "#27272a" : "#f4f4f5",
    text: isDark ? "#a1a1aa" : "#71717a",
    reel: isDark ? "#ffffff" : "#18181b",
    objectif: isDark ? "#52525b" : "#d4d4d8",
  };

  const now = new Date();
  const currentMois = now.getMonth() + 1;
  const currentAnnee = now.getFullYear();

  // ⚠️ useMemo MUST be before any conditional return (Rules of Hooks)
  const fullYearData = useMemo(() => {
    let cumR = epargneActuelle;
    let cumO = epargneActuelle;
    return graphData.map((d) => {
      const isFuture = d.annee > currentAnnee || (d.annee === currentAnnee && d.mois > currentMois);
      const objectifMois = d.objectif;
      if (!isFuture && d.reel !== null) {
        cumR += d.reel;
        cumO += objectifMois;
        return { mois: d.label, cumReel: cumR, cumObjectif: cumO, isFuture: false };
      } else {
        cumO += objectifMois;
        const projectedR = cumR + objectifMois;
        if (!isFuture) return { mois: d.label, cumReel: null, cumObjectif: cumO, isFuture: false };
        return { mois: d.label, cumReel: projectedR, cumObjectif: cumO, isFuture: true };
      }
    });
  }, [graphData, epargneActuelle, currentMois, currentAnnee]);

  const annuelle = graphData.map((d) => ({
    mois: d.label,
    reel: d.reel,
    objectif: d.objectif,
    objectifStandard: d.objectifStandard,
    objectifVacances: d.objectifVacances,
    objectifAutre: d.objectifAutre,
    remboursements: d.remboursements,
  }));

  if (!mounted) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        <div className="h-64 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </div>
    );
  }

  const hasSurplus = annuelle.some((d) => d.reel !== null && d.objectif !== null && d.reel! > d.objectif);
  const hasDeficit = annuelle.some((d) => d.reel !== null && d.objectif !== null && d.reel! < d.objectif);

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Target,
            label: "Projection fin d'année",
            value: formatEuro(projection.projectionFinAnnee),
            sub: `sur la base de ${formatEuro(projection.objectifMensuelDynamique)}/mois`,
          },
          {
            icon: TrendingUp,
            label: "Épargne cumulée",
            value: formatEuro(projection.totalEpargnéCetteAnnee + epargneActuelle),
            sub: `dont ${formatEuro(epargneActuelle)} de départ`,
          },
          {
            icon: Calendar,
            label: "Mois restants",
            value: `${projection.moisRestants}`,
            sub: "avant la fin de l'année",
          },
          {
            icon: AlertTriangle,
            label: "Statut",
            value: hasDeficit ? "⚠ Déficit" : hasSurplus ? "✓ Bonus" : "Aucune donnée",
            sub: hasDeficit ? "Des mois sous objectif" : "Tous les mois dans l'objectif",
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <card.icon size={14} className="text-zinc-400" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{card.label}</span>
            </div>
            <p className="text-xl font-semibold text-zinc-900 dark:text-white">{card.value}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Cumul projeté */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6"
      >
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Épargne cumulée — Projection annuelle</h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5">La courbe pointillée représente la projection des mois à venir</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={fullYearData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCumReel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.reel} stopOpacity={0.12} />
                <stop offset="95%" stopColor={colors.reel} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCumObj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.objectif} stopOpacity={0.12} />
                <stop offset="95%" stopColor={colors.objectif} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mois" tick={{ fontSize: 11, fill: colors.text }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: colors.text }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => v === "cumReel" ? "Réel / Projeté" : "Objectif"} wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke={colors.grid} />
            <Area type="monotone" dataKey="cumObjectif" name="cumObjectif" stroke={colors.objectif}
              strokeWidth={1.5} strokeDasharray="4 4" fill="url(#gradCumObj)" dot={false} />
            <Area type="monotone" dataKey="cumReel" name="cumReel" stroke={colors.reel}
              strokeWidth={2} fill="url(#gradCumReel)" dot={false} connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Mensuel */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6"
      >
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Réel vs Objectif — Par mois</h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5">Comparaison mois par mois sur l&apos;année (objectif décomposé par catégorie)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={annuelle} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mois" tick={{ fontSize: 11, fill: colors.text }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: colors.text }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `${v}€`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              content={() => {
                const entries = [
                  { label: "Réel", color: colors.reel },
                  { label: "Standard", color: isDark ? "#52525b" : "#d4d4d8" },
                  ...(annuelle.some((d) => d.objectifVacances > 0)
                    ? [{ label: "Vacances", color: "#f59e0b" }]
                    : []),
                  ...(annuelle.some((d) => d.objectifAutre > 0)
                    ? [{ label: "Autre", color: "#8b5cf6" }]
                    : []),
                  ...(annuelle.some((d) => d.remboursements > 0)
                    ? [{ label: "Remboursements", color: "#f87171" }]
                    : []),
                ];
                return (
                  <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2">
                    {entries.map(({ label, color }) => (
                      <li key={label} className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span style={{ background: color, width: 10, height: 10, display: "inline-block", borderRadius: 2, flexShrink: 0 }} />
                        {label}
                      </li>
                    ))}
                  </ul>
                );
              }}
            />
            {/* Stacked objectif bars */}
            <Bar dataKey="objectifStandard" name="objectifStandard" stackId="obj" fill={isDark ? "#52525b" : "#d4d4d8"} maxBarSize={28} />
            <Bar dataKey="objectifVacances" name="objectifVacances" stackId="obj" fill="#f59e0b" maxBarSize={28} />
            <Bar dataKey="objectifAutre" name="objectifAutre" stackId="obj" fill="#8b5cf6" maxBarSize={28} />
            <Bar dataKey="remboursements" name="remboursements" stackId="obj" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={28} />
            {/* Réel */}
            <Bar dataKey="reel" name="reel" fill={colors.reel} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
