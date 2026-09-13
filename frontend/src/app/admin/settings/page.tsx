"use client";

import * as React from "react";
import { Settings, Bell, Lock, Shield, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const [saved, setSaved] = React.useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin Preferences & Security</h1>
        {saved && (
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Preferences Saved
          </span>
        )}
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Alert Dispatch Thresholds</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Define system notification trigger levels for downtime and latency spikes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "SMS Alerts for Degraded Services", desc: "Dispatch SMS immediately if Neon DB or Celery is unavailable." },
            { label: "High Latency Warning Threshold", desc: "Notify when 99th percentile API latency exceeds 500ms." },
            { label: "Unrecognized Device Login Email", desc: "Send security emails whenever an administrator logs in from a new IP." },
          ].map(({ label, desc }) => (
            <label key={label} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" defaultChecked className="mt-1 rounded text-slate-900 focus:ring-slate-900" />
              <div>
                <p className="text-xs font-semibold text-slate-900">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Session & Security Policies</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Session expiration times and multi-factor re-authentication rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Auto-Lock On Inactivity", desc: "Automatically lock admin session after 15 minutes of inactivity." },
            { label: "Strict Origin Header Checking", desc: "Reject WebSocket connections with non-matching origin headers." },
          ].map(({ label, desc }) => (
            <label key={label} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" defaultChecked className="mt-1 rounded text-slate-900 focus:ring-slate-900" />
              <div>
                <p className="text-xs font-semibold text-slate-900">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-slate-900 text-white hover:bg-slate-800 text-xs">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
