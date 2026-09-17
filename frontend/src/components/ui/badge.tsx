import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-border bg-background",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
        info: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
        low: "border-emerald-200 bg-emerald-50 text-emerald-700 font-medium",
        medium: "border-amber-200 bg-amber-50 text-amber-800 font-medium",
        high: "border-rose-200 bg-rose-50 text-rose-700 font-semibold",
        critical:
          "border-purple-200 bg-purple-50 text-purple-700 font-bold animate-pulse",
        riskLow: "border-emerald-200 bg-emerald-50 text-emerald-700 font-medium",
        riskMedium: "border-amber-200 bg-amber-50 text-amber-800 font-medium",
        riskHigh: "border-rose-200 bg-rose-50 text-rose-700 font-semibold",
        riskCritical:
          "border-purple-200 bg-purple-50 text-purple-700 font-bold animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
