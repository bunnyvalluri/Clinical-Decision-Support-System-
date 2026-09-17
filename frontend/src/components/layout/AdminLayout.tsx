"use client";

import * as React from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Shell } from "./Shell";
import { RoleGuard } from "./RoleGuard";
import { ShieldCheck } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={["IT_ADMIN", "ADMIN"]}>
      <Shell>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <Breadcrumbs />
            <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Enterprise Governance</span>
            </div>
          </div>
          {children}
        </div>
      </Shell>
    </RoleGuard>
  );
}
