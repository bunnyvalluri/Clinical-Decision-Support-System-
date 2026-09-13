import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none";

    const variants = {
      default: "bg-emerald-600 text-white shadow hover:bg-emerald-700 active:scale-[0.98]",
      destructive: "bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:scale-[0.98]",
      outline: "border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800",
      secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
      ghost: "hover:bg-zinc-800 text-zinc-300 hover:text-white",
      link: "text-emerald-400 underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
