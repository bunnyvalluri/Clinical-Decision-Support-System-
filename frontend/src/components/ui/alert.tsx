import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "info" | "success" | "warning" | "error" | "critical";
  title?: string;
  onDismiss?: () => void;
}

export function Alert({
  className,
  variant = "default",
  title,
  children,
  onDismiss,
  ...props
}: AlertProps) {
  const icons = {
    default: <Info className="h-4 w-4 text-slate-500" />,
    info: <Info className="h-4 w-4 text-blue-600" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-600" />,
    error: <XCircle className="h-4 w-4 text-rose-600" />,
    critical: <AlertCircle className="h-4 w-4 text-rose-600 animate-pulse" />,
  };

  const variants = {
    default: "bg-slate-50 border-slate-200 text-slate-800",
    info: "bg-blue-50/80 border-blue-200 text-blue-950",
    success: "bg-emerald-50/80 border-emerald-200 text-emerald-950",
    warning: "bg-amber-50/80 border-amber-200 text-amber-950",
    error: "bg-rose-50/80 border-rose-200 text-rose-950",
    critical: "bg-rose-100 border-rose-300 text-rose-950 shadow-sm",
  };

  return (
    <div
      role="alert"
      className={cn(
        "relative flex w-full gap-3 rounded-xl border p-4 text-sm transition-all",
        variants[variant],
        className
      )}
      {...props}
    >
      <div className="shrink-0 pt-0.5">{icons[variant]}</div>
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-semibold leading-tight tracking-tight">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 -mr-1 -mt-1 p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss alert"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
