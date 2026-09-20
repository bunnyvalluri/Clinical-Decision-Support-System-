"use client";

import * as React from "react";
import {
  Bell,
  CheckCircle2,
  Database,
  Globe,
  Lock,
  Radio,
  Save,
  Server,
  Settings,
  ShieldCheck,
  Sun,
  Zap,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { useAuthStore } from "@/features/auth/authStore";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [audioAlerts, setAudioAlerts] = React.useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = React.useState("Live (0s WebSocket)");
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-slate-700" />
            System Configuration & Clinical Preferences
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Workstation telemetry thresholds, interface tokens, and hospital network parameters.
          </p>
        </div>

        {saveSuccess && (
          <Alert variant="success" onDismiss={() => setSaveSuccess(false)}>
            System settings saved successfully.
          </Alert>
        )}

        {/* Theme Specification Card */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              Institutional Visual Standard (White Theme Enforced)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              In accordance with hospital clinical software protocols, the application operates exclusively in pure light mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">Theme Mode</span>
                <span className="text-slate-500 text-[11px]">Enforced Light Theme (Dark mode disabled)</span>
              </div>
              <Badge variant="success" className="text-xs">
                Light Theme Active
              </Badge>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Diagnostic monitors and clinical carts require maximum daylight readability and high-contrast text to prevent medication errors and misinterpretation of risk boundaries. Dark mode and theme toggles are strictly decommissioned.
            </p>
          </CardContent>
        </Card>

        {/* Telemetry & Alert Options */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-600" />
              Workstation Telemetry & Audio Dispatch
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Customize local workstation responses to critical incoming patient alerts.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Audio Chime on Critical Risk Alerts</span>
                  <span className="text-slate-500 text-[11px]">Audible tone when risk probability exceeds 80%</span>
                </div>
                <input
                  type="checkbox"
                  checked={audioAlerts}
                  onChange={(e) => setAudioAlerts(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">WebSocket Telemetry Ingestion</span>
                  <span className="text-slate-500 text-[11px]">Real-time asynchronous channel stream</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs bg-white text-emerald-700 border-emerald-200">
                  Zero-reload Push Active
                </Badge>
              </div>

              <Button type="submit" variant="default" size="sm" className="shadow-sm text-xs">
                Save Preferences
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Project Metadata */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              Project Accreditation & System Specifications
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Hospital Clinical Decision Support System architecture specs.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Project Code:</span>
              <span className="font-mono font-bold text-slate-900">HealthNova CDS-Enterprise</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Project Title:</span>
              <span className="text-slate-800 font-semibold text-right max-w-md">
                Enhancing Clinical Decision Support Systems Through Patient Risk Level Prediction Using Machine Learning Techniques
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Database Engine:</span>
              <span className="font-mono text-slate-800">Neon PostgreSQL 18.6 (Lakebase)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Broker & Real-time Layer:</span>
              <span className="font-mono text-slate-800">Upstash Redis + Django Channels ASGI (Daphne)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">ML Runtime:</span>
              <span className="font-mono text-slate-800">scikit-learn Ensemble (RF, AdaBoost, SVM, SHAP)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
