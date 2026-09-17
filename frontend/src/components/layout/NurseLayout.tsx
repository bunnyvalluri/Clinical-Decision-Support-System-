"use client";

import * as React from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Shell } from "./Shell";
import { RoleGuard } from "./RoleGuard";
import { HeartPulse } from "lucide-react";

export function NurseLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={["NURSE"]}>
      <Shell>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <Breadcrumbs />
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
              <HeartPulse className="h-4 w-4" />
              <span>Triage & Bedside Nursing</span>
            </div>
          </div>
          {children}
        </div>
      </Shell>
    </RoleGuard>
  );
}
