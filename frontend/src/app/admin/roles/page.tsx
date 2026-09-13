"use client";

import { Key, ShieldCheck, Shield, Stethoscope, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROLES = [
  { role: "DOCTOR", label: "Physician / Doctor", permissions: ["view_patients", "run_prediction", "review_prediction", "view_reports", "use_ai_assistant"], icon: Stethoscope, color: "text-emerald-600", bg: "bg-emerald-50" },
  { role: "NURSE", label: "Triage & Bedside Nurse", permissions: ["view_assigned_patients", "record_vitals", "submit_triage", "escalate_patient"], icon: Shield, color: "text-sky-600", bg: "bg-sky-50" },
  { role: "MEDICAL_INFORMATICIST", label: "Medical Informaticist", permissions: ["view_model_registry", "view_evaluations", "monitor_drift", "view_analytics", "view_audit"], icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
  { role: "IT_ADMIN", label: "IT System Administrator", permissions: ["manage_users", "manage_roles", "view_all_logs", "manage_services", "manage_configuration"], icon: ShieldCheck, color: "text-slate-700", bg: "bg-slate-100" },
];

export default function AdminRolesPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Roles & Permissions</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ROLES.map(({ role, label, permissions, icon: Icon, color, bg }) => (
          <Card key={role}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800">{role.replace(/_/g, " ")}</CardTitle>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {permissions.map((p) => (
                  <div key={p} className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {p.replace(/_/g, " ")}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
