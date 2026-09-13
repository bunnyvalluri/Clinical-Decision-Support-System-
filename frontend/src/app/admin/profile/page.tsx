"use client";

import { useAuthStore } from "@/features/auth/authStore";
import { Shield, Mail, Building2, BadgeCheck, User, Key } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminProfilePage() {
  const { user } = useAuthStore();
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Administrator Profile</h1>
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
              <Badge className="mt-1 bg-slate-100 text-slate-800 border border-slate-300">
                IT System Administrator
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Mail, label: "Email", value: user?.email },
              { icon: Building2, label: "Department", value: user?.department },
              { icon: BadgeCheck, label: "Certification", value: user?.license_number || "CISSP-98210" },
              { icon: User, label: "Username", value: user?.username },
              { icon: Key, label: "Access Tier", value: "Root Infrastructure Admin" },
              { icon: Shield, label: "2FA Status", value: "Hardware Key (FIDO2) Enforced" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Icon className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{value ?? "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
