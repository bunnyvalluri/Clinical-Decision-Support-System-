"use client";

/**
 * RoleGuard — Client-side route guard with seamless role redirect.
 * Works alongside Edge middleware for defense-in-depth.
 * Renders children only if the user holds the required role for this layout/page.
 *
 * If a role mismatch occurs, it IMMEDIATELY redirects to the user's
 * authorized role dashboard without rendering any "Access Denied" screen.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/authStore";
import { getRoleDashboard } from "@/lib/roleRoutes";
import type { RoleType } from "@/features/auth/authStore";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  requiredRoles: RoleType[];
  children: React.ReactNode;
}

export function RoleGuard({ requiredRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const isAuthorized = Boolean(
    isAuthenticated && user && requiredRoles.includes(user.role)
  );

  React.useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (!requiredRoles.includes(user.role)) {
      const authorizedDashboard = getRoleDashboard(user.role);
      router.replace(authorizedDashboard);
    }
  }, [isAuthenticated, user, requiredRoles, router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="text-sm font-medium text-slate-500">Verifying authorized workspace…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
