import * as React from "react";
import { RiskBadge, type ClinicalRiskTier } from "@/components/clinical/RiskBadge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Activity, ShieldCheck, User } from "lucide-react";

export interface PatientHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  mrn: string;
  patientName?: string;
  age?: number;
  gender?: string;
  status?: string;
  riskLevel?: ClinicalRiskTier | string;
  riskScore?: number;
  actions?: React.ReactNode;
}

export function PatientHeader({
  mrn,
  patientName,
  age,
  gender,
  status = "INPATIENT",
  riskLevel,
  riskScore,
  actions,
  className,
  ...props
}: PatientHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <User className="h-5 w-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              {patientName ? patientName : mrn}
            </h2>
            <Badge variant="outline" className="text-xs font-mono">
              {mrn}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {age !== undefined && <span>{age} Years</span>}
            {gender && <span>• {gender === "M" ? "Male" : gender === "F" ? "Female" : gender}</span>}
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified Chart
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {riskLevel && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Status:</span>
            <RiskBadge level={riskLevel} score={riskScore} />
          </div>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
