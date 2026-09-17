import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Activity, AlertTriangle, ArrowDown, ArrowUp, Check } from "lucide-react";

export interface VitalSignCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: number | string;
  unit: string;
  normalRange?: string;
  status?: "NORMAL" | "LOW" | "HIGH" | "CRITICAL";
  timestamp?: string;
  trend?: "up" | "down" | "stable";
}

export function VitalSignCard({
  label,
  value,
  unit,
  normalRange,
  status = "NORMAL",
  timestamp,
  trend,
  className,
  ...props
}: VitalSignCardProps) {
  const statusConfig: Record<
    "NORMAL" | "LOW" | "HIGH" | "CRITICAL",
    {
      badgeVariant: "success" | "warning" | "destructive" | "riskCritical";
      badgeLabel: string;
      icon: React.ReactNode;
    }
  > = {
    NORMAL: {
      badgeVariant: "success",
      badgeLabel: "Normal",
      icon: <Check className="h-3 w-3 text-emerald-600" />,
    },
    LOW: {
      badgeVariant: "warning",
      badgeLabel: "Low",
      icon: <ArrowDown className="h-3 w-3 text-amber-600" />,
    },
    HIGH: {
      badgeVariant: "warning",
      badgeLabel: "High",
      icon: <ArrowUp className="h-3 w-3 text-amber-600" />,
    },
    CRITICAL: {
      badgeVariant: "destructive",
      badgeLabel: "Critical",
      icon: <AlertTriangle className="h-3 w-3 text-rose-600 animate-pulse" />,
    },
  };

  const current = statusConfig[status] || statusConfig.NORMAL;

  return (
    <Card className={cn("border-border bg-card shadow-xs", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </CardTitle>
        <Badge variant={current.badgeVariant} className="text-[10px] px-2 py-0">
          <span className="mr-1">{current.icon}</span>
          {current.badgeLabel}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {value}
          </span>
          <span className="text-xs font-medium text-muted-foreground">{unit}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          {normalRange && <span>Ref: {normalRange}</span>}
          {timestamp && <span className="tabular-nums ml-auto">{timestamp}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
