import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export interface ClinicalMetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: number | string;
  subtitle?: string;
  delta?: {
    value: number | string;
    isPositiveGood?: boolean;
    trend: "up" | "down" | "neutral";
  };
  icon?: React.ReactNode;
}

export function ClinicalMetricCard({
  title,
  value,
  subtitle,
  delta,
  icon,
  className,
  ...props
}: ClinicalMetricCardProps) {
  return (
    <Card className={cn("border-border bg-card shadow-xs", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-primary">{icon}</div>}
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </div>
        {(subtitle || delta) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
            {delta && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium tabular-nums",
                  delta.trend === "up"
                    ? delta.isPositiveGood
                      ? "text-emerald-600"
                      : "text-rose-600"
                    : delta.trend === "down"
                    ? delta.isPositiveGood
                      ? "text-rose-600"
                      : "text-emerald-600"
                    : "text-muted-foreground"
                )}
              >
                {delta.trend === "up" && <ArrowUp className="h-3 w-3" />}
                {delta.trend === "down" && <ArrowDown className="h-3 w-3" />}
                {delta.trend === "neutral" && <Minus className="h-3 w-3" />}
                {delta.value}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
