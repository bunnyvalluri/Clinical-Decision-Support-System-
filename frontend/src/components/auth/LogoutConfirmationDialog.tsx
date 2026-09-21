"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/features/auth/authStore";

export interface LogoutConfirmationDialogProps {
  /** Optional override for controlled open state; defaults to authStore.isLogoutDialogOpen */
  open?: boolean;
  /** Optional callback when user clicks Cancel */
  onCancel?: () => void;
  /** Optional callback when user confirms logout */
  onConfirm?: () => Promise<void> | void;
  /** Optional explicit loading state override */
  loading?: boolean;
}

/**
 * LogoutConfirmationDialog
 *
 * A compact, accessible, browser-style confirmation dialog designed strictly
 * according to the HealthNova AI specification:
 * - Header/source: "www.HealthNova-Ai.in says"
 * - Message: "Logging out..."
 * - Buttons: [Cancel] [OK]
 * - Dark charcoal/near-black styling (isolated to this modal only; rest of app is strictly white/light)
 * - Light peach/pink/red confirmation style for OK button
 * - Semantic WAI-ARIA alertdialog with keyboard trapping and screen-reader semantics
 * - Explicit state machine: IDLE | OPEN | CONFIRMING | LOGGING_OUT | SUCCESS | ERROR
 */
export function LogoutConfirmationDialog({
  open: propOpen,
  onCancel: propOnCancel,
  onConfirm: propOnConfirm,
  loading: propLoading,
}: LogoutConfirmationDialogProps = {}) {
  const {
    isLogoutDialogOpen,
    logoutStatus,
    logoutError,
    closeLogoutDialog,
    confirmLogout,
  } = useAuthStore();

  const isOpen = propOpen !== undefined ? propOpen : isLogoutDialogOpen;
  const isLoggingOut = propLoading !== undefined ? propLoading : logoutStatus === "LOGGING_OUT";
  const cancelButtonRef = React.useRef<HTMLButtonElement | null>(null);

  // Auto-focus the Cancel button when dialog opens to prevent accidental confirmation
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCancel = () => {
    if (isLoggingOut) return;
    if (propOnCancel) {
      propOnCancel();
    } else {
      closeLogoutDialog();
    }
  };

  const handleConfirm = async () => {
    if (isLoggingOut) return;
    try {
      if (propOnConfirm) {
        await propOnConfirm();
      } else {
        await confirmLogout();
      }
    } catch {
      // Error is stored in authStore.logoutError and displayed in dialog
    }
  };

  return (
    <AlertDialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogPrimitive.Portal>
        {/* Dimmed backdrop overlay with subtle blur */}
        <AlertDialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />

        {/* Compact Browser-Style Confirmation Modal Container - Pure White/Light Theme */}
        <AlertDialogPrimitive.Content
          aria-labelledby="logout-dialog-header"
          aria-describedby="logout-dialog-message"
          onEscapeKeyDown={(e) => {
            if (isLoggingOut) {
              e.preventDefault();
            } else {
              handleCancel();
            }
          }}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl shadow-slate-900/10 duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 select-none focus:outline-none"
        >
          {/* Header / Source Line: www.HealthNova-Ai.in says */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <AlertDialogPrimitive.Title
              id="logout-dialog-header"
              className="text-xs font-mono font-medium text-slate-500 tracking-tight truncate select-text"
            >
              www.HealthNova-Ai.in says
            </AlertDialogPrimitive.Title>
          </div>

          {/* Primary Message: Logging out... */}
          <div className="py-4">
            <AlertDialogPrimitive.Description
              id="logout-dialog-message"
              className="text-sm font-semibold text-slate-800 leading-normal select-text"
            >
              Logging out...
            </AlertDialogPrimitive.Description>

            {/* Controlled Error Display if logout network request failed */}
            {logoutError && (
              <div
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-rose-800">Logout Failed</p>
                  <p className="text-[11px] text-rose-700 leading-tight mt-0.5">{logoutError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Horizontally Aligned Actions: [Cancel] [OK] */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            {/* Cancel Button: Clean light/neutral styling */}
            <button
              ref={cancelButtonRef}
              type="button"
              disabled={isLoggingOut}
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Cancel
            </button>

            {/* OK Button: Light peach/pink/red confirmation style */}
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleConfirm}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-950 bg-[#fda4af] hover:bg-[#fb7185] active:bg-[#f43f5e] active:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-1 focus:ring-offset-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[64px] cursor-pointer shadow-xs"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-slate-950" />
                  <span>Logging out...</span>
                </>
              ) : (
                <span>OK</span>
              )}
            </button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
