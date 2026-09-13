"use client";

import * as React from "react";
import { Shell } from "@/components/layout/Shell";
import { useAuthStore } from "@/features/auth/authStore";
import { DoctorWorkspace } from "@/features/workspaces/DoctorWorkspace";
import { NurseWorkspace } from "@/features/workspaces/NurseWorkspace";
import { InformaticsWorkspace } from "@/features/workspaces/InformaticsWorkspace";
import { AdminWorkspace } from "@/features/workspaces/AdminWorkspace";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role || "DOCTOR";

  return (
    <Shell>
      {role === "NURSE" ? (
        <NurseWorkspace />
      ) : role === "MEDICAL_INFORMATICIST" || role === "ANALYST" ? (
        <InformaticsWorkspace />
      ) : role === "IT_ADMIN" || role === "ADMIN" ? (
        <AdminWorkspace />
      ) : (
        <DoctorWorkspace />
      )}
    </Shell>
  );
}
