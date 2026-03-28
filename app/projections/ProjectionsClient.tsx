"use client";

import { useMemo, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";
import {
  TrendingUp,
  Target,
  Calendar,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompteInfo {
  id: string;
  label: string;
  couleur: string;
  type: string;
}

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
  standardAllocation: number | null;
  compteAllocations: Record<string, number>;
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
  comptes: CompteInfo[];
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatEuro(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

// ─── Tooltip personnalisé ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, comptes }: any) {
  if (!active || !payload?.length) return null;

  const compteMap = new Map<string, CompteInfo>(
    (comptes ?? []).map((c: CompteInfo) => [c.id, c])
  );

  const labelMap: Record<string, string> = {
    reel: "Réel",
    objectifStandard: "Standard",
    objectifVacances: "Vacances",
    objectifAutre: "Autre",
    remboursements: "Remboursements",
    cumReel: "Réel / Projeté",
    cumObjectif: "Objectif",
    standard: "Compte Principal",
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-700 rounded-xl px-3 py-2.5 shadow-md text-xs min-w-[140px]">
      <p className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
        {label}
      </p>
      {payload
        .filter((p: { name: string; value: number }) => {
          if (
            (p.name === "objectifVacances" || p.name === "objectifAutre") &&
            (p.value ?? 0) === 0
          )
            return false;
          if (p.value === null || p.value === undefined) return false;
          return true;
        })
        .map((p: { name: string; value: number; color: string }) => {
          const displayLabel =
            compteMap.get(p.name)?.label ??
            labelMap[p.name] ??
            p.name;
          return (
            <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-3">
              <span>{displayLabel}</span>
              <span className="font-medium">{formatEuro(p.value)}</span>
            </p>
          );
        })}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ProjectionsClient({
  graphData,
  projection,
  epargneActuelle,
  comptes,
}: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === "dark" : false;

  const colors = {
    grid: isDark ? "#27272a" : "#f4f4f5",
    text: isDark ? "#a1a1aa" : "#71717a",
    reel: isDark ? "#ffffff" : "#18181b",
    objectif: isDark ? "#52525b" : "#d4d4d8",
    standard: isDark ? "#52525b" : "#d4d4d8",
  };

  const now = new Date();
  const currentMois = now.getMonth() + 1;
  const currentAnnee = now.getFullYear();

  // ── Données : courbe cumulative globale ─────────────────────────────────────
  const fullYearData = useMemo(() => {
    let cumR = epargneActuelle;
    let cumO = epargneActuelle;
    return graphData.map((d) => {
      const isFuture =
        d.annee > currentAnnee ||
        (d.annee === currentAnnee && d.mois > currentMois);
      const objectifMois = d.objectif;
      if (!isFuture && d.reel !== null) {
        cumR += d.reel;
        cumO += objectifMois;
        return {
          mois: d.label,
          cumReel: cumR,
          cumObjectif: cumO,
          isFuture: false,
        };
      } else {
        cumO += objectifMois;
        const projectedR = cumR + objectifMois;
        if (!isFuture)
          return {
            mois: d.label,
            cumReel: null,
            cumObjectif: cumO,
            isFuture: false,
          };
        return {
          mois: d.label,
          cumReel: projectedR,
          cumObjectif: cumO,
          isFuture: true,
        };
      }
    });
  }, [graphData, epargneActuelle, currentMois, currentAnnee]);

  // ── Données : graphe mensuel standard ───────────────────────────────────────
  const annuelle = graphData.map((d) => ({
    mois: d.label,
    reel: d.reel,
    objectif: d.objectif,
    objectifStandard: d.objectifStandard,
    objectifVacances: d.objectifVacances,
    objectifAutre: d.objectifAutre,
    remboursements: d.remboursements,
  }));

  // ── Données : allocations par compte ────────────────────────────────────────
  const compteMap = useMemo(
    () => new Map(comptes.map((c) => [c.id, c])),
    [comptes]
  );

  // Identifier quels comptes ont des données dans l'historique
  const comptesAvecDonnees = useMemo(() => {
    const ids = new Set<string>();
    for (const d of graphData) {
      for (const id of Object.keys(d.compteAllocations)) {
        if (d.compteAllocations[id] > 0) ids.add(id);
      }
      // Si standardAllocation est non-null, le compte principal a des données
    }
    return comptes.filter((c) => ids.has(c.id));
  }, [graphData, comptes]);

  const hasStandardData = useMemo(
    () => graphData.some((d) => d.standardAllocation !== null && d.standardAllocation > 0),
    [graphData]
  );

  const showCompteChart =
    (comptesAvecDonnees.length > 0 || hasStandardData) &&
    comptes.length > 0;

  // Données pour le graphique par compte (mensuel stacked)
  const compteMonthlyData = useMemo(() => {
    return graphData.map((d) => {
      const row: Record<string, string | number | null> = {
        mois: d.label,
        standard: d.standardAllocation,
      };
      for (const c of comptesAvecDonnees) {
        row[c.id] = d.compteAllocations[c.id] ?? 0;
      }
      return row;
    });
  }, [graphData, comptesAvecDonnees]);

  // Données pour le graphique cumulatif par compte
  const compteCumData = useMemo(() => {
    const cumuls: Record<string, number> = { standard: 0 };
    for (const c of comptesAvecDonnees) cumuls[c.id] = 0;

    return graphData.map((d) => {
      const row: Record<string, string | number> = { mois: d.label };
      if (d.standardAllocation !== null) {
        cumuls["standard"] += d.standardAllocation;
      }
      row["standard"] = cumuls["standard"];
      for (const c of comptesAvecDonnees) {
        cumuls[c.id] += d.compteAllocations[c.id] ?? 0;
        row[c.id] = cumuls[c.id];
      }
      return row;
    });
  }, [graphData, comptesAvecDonnees]);

  if (!mounted) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        <div className="h-64 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </div>
    );
  }

  const hasSurplus = annuelle.some(
    (d) => d.reel !== null && d.objectif !== null && d.reel! > d.objectif
  );
  const hasDeficit = annuelle.some(
    (d) => d.reel !== null && d.objectif !== null && d.reel! < d.objectif
  );

  return (
    <div className="space-y-8">
      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
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
            value: formatEuro(
              projection.totalEpargnéCetteAnnee + epargneActuelle
            ),
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
            value: hasDeficit
              ? "⚠ Déficit"
              : hasSurplus
              ? "✓ Bonus"
              : "Aucune donnée",
            sub: hasDeficit
              ? "Des mois sous objectif"
              : "Tous les mois dans l'objectif",
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
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {card.label}
              </span>
            </div>
            <p className="text-xl font-semibold text-zinc-900 dark:text-white">
              {card.value}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              {card.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Cumul projeté global ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6"
      >
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
          Épargne cumulée — Projection annuelle
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5">
          La courbe pointillée représente la projection des mois à venir
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={fullYearData}
            margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradCumReel" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={colors.reel}
                  stopOpacity={0.12}
                />
                <stop
                  offset="95%"
                  stopColor={colors.reel}
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="gradCumObj" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={colors.objectif}
                  stopOpacity={0.12}
                />
                <stop
                  offset="95%"
                  stopColor={colors.objectif}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke={colors.grid}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="mois"
              tick={{ fontSize: 11, fill: colors.text }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: colors.text }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
            />
            <Tooltip content={<CustomTooltip comptes={comptes} />} />
            <Legend
              formatter={(v) =>
                v === "cumReel" ? "Réel / Projeté" : "Objectif"
              }
              wrapperStyle={{ fontSize: 11 }}
            />
            <ReferenceLine y={0} stroke={colors.grid} />
            <Area
              type="monotone"
              dataKey="cumObjectif"
              name="cumObjectif"
              stroke={colors.objectif}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#gradCumObj)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="cumReel"
              name="cumReel"
              stroke={colors.reel}
              strokeWidth={2}
              fill="url(#gradCumReel)"
              dot={false}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Répartition par compte (si plusieurs comptes actifs) ─────────────── */}
      {showCompteChart && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <Layers size={14} className="text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Répartition par compte — Cumul annuel
            </h3>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5">
            Évolution du cumul épargné sur chaque compte
          </p>

          {/* Légende */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
            {hasStandardData && (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span
                  style={{
                    background: colors.standard,
                    width: 10,
                    height: 10,
                    display: "inline-block",
                    borderRadius: 2,
                  }}
                />
                Compte Principal
              </div>
            )}
            {comptesAvecDonnees.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400"
              >
                <span
                  style={{
                    background: c.couleur,
                    width: 10,
                    height: 10,
                    display: "inline-block",
                    borderRadius: 2,
                  }}
                />
                {c.label}
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={compteCumData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                {hasStandardData && (
                  <linearGradient
                    id="gradStd"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={colors.standard}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={colors.standard}
                      stopOpacity={0}
                    />
                  </linearGradient>
                )}
                {comptesAvecDonnees.map((c) => (
                  <linearGradient
                    key={c.id}
                    id={`grad-${c.id}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={c.couleur}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={c.couleur}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                stroke={colors.grid}
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="mois"
                tick={{ fontSize: 11, fill: colors.text }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: colors.text }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k€` : `${v}€`
                }
              />
              <Tooltip content={<CustomTooltip comptes={comptes} />} />
              {hasStandardData && (
                <Area
                  type="monotone"
                  dataKey="standard"
                  name="standard"
                  stroke={colors.standard}
                  strokeWidth={2}
                  fill="url(#gradStd)"
                  dot={false}
                  connectNulls
                />
              )}
              {comptesAvecDonnees.map((c) => (
                <Area
                  key={c.id}
                  type="monotone"
                  dataKey={c.id}
                  name={c.id}
                  stroke={c.couleur}
                  strokeWidth={2}
                  fill={`url(#grad-${c.id})`}
                  dot={false}
                  connectNulls
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Mensuel : réel vs objectif ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6"
      >
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
          Réel vs Objectif — Par mois
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
          Comparaison mois par mois (objectif décomposé par catégorie)
        </p>

        {/* Légende */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
          {(
            [
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
            ] as { label: string; color: string }[]
          ).map(({ label, color }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400"
            >
              <span
                style={{
                  background: color,
                  width: 10,
                  height: 10,
                  display: "inline-block",
                  borderRadius: 2,
                }}
              />
              {label}
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={annuelle}
            margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              stroke={colors.grid}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="mois"
              tick={{ fontSize: 11, fill: colors.text }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: colors.text }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}€`}
            />
            <Tooltip content={<CustomTooltip comptes={comptes} />} />
            {/* Stacked objectif bars */}
            <Bar
              dataKey="objectifStandard"
              name="objectifStandard"
              stackId="obj"
              fill={isDark ? "#52525b" : "#d4d4d8"}
              maxBarSize={28}
            />
            <Bar
              dataKey="objectifVacances"
              name="objectifVacances"
              stackId="obj"
              fill="#f59e0b"
              maxBarSize={28}
            />
            <Bar
              dataKey="objectifAutre"
              name="objectifAutre"
              stackId="obj"
              fill="#8b5cf6"
              maxBarSize={28}
            />
            <Bar
              dataKey="remboursements"
              name="remboursements"
              stackId="obj"
              fill="#f87171"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            {/* Réel */}
            <Bar
              dataKey="reel"
              name="reel"
              fill={colors.reel}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Mensuel : allocation par compte (si données disponibles) ──────────── */}
      {showCompteChart && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <Layers size={14} className="text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Allocation mensuelle par compte
            </h3>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
            Montant réellement alloué à chaque compte ce mois-ci
          </p>

          {/* Légende */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
            {hasStandardData && (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span
                  style={{
                    background: colors.standard,
                    width: 10,
                    height: 10,
                    display: "inline-block",
                    borderRadius: 2,
                  }}
                />
                Compte Principal
              </div>
            )}
            {comptesAvecDonnees.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400"
              >
                <span
                  style={{
                    background: c.couleur,
                    width: 10,
                    height: 10,
                    display: "inline-block",
                    borderRadius: 2,
                  }}
                />
                {c.label}
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={compteMonthlyData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                stroke={colors.grid}
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="mois"
                tick={{ fontSize: 11, fill: colors.text }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: colors.text }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}€`}
              />
              <Tooltip content={<CustomTooltip comptes={comptes} />} />
              {hasStandardData && (
                <Bar
                  dataKey="standard"
                  name="standard"
                  stackId="alloc"
                  fill={colors.standard}
                  maxBarSize={28}
                />
              )}
              {comptesAvecDonnees.map((c, idx) => {
                const isLast = idx === comptesAvecDonnees.length - 1;
                return (
                  <Bar
                    key={c.id}
                    dataKey={c.id}
                    name={c.id}
                    stackId="alloc"
                    fill={c.couleur}
                    radius={isLast ? [4, 4, 0, 0] : undefined}
                    maxBarSize={28}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Message si pas de comptes actifs */}
      {comptes.length === 0 && (
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 py-2">
          Créez des comptes spéciaux pour visualiser la répartition par compte.
        </p>
      )}
    </div>
  );
}
