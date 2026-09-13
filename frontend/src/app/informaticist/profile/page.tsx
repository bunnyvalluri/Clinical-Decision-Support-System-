"use client";

import { useAuthStore } from "@/features/auth/authStore";
import { Brain, Mail, Building2, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function InformaticistProfilePage() {
  const { user } = useAuthStore();
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
              <Badge className="mt-1 bg-purple-50 text-purple-700 border border-purple-200">Medical Informaticist</Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Mail, label: "Email", value: user?.email },
              { icon: Building2, label: "Department", value: user?.department },
              { icon: BadgeCheck, label: "License", value: user?.license_number },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Icon className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{value ?? "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
