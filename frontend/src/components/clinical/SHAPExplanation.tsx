import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

export interface SHAPFeatureContribution {
  featureName: string;
  featureValue: number | string;
  shapValue: number; // positive increases risk, negative decreases risk
  unit?: string;
}

export interface SHAPExplanationProps extends React.HTMLAttributes<HTMLDivElement> {
  baseValue?: number;
  predictionScore?: number;
  features: SHAPFeatureContribution[];
  emptyMessage?: string;
}

export function SHAPExplanation({
  baseValue,
  predictionScore,
  features,
  emptyMessage = "No SHAP feature attribution data available for this prediction.",
  className,
  ...props
}: SHAPExplanationProps) {
  if (!features || features.length === 0) {
    return (
      <Card className={cn("border-border bg-card", className)} {...props}>
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  // Find max absolute SHAP value for scaling bars
  const maxAbsValue = Math.max(...features.map((f) => Math.abs(f.shapValue)), 0.01);

  return (
    <Card className={cn("border-border bg-card shadow-xs", className)} {...props}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-foreground">
            SHAP Feature Attributions (TreeSHAP)
          </CardTitle>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-xs bg-rose-500" />
              Increases Risk (+)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-xs bg-emerald-500" />
              Decreases Risk (-)
            </span>
          </div>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Individual biometric and laboratory contributions to the calibrated risk score.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {features.map((feat) => {
          const isRiskElevating = feat.shapValue > 0;
          const barWidthPercent = Math.min(
            100,
            Math.round((Math.abs(feat.shapValue) / maxAbsValue) * 100)
          );

          return (
            <div key={feat.featureName} className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground">
                  {feat.featureName}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({feat.featureValue} {feat.unit || ""})
                  </span>
                </span>
                <span
                  className={cn(
                    "font-mono tabular-nums font-semibold",
                    isRiskElevating ? "text-rose-600" : "text-emerald-600"
                  )}
                >
                  {isRiskElevating ? "+" : ""}
                  {feat.shapValue.toFixed(3)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden flex">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isRiskElevating ? "bg-rose-500 ml-auto" : "bg-emerald-500 mr-auto"
                  )}
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-1.5 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            Attributions derive from model Shapley values computed at inference time.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
