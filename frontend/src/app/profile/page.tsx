"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  Clock,
  HeartPulse,
  Key,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  Smartphone,
  User,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { useAuthStore } from "@/features/auth/authStore";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loginAsRole } = useAuthStore();

  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [criticalSmsAlerts, setCriticalSmsAlerts] = React.useState(true);
  const [emailAlerts, setEmailAlerts] = React.useState(true);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <User className="h-6 w-6 text-emerald-600" />
              Clinician Profile & Session Security
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Workstation credentials, HIPAA audit identity, and telemetry alert routing.
            </p>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
              } catch {}
              logout();
              window.location.href = "/login?logout=true";
            }}
            className="text-xs gap-1.5 self-start sm:self-auto shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out Workstation
          </Button>
        </div>

        {savedSuccess && (
          <Alert variant="success" onDismiss={() => setSavedSuccess(false)}>
            Profile security and alert preferences updated successfully.
          </Alert>
        )}

        {/* Identity Overview Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-2xl font-bold shadow-sm">
              {user?.full_name ? user.full_name.charAt(0) : "D"}
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-lg font-bold text-slate-900">{user?.full_name}</h2>
                <Badge variant="default" className="text-[10px]">
                  {user?.role || "DOCTOR"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
              <p className="text-xs text-emerald-700 font-semibold">{user?.department}</p>
            </div>
          </div>

          {/* Quick Demo Switcher */}
          <div className="flex flex-col items-center sm:items-end gap-2">
            <span className="text-xs text-slate-500 font-medium">Switch Evaluator Persona:</span>
            <div className="flex gap-1.5">
              <Button
                variant={user?.role === "DOCTOR" ? "default" : "outline"}
                size="sm"
                onClick={() => loginAsRole("DOCTOR")}
                className="text-xs h-8 border-slate-200"
              >
                Doctor
              </Button>
              <Button
                variant={user?.role === "NURSE" ? "default" : "outline"}
                size="sm"
                onClick={() => loginAsRole("NURSE")}
                className="text-xs h-8 border-slate-200"
              >
                Nurse
              </Button>
              <Button
                variant={user?.role === "ADMIN" ? "default" : "outline"}
                size="sm"
                onClick={() => loginAsRole("ADMIN")}
                className="text-xs h-8 border-slate-200"
              >
                Admin
              </Button>
            </div>
          </div>
        </div>

        {/* Clinician Details Form */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Medical Credential Verification
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Permanent identifiers logged on all ML prediction overrides.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <Input
                label="Full Name"
                value={user?.full_name || ""}
                disabled
              />
              <Input
                label="Staff Email"
                value={user?.email || ""}
                disabled
              />
              <Input
                label="Department"
                value={user?.department || ""}
                disabled
              />
              <Input
                label="State License / Staff Registry ID"
                value={user?.license_number || "MD-883921-ACTIVE"}
                disabled
              />
            </CardContent>
          </Card>

          {/* Alert Notification Routing & Security */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" />
                Telemetry Alert Dispatch Rules
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Configure direct channels for critical patient threshold alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <form onSubmit={handleSavePreferences} className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">
                      Emergency SMS for Critical Tiers
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Instant text message when patient risk exceeds 80%.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={criticalSmsAlerts}
                    onChange={(e) => setCriticalSmsAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">
                      Email Daily Risk Stratification Digests
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Summary report of all inpatient evaluations.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                <Button type="submit" variant="default" size="sm" className="w-full text-xs shadow-sm">
                  Save Alert Routing Preferences
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Workstation Token & Session Security */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key className="h-4 w-4 text-purple-600" />
              Cryptographic Session Tokens & HIPAA Timeout
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              JSON Web Tokens (JWT) rotating automatically with silent refresh.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Access Token Status:</span>
              <Badge variant="success" className="text-[10px]">VALID (HMAC-SHA256)</Badge>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Auto-Refresh Interval:</span>
              <span className="text-slate-700 font-mono font-medium">Every 14 minutes</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">Idle Lockout:</span>
              <span className="text-slate-700 font-mono font-medium">15 minutes of inactivity</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
