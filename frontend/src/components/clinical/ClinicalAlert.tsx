import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export interface ClinicalAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  alertId: string;
  patientMRN: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  timestamp: string;
  isAcknowledged?: boolean;
  onAcknowledge?: (alertId: string) => void;
}

export function ClinicalAlert({
  alertId,
  patientMRN,
  severity,
  title,
  description,
  timestamp,
  isAcknowledged = false,
  onAcknowledge,
  className,
  ...props
}: ClinicalAlertProps) {
  const alertVariant =
    severity === "CRITICAL"
      ? ("critical" as const)
      : severity === "HIGH"
      ? ("error" as const)
      : severity === "MEDIUM"
      ? ("warning" as const)
      : ("info" as const);

  const badgeVariant =
    severity === "CRITICAL"
      ? ("critical" as const)
      : severity === "HIGH"
      ? ("destructive" as const)
      : severity === "MEDIUM"
      ? ("warning" as const)
      : ("info" as const);

  return (
    <Alert variant={alertVariant} className={cn("p-4 shadow-xs", className)} {...props}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 pr-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px]">
              {patientMRN}
            </Badge>
            <Badge variant={badgeVariant} className="text-[10px]">
              {severity} ALERT
            </Badge>
          </div>
          <AlertTitle className="text-sm font-bold pt-1">{title}</AlertTitle>
          <AlertDescription className="text-xs">{description}</AlertDescription>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <Clock className="h-3 w-3" />
            <span className="tabular-nums">{timestamp}</span>
          </div>
        </div>

        {onAcknowledge && (
          <div className="shrink-0 pt-1">
            {isAcknowledged ? (
              <Badge variant="success" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" /> Acknowledged
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAcknowledge(alertId)}
                className="text-xs h-8"
              >
                Acknowledge
              </Button>
            )}
          </div>
        )}
      </div>
    </Alert>
  );
}
