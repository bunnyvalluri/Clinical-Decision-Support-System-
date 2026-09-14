"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/authStore";
import { getRoleDashboard } from "@/lib/roleRoutes";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    const targetDashboard = getRoleDashboard(user.role);
    router.replace(targetDashboard);
  }, [user, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        <span className="text-sm font-medium">Redirecting to authorized clinical workspace...</span>
      </div>
    </div>
  );
}
