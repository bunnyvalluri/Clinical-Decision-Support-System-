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
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore, getRoleHomeRoute } from "@/features/auth/authStore";
import type { RoleType } from "@/features/auth/authStore";

interface RoleGuardProps {
  requiredRoles: RoleType[];
  children: React.ReactNode;
}

export function RoleGuard({ requiredRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const rolesKey = React.useMemo(() => requiredRoles.slice().sort().join(","), [requiredRoles]);

  React.useEffect(() => {
    if (!mounted || isLoading) return;

    if (!isAuthenticated || !user) {
      if (pathname !== "/login") {
        router.replace("/login");
      }
      return;
    }

    if (!requiredRoles.includes(user.role)) {
      const targetHome = getRoleHomeRoute(user.role);
      if (pathname !== targetHome) {
        router.replace(targetHome);
      }
    }
  }, [mounted, isLoading, isAuthenticated, user?.role, rolesKey, pathname, router, requiredRoles]);

  // Prevent hydration mismatch on initial SSR vs client render
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Verifying authorization...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Redirecting...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

