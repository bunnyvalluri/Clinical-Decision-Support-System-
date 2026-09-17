import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge, type ClinicalRiskTier } from "@/components/clinical/RiskBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Activity, CheckCircle2, Clock, Cpu, FileQuestion } from "lucide-react";

export interface PredictionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  predictionId: string;
  patientMRN: string;
  riskLevel: ClinicalRiskTier | string;
  riskScore: number;
  modelName: string;
  modelVersion: string;
  timestamp: string;
  reviewStatus?: "PENDING" | "APPROVED" | "REJECTED";
  onReviewClick?: (predictionId: string) => void;
}

export function PredictionCard({
  predictionId,
  patientMRN,
  riskLevel,
  riskScore,
  modelName,
  modelVersion,
  timestamp,
  reviewStatus = "PENDING",
  onReviewClick,
  className,
  ...props
}: PredictionCardProps) {
  const percentage = Math.round((riskScore || 0) * 100);

  const reviewConfig = {
    PENDING: {
      variant: "warning" as const,
      label: "Pending Clinician Review",
      icon: <FileQuestion className="h-3 w-3" />,
    },
    APPROVED: {
      variant: "success" as const,
      label: "Clinician Approved",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    REJECTED: {
      variant: "destructive" as const,
      label: "Clinician Overruled",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
  };

  const currentReview = reviewConfig[reviewStatus] || reviewConfig.PENDING;

  return (
    <Card className={cn("border-border bg-card shadow-xs", className)} {...props}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {patientMRN}
            </Badge>
            <Badge variant={currentReview.variant} className="text-[10px]">
              <span className="mr-1">{currentReview.icon}</span>
              {currentReview.label}
            </Badge>
          </div>
          <CardTitle className="text-sm font-semibold text-foreground pt-1">
            Prediction #{predictionId.substring(0, 8)}
          </CardTitle>
        </div>
        <RiskBadge level={riskLevel} score={riskScore} />
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 border border-border/60">
          <div>
            <span className="text-muted-foreground block text-[11px]">Calibrated Risk Score</span>
            <span className="text-xl font-bold tabular-nums text-foreground">{percentage}%</span>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground block text-[11px]">Prediction Model</span>
            <span className="font-medium text-foreground">{modelName} v{modelVersion}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span className="tabular-nums">{timestamp}</span>
          </div>
          <div className="flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5 text-primary" />
            <span>scikit-learn CDSS</span>
          </div>
        </div>
      </CardContent>
      {onReviewClick && (
        <CardFooter className="pt-0">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => onReviewClick(predictionId)}
          >
            Review Prediction & Attributions
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
