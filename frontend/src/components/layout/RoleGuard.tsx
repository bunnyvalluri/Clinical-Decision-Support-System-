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
import { useAuthStore, getRoleHomeRoute } from "@/features/auth/authStore";
import type { RoleType } from "@/features/auth/authStore";

interface RoleGuardProps {
  requiredRoles: RoleType[];
  children: React.ReactNode;
}

export function RoleGuard({ requiredRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (!requiredRoles.includes(user.role)) {
      router.replace(getRoleHomeRoute(user.role));
    }
  }, [isAuthenticated, user, requiredRoles, router]);

  if (!isAuthenticated || !user || !requiredRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
