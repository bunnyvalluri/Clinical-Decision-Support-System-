import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ClinicalWorkflowStatus =
  | "TRIAGED"
  | "IN_REVIEW"
  | "ADMITTED"
  | "INPATIENT"
  | "DISCHARGED"
  | "CRITICAL"
  | "PENDING_LABS"
  | "ESCALATED";

export interface ClinicalStatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: ClinicalWorkflowStatus | string;
}

export function ClinicalStatusBadge({
  status,
  className,
  ...props
}: ClinicalStatusBadgeProps) {
  const normalized = (status || "IN_REVIEW").toUpperCase();

  const getVariant = () => {
    switch (normalized) {
      case "ADMITTED":
      case "INPATIENT":
        return "info" as const;
      case "TRIAGED":
      case "IN_REVIEW":
        return "secondary" as const;
      case "DISCHARGED":
        return "success" as const;
      case "PENDING_LABS":
        return "warning" as const;
      case "CRITICAL":
      case "ESCALATED":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <Badge
      variant={getVariant()}
      className={cn("uppercase text-[10px] tracking-wider font-semibold", className)}
      {...props}
    >
      {normalized.replace(/_/g, " ")}
    </Badge>
  );
}
