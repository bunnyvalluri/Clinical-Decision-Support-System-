import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | "low"
    | "medium"
    | "high"
    | "critical";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-sky-600 text-white shadow-xs",
    secondary: "bg-slate-100 text-slate-700 border border-slate-200",
    destructive: "bg-rose-600 text-white shadow-xs",
    outline: "border border-slate-300 text-slate-700 bg-white",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border border-amber-200",
    info: "bg-sky-50 text-sky-700 border border-sky-200",
    low: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium",
    medium: "bg-amber-50 text-amber-800 border border-amber-200 font-medium",
    high: "bg-rose-50 text-rose-700 border border-rose-200 font-semibold",
    critical: "bg-purple-50 text-purple-700 border border-purple-200 font-bold animate-pulse",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
