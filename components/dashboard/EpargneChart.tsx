"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface DataPoint {
  label: string;
  reel: number | null;
  objectif: number;
}

interface EpargneChartProps {
  data: DataPoint[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-700 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-2">{label}</p>
      {payload.map((p: { name: string; value: number | null; color: string }) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-zinc-500 dark:text-zinc-400">
            {p.name === "reel" ? "Réel" : "Objectif"} :
          </span>
          <span className="font-medium text-zinc-900 dark:text-white">
            {p.value != null ? `${p.value.toLocaleString("fr-FR")} €` : "–"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function EpargneChart({ data }: EpargneChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === "dark" : false;

  const gridColor = isDark ? "#27272a" : "#f4f4f5";
  const axisColor = isDark ? "#52525b" : "#d4d4d8";
  const tickColor = isDark ? "#71717a" : "#a1a1aa";

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
        <div className="h-[220px] rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Évolution de l&apos;épargne
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            12 derniers mois — réel vs objectif
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full bg-zinc-900 dark:bg-white" />
            <span className="text-zinc-500 dark:text-zinc-400">Réel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <span className="text-zinc-500 dark:text-zinc-400">Objectif</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="gradReel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isDark ? "#fff" : "#18181b"} stopOpacity={0.12} />
              <stop offset="95%" stopColor={isDark ? "#fff" : "#18181b"} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradObjectif" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isDark ? "#52525b" : "#d4d4d8"} stopOpacity={0.2} />
              <stop offset="95%" stopColor={isDark ? "#52525b" : "#d4d4d8"} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={{ stroke: axisColor }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}€`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke={axisColor} strokeDasharray="0" />

          <Area
            type="monotone"
            dataKey="objectif"
            stroke={isDark ? "#52525b" : "#d4d4d8"}
            strokeWidth={2}
            fill="url(#gradObjectif)"
            connectNulls
            dot={false}
            activeDot={false}
          />
          <Area
            type="monotone"
            dataKey="reel"
            stroke={isDark ? "#fff" : "#18181b"}
            strokeWidth={2}
            fill="url(#gradReel)"
            connectNulls
            dot={{ r: 3, fill: isDark ? "#fff" : "#18181b", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
