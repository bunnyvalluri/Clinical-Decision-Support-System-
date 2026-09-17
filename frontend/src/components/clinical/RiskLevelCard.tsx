import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge, type ClinicalRiskTier } from "@/components/clinical/RiskBadge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Clock, Cpu, ShieldCheck } from "lucide-react";

export interface RiskLevelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  riskLevel: ClinicalRiskTier | string;
  riskScore?: number;
  modelVersion?: string;
  timestamp?: string;
  actionGuidance?: string;
}

export function RiskLevelCard({
  riskLevel,
  riskScore,
  modelVersion,
  timestamp,
  actionGuidance,
  className,
  ...props
}: RiskLevelCardProps) {
  const percentage =
    riskScore !== undefined && riskScore !== null && !isNaN(riskScore)
      ? Math.round(riskScore * 100)
      : undefined;

  return (
    <Card className={cn("border-border bg-card shadow-xs", className)} {...props}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Risk Stratification
          </CardTitle>
          <RiskBadge level={riskLevel} score={riskScore} />
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Assessed based on classical machine learning risk models.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {percentage !== undefined && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Calculated Risk Score</span>
              <span className="tabular-nums font-semibold text-foreground">
                {percentage}%
              </span>
            </div>
            <Progress
              value={percentage}
              className="h-2"
              aria-label={`Risk score ${percentage}%`}
            />
          </div>
        )}

        {actionGuidance && (
          <div className="rounded-md border border-border/80 bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
            <p className="font-semibold text-foreground mb-0.5">Clinical Protocol Guidance:</p>
            {actionGuidance}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          {modelVersion && (
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              <span>Model: {modelVersion}</span>
            </div>
          )}
          {timestamp && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span className="tabular-nums">{timestamp}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 ml-auto text-emerald-600 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Human Review Required</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
