"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NurseSettingsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <Card>
        <CardHeader><CardTitle className="text-sm text-slate-600">Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Triage Alert Sound", description: "Play sound for new triage arrivals", enabled: true },
            { label: "Critical Alert Popup", description: "Show fullscreen popup for critical alerts", enabled: true },
            { label: "Shift Reminders", description: "Receive shift handover reminders", enabled: false },
          ].map(({ label, description, enabled }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div>
                <p className="font-medium text-slate-800 text-sm">{label}</p>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
              <div className={`h-6 w-11 rounded-full transition-colors cursor-pointer ${enabled ? "bg-sky-500" : "bg-slate-200"}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
