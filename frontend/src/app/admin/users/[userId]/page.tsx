"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Shield, Mail, Building2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import React from "react";

const DEMO_USERS: Record<string, any> = {
  u1: { name: "Dr. Elena Vance, MD", email: "dr.elena.vance@hospital.org", role: "DOCTOR", status: "ACTIVE", department: "Cardiology", license: "MD-883921" },
  u2: { name: "Sarah Jenkins, RN", email: "s.jenkins@hospital.org", role: "NURSE", status: "ACTIVE", department: "Emergency Triage", license: "RN-449102" },
  u3: { name: "Alex Rivera, MSc", email: "alex.rivera@hospital.org", role: "MEDICAL_INFORMATICIST", status: "ACTIVE", department: "Clinical Informatics", license: "BIO-10923" },
  u4: { name: "Marcus Chen", email: "m.chen@hospital.org", role: "IT_ADMIN", status: "ACTIVE", department: "IT Systems", license: "CISSP-98210" },
};

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const u = DEMO_USERS[userId];

  if (!u) return (
    <div className="p-6 text-center">
      <p className="text-slate-500">User not found.</p>
      <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/users")}>
        <ArrowLeft className="h-4 w-4 mr-2" />Back
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.push("/admin/users")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />Users
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="h-7 w-7 text-slate-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{u.name}</h1>
              <Badge className={`mt-1 border text-xs ${u.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                {u.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { icon: Mail, label: "Email", value: u.email },
            { icon: Building2, label: "Department", value: u.department },
            { icon: Shield, label: "Role", value: u.role.replace("_", " ") },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
              <Icon className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400 w-24">{label}</span>
              <span className="text-sm font-medium text-slate-800">{value}</span>
            </div>
          ))}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1">Reset Password</Button>
            <Button className="flex-1 bg-slate-800 hover:bg-slate-900 text-white">Edit Role</Button>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Password is never displayed. Role changes are audit-logged.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
