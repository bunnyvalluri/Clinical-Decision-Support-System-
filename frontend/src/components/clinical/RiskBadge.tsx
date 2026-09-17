import * as React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ClinicalRiskTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  level: ClinicalRiskTier | string;
  showIcon?: boolean;
  score?: number;
}

export function RiskBadge({
  level,
  showIcon = true,
  score,
  className,
  ...props
}: RiskBadgeProps) {
  const normalizedLevel = (level || "LOW").toUpperCase() as ClinicalRiskTier;

  const config: Record<
    ClinicalRiskTier,
    {
      label: string;
      variant: "riskLow" | "riskMedium" | "riskHigh" | "riskCritical";
      icon: React.ReactNode;
      ariaLabel: string;
    }
  > = {
    LOW: {
      label: "Low Risk",
      variant: "riskLow",
      icon: <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" />,
      ariaLabel: "Patient risk stratification: Low risk",
    },
    MEDIUM: {
      label: "Medium Risk",
      variant: "riskMedium",
      icon: <AlertTriangle className="h-3 w-3 text-amber-600" aria-hidden="true" />,
      ariaLabel: "Patient risk stratification: Medium risk",
    },
    HIGH: {
      label: "High Risk",
      variant: "riskHigh",
      icon: <AlertCircle className="h-3 w-3 text-rose-600" aria-hidden="true" />,
      ariaLabel: "Patient risk stratification: High risk. Clinical review advised.",
    },
    CRITICAL: {
      label: "Critical Risk",
      variant: "riskCritical",
      icon: <ShieldAlert className="h-3 w-3 text-purple-700 animate-pulse" aria-hidden="true" />,
      ariaLabel: "Patient risk stratification: Critical risk. Immediate attention requested.",
    },
  };

  const current = config[normalizedLevel] || config.LOW;

  return (
    <Badge
      variant={current.variant}
      className={cn("inline-flex items-center gap-1.5 font-medium", className)}
      role="status"
      aria-label={current.ariaLabel}
      {...props}
    >
      {showIcon && current.icon}
      <span>{current.label}</span>
      {score !== undefined && score !== null && !isNaN(score) && (
        <span className="ml-1 text-[10px] tabular-nums font-mono opacity-80">
          ({Math.round(score * 100)}%)
        </span>
      )}
    </Badge>
  );
}
