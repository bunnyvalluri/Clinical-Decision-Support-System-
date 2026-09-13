"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  sheetOnMobile?: boolean;
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "lg",
  sheetOnMobile = true,
}: ResponsiveModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "responsive-modal-title" : undefined}
        className={cn(
          "relative w-full bg-white text-slate-900 z-10 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden",
          // Mobile Bottom Sheet styling
          sheetOnMobile
            ? "rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 pb-safe duration-200"
            : "rounded-2xl border border-slate-200 animate-in zoom-in-95",
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Mobile Drag Handle */}
        {sheetOnMobile && (
          <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="space-y-1 min-w-0">
            {title && (
              <h2 id="responsive-modal-title" className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                {title}
              </h2>
            )}
            {subtitle && <p className="text-xs text-slate-500 leading-relaxed">{subtitle}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="touch-target p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
