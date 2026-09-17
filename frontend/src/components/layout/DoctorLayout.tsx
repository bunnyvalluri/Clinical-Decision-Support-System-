"use client";

import * as React from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Shell } from "./Shell";
import { RoleGuard } from "./RoleGuard";
import { Stethoscope } from "lucide-react";

export function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={["DOCTOR"]}>
      <Shell>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <Breadcrumbs />
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <Stethoscope className="h-4 w-4" />
              <span>Physician Workspace</span>
            </div>
          </div>
          {children}
        </div>
      </Shell>
    </RoleGuard>
  );
}
