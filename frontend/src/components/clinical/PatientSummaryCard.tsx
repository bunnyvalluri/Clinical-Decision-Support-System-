import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge, type ClinicalRiskTier } from "@/components/clinical/RiskBadge";
import { cn } from "@/lib/utils";
import { Bed, Calendar, Stethoscope, User } from "lucide-react";

export interface PatientSummaryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  mrn: string;
  age?: number;
  gender?: string;
  department?: string;
  room?: string;
  admissionDate?: string;
  primaryDoctor?: string;
  riskLevel?: ClinicalRiskTier | string;
  riskScore?: number;
}

export function PatientSummaryCard({
  mrn,
  age,
  gender,
  department,
  room,
  admissionDate,
  primaryDoctor,
  riskLevel,
  riskScore,
  className,
  ...props
}: PatientSummaryCardProps) {
  // Respect patient privacy by masking MRN if needed or displaying standard identifier
  const displayMRN = mrn.startsWith("MRN-") ? mrn : `MRN-${mrn}`;

  return (
    <Card className={cn("border-border bg-card shadow-xs", className)} {...props}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight">
              {displayMRN}
            </CardTitle>
            {(age !== undefined || gender) && (
              <p className="text-xs text-muted-foreground">
                {age !== undefined ? `${age} y/o` : ""}
                {age && gender ? " • " : ""}
                {gender === "M" ? "Male" : gender === "F" ? "Female" : gender || ""}
              </p>
            )}
          </div>
        </div>
        {riskLevel && <RiskBadge level={riskLevel} score={riskScore} />}
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-xs pt-1">
        {department && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Stethoscope className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">{department}</span>
          </div>
        )}
        {room && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Bed className="h-3.5 w-3.5 text-primary" />
            <span>Room {room}</span>
          </div>
        )}
        {primaryDoctor && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">Attending: {primaryDoctor}</span>
          </div>
        )}
        {admissionDate && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="tabular-nums">{admissionDate}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
