import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      prefixIcon,
      suffixIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const inputElement = (
      <input
        id={inputId}
        type={type}
        ref={ref}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          prefixIcon && "pl-9",
          suffixIcon && "pr-9",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
    );

    if (!label && !error && !helperText && !prefixIcon && !suffixIcon) {
      return inputElement;
    }

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground">
              {prefixIcon}
            </div>
          )}
          {inputElement}
          {suffixIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-muted-foreground">
              {suffixIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-destructive font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
