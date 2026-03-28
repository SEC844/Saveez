import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Trend = "up" | "down" | "neutral";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: Trend;
  trendLabel?: string;
  highlight?: boolean;
  delay?: number;
}

export default function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  trend = "neutral",
  trendLabel,
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-5 border transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-3",
        highlight
          ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900"
          : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-white"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <p className={cn(
          "text-xs font-medium tracking-wide uppercase",
          highlight ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-400 dark:text-zinc-500"
        )}>
          {label}
        </p>
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center",
          highlight
            ? "bg-white/10 dark:bg-zinc-900/10"
            : "bg-zinc-50 dark:bg-zinc-800"
        )}>
          <Icon size={15} className={highlight ? "text-white dark:text-zinc-900" : "text-zinc-500 dark:text-zinc-400"} />
        </div>
      </div>

      <p className={cn(
        "text-2xl font-semibold tracking-tight",
        highlight ? "text-white dark:text-zinc-900" : "text-zinc-900 dark:text-white"
      )}>
        {value}
      </p>

      {(trendLabel || subValue) && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {trendLabel && (
            <span className={cn(
              "text-xs font-medium",
              trend === "up" && "text-emerald-500",
              trend === "down" && "text-red-400",
              trend === "neutral" && (highlight ? "text-zinc-400" : "text-zinc-400 dark:text-zinc-500")
            )}>
              {trendLabel}
            </span>
          )}
          {subValue && (
            <span className={cn(
              "text-xs",
              highlight ? "text-zinc-400" : "text-zinc-400 dark:text-zinc-500"
            )}>
              {subValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
