"use client";

/**
 * RoleGuard — Client-side route guard.
 * Works alongside middleware for defense-in-depth.
 * Renders children only if the user has the required role.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/authStore";
import { getRoleDashboard } from "@/lib/roleRoutes";
import type { RoleType } from "@/features/auth/authStore";
import { ShieldX, Loader2 } from "lucide-react";

interface RoleGuardProps {
  requiredRoles: RoleType[];
  children: React.ReactNode;
}

export function RoleGuard({ requiredRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    // Give the store time to hydrate from localStorage
    const timer = setTimeout(() => {
      if (!isAuthenticated || !user) {
        router.replace("/login");
      } else if (!requiredRoles.includes(user.role)) {
        const params = new URLSearchParams({
          from: window.location.pathname,
          role: user.role,
        });
        router.replace(`/forbidden?${params}`);
      } else {
        setChecked(true);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, requiredRoles, router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Verifying access…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
