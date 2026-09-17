"use client";

import * as React from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Shell } from "./Shell";
import { RoleGuard } from "./RoleGuard";
import { Cpu } from "lucide-react";

export function InformaticistLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={["MEDICAL_INFORMATICIST", "ANALYST"]}>
      <Shell>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <Breadcrumbs />
            <div className="flex items-center gap-1.5 text-xs text-sky-700 font-medium">
              <Cpu className="h-4 w-4" />
              <span>Informatics & MLOps Console</span>
            </div>
          </div>
          {children}
        </div>
      </Shell>
    </RoleGuard>
  );
}
