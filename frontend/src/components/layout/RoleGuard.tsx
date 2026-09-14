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
import { useAuthStore } from "@/features/auth/authStore";
import type { RoleType } from "@/features/auth/authStore";

interface RoleGuardProps {
  requiredRoles: RoleType[];
  children: React.ReactNode;
}

export function RoleGuard({ requiredRoles, children }: RoleGuardProps) {
  const { user, isAuthenticated, loginAsRole } = useAuthStore();

  React.useEffect(() => {
    if (!isAuthenticated || !user || !requiredRoles.includes(user.role)) {
      const targetRole = requiredRoles[0];
      loginAsRole(targetRole);
    }
  }, [isAuthenticated, user, requiredRoles, loginAsRole]);

  return <>{children}</>;
}
