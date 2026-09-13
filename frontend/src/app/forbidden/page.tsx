"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldX, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/authStore";
import { getRoleDashboard, ROLE_LABELS } from "@/lib/roleRoutes";

function ForbiddenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const from = searchParams.get("from") || "";
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : "your role";
  const roleDashboard = getRoleDashboard(user?.role);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-rose-50 border-2 border-rose-100 flex items-center justify-center">
            <ShieldX className="h-10 w-10 text-rose-500" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-500">
            You do not have permission to access this area.
          </p>
        </div>

        {/* Detail card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left space-y-3">
          {from && (
            <div className="flex items-start gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-24 shrink-0 pt-0.5">
                Requested
              </span>
              <code className="text-sm text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-mono break-all">
                {from}
              </code>
            </div>
          )}
          <div className="flex items-start gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-24 shrink-0 pt-0.5">
              Your Role
            </span>
            <span className="text-sm text-slate-700 font-medium">{roleLabel}</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-24 shrink-0 pt-0.5">
              Authorized
            </span>
            <code className="text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
              {roleDashboard}
            </code>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          This access attempt has been logged. If you believe this is an error,
          please contact your IT System Administrator.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={() => router.push(roleDashboard)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Home className="h-4 w-4" />
            My Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <React.Suspense fallback={null}>
      <ForbiddenContent />
    </React.Suspense>
  );
}

