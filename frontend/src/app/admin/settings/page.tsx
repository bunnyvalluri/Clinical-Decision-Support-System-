"use client";

import * as React from "react";
import {
  Settings,
  Bell,
  Lock,
  Shield,
  CheckCircle2,
  Sliders,
  Sparkles,
  Save,
  RefreshCw,
  Server,
  FileCheck,
  Radio,
  Clock,
  Key,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSettingsPage() {
  const [saved, setSaved] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Settings state
  const [alertSettings, setAlertSettings] = React.useState({
    smsDegraded: true,
    latencyWarning: true,
    unrecognizedDevice: true,
    slackWebhook: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL || "",
    pagerDutyKey: "",
  });

  const [securitySettings, setSecuritySettings] = React.useState({
    autoLockMins: "15",
    strictOriginCheck: true,
    enforceFido2: true,
    ipSubnetRestriction: "10.240.0.0/16",
    part11DualAuth: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    showToast("Preferences & Zero-Trust security policies successfully updated cluster-wide.");
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-semibold">
              Zero-Trust Policy Engine
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
              <Shield className="h-3 w-3" /> SOC 2 Type II Aligned
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Sliders className="h-7 w-7 text-purple-600" />
            Admin Preferences & Security Policies
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cluster-wide incident dispatch thresholds, session timeout rules, webhook endpoints, and cryptographic enforcement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={saved}
            className="text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {saved ? "Saved" : "Save Policies"}
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
              <Lock className="h-5 w-5 text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Security Posture</p>
              <p className="text-base sm:text-lg font-bold text-slate-900">Zero-Trust</p>
              <p className="text-[11px] text-purple-700 font-medium">100% Enforced</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <Clock className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Idle Auto-Lock</p>
              <p className="text-base sm:text-lg font-bold text-slate-900">{securitySettings.autoLockMins} Minutes</p>
              <p className="text-[11px] text-emerald-700 font-medium">Workstation policy</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
              <Key className="h-5 w-5 text-sky-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">FIDO2 Hardware Key</p>
              <p className="text-base sm:text-lg font-bold text-slate-900">Mandatory</p>
              <p className="text-[11px] text-sky-700 font-medium">All 5 staff roles</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
              <FileCheck className="h-5 w-5 text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Audit Retention</p>
              <p className="text-base sm:text-lg font-bold text-slate-900">7 Years</p>
              <p className="text-[11px] text-amber-700 font-medium">HIPAA § 164.312(b)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Alert Dispatch & Escalation Thresholds */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Alert Dispatch & Escalation Thresholds
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Define automated alerting rules for cluster downtime, high query latencies, and perimeter intrusions.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={alertSettings.smsDegraded}
                  onChange={(e) => setAlertSettings({ ...alertSettings, smsDegraded: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">SMS Alerts for Degraded Services</p>
                  <p className="text-xs text-slate-500">
                    Dispatch high-priority SMS immediately if Neon Database, Upstash Redis, or Celery workers become unreachable.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={alertSettings.latencyWarning}
                  onChange={(e) => setAlertSettings({ ...alertSettings, latencyWarning: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">High Latency Warning Threshold</p>
                  <p className="text-xs text-slate-500">
                    Notify on-call engineering team whenever p99 API latency exceeds 500ms for more than 2 consecutive minutes.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={alertSettings.unrecognizedDevice}
                  onChange={(e) => setAlertSettings({ ...alertSettings, unrecognizedDevice: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Unrecognized Device Login Security Email</p>
                  <p className="text-xs text-slate-500">
                    Send automated security emails whenever an administrative credential signs in from a previously unverified MAC or IP address.
                  </p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Slack Webhook URL</label>
                <Input
                  value={alertSettings.slackWebhook}
                  onChange={(e) => setAlertSettings({ ...alertSettings, slackWebhook: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">PagerDuty Routing Key</label>
                <Input
                  value={alertSettings.pagerDutyKey}
                  onChange={(e) => setAlertSettings({ ...alertSettings, pagerDutyKey: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Session & Security Policies */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-600" />
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Session & Workstation Security Policies
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Session expiration times, origin header checking, and multi-factor re-authentication rules.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Auto-Lock On Inactivity</label>
                <select
                  value={securitySettings.autoLockMins}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, autoLockMins: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-600"
                >
                  <option value="5">5 Minutes (High-security clinical wards)</option>
                  <option value="15">15 Minutes (Standard hospital workstation)</option>
                  <option value="30">30 Minutes (Admin desktop)</option>
                  <option value="60">60 Minutes (Read-only monitoring station)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Restricted Hospital Subnet (CIDR)</label>
                <Input
                  value={securitySettings.ipSubnetRestriction}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, ipSubnetRestriction: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={securitySettings.strictOriginCheck}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, strictOriginCheck: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Strict WebSocket Origin Header Checking</p>
                  <p className="text-xs text-slate-500">
                    Reject real-time WebSocket connection attempts from non-whitelisted origins to prevent CSWSH attacks.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={securitySettings.enforceFido2}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, enforceFido2: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Mandatory FIDO2 Hardware Keys for All Staff</p>
                  <p className="text-xs text-slate-500">
                    Require physical security key passkey verification on all clinical and administrative sign-ins.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={securitySettings.part11DualAuth}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, part11DualAuth: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">21 CFR Part 11 Dual-Authentication on ML Overrides</p>
                  <p className="text-xs text-slate-500">
                    Require physicians to re-enter password and clinical reason whenever overriding a high-risk AI diagnostic recommendation.
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => showToast("Default factory zero-trust policies restored.")}
            className="text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Restore Default Policies
          </Button>

          <Button
            type="submit"
            className="text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            Save & Enforce Policies
          </Button>
        </div>
      </form>
    </div>
  );
}
