import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive:
          "border-destructive/50 text-destructive [&>svg]:text-destructive bg-rose-50/50",
        info: "border-sky-200 bg-sky-50 text-sky-900 [&>svg]:text-sky-600",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-900 [&>svg]:text-emerald-600",
        warning:
          "border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600",
        error:
          "border-destructive/50 bg-rose-50 text-destructive [&>svg]:text-destructive",
        critical:
          "border-destructive bg-rose-100 text-destructive font-semibold [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    { className, variant = "default", title, children, onDismiss, ...props },
    ref
  ) => {
    // If title or onDismiss is passed with direct children, support convenient classic layout
    const hasIcon = !React.Children.toArray(children).some(
      (child) => React.isValidElement(child) && child.type === "svg"
    );

    const getIcon = () => {
      switch (variant) {
        case "info":
          return <Info className="h-4 w-4" />;
        case "success":
          return <CheckCircle2 className="h-4 w-4" />;
        case "warning":
          return <AlertTriangle className="h-4 w-4" />;
        case "error":
        case "destructive":
          return <XCircle className="h-4 w-4" />;
        case "critical":
          return <AlertCircle className="h-4 w-4 animate-pulse" />;
        default:
          return <Info className="h-4 w-4" />;
      }
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {hasIcon && getIcon()}
        <div>
          {title && <AlertTitle>{title}</AlertTitle>}
          {title ? <AlertDescription>{children}</AlertDescription> : children}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute right-3 top-3 p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss alert"
          >
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert";

export { Alert, AlertTitle, AlertDescription, alertVariants };
