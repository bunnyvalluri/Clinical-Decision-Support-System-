"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/authStore";
import { getRoleDashboard } from "@/lib/roleRoutes";
import { Loader2 } from "lucide-react";

/**
 * ForbiddenPage has been refactored to eliminate the static "Access Denied" screen.
 * Any direct navigation to /forbidden will seamlessly forward authenticated
 * clinicians to their authorized dashboard and unauthenticated visitors to /login.
 */
function AutoRedirect() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
    } else {
      router.replace(getRoleDashboard(user.role));
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="text-sm font-medium text-slate-500">Redirecting to authorized workspace…</span>
      </div>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <React.Suspense fallback={null}>
      <AutoRedirect />
    </React.Suspense>
  );
}
