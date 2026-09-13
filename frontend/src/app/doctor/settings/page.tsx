"use client";

import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DoctorSettingsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-slate-600">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Email Notifications", description: "Receive high-risk alerts by email", enabled: true },
            { label: "Real-time Alerts", description: "Browser push notifications for urgent cases", enabled: true },
            { label: "Clinical Review Reminders", description: "Daily digest of pending reviews", enabled: false },
          ].map(({ label, description, enabled }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div>
                <p className="font-medium text-slate-800 text-sm">{label}</p>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
              <div className={`h-6 w-11 rounded-full transition-colors cursor-pointer ${enabled ? "bg-emerald-500" : "bg-slate-200"}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
