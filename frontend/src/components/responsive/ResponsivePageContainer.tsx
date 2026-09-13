"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ResponsivePageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export function ResponsivePageContainer({
  title,
  subtitle,
  actions,
  badge,
  children,
  className,
  ...props
}: ResponsivePageContainerProps) {
  return (
    <div className={cn("space-y-4 sm:space-y-6 w-full min-w-0", className)} {...props}>
      {(title || actions || badge) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-1">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              {title && (
                <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  {title}
                </h1>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 pt-1 sm:pt-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
