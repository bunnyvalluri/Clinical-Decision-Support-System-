"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/authStore";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  React.useEffect(() => {
    const role = user?.role;
    if (role === "NURSE") {
      router.replace("/nurse/dashboard");
    } else if (role === "MEDICAL_INFORMATICIST" || role === "ANALYST") {
      router.replace("/informaticist/dashboard");
    } else if (role === "IT_ADMIN" || role === "ADMIN") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/doctor/dashboard");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-600">
        <span className="h-4 w-4 rounded-full border-2 border-slate-600 border-t-transparent animate-spin" />
        <span className="text-sm font-medium">Redirecting to authorized clinical workspace...</span>
      </div>
    </div>
  );
}
