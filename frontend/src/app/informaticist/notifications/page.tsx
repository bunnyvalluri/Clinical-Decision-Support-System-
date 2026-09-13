"use client";

import { Bell, Info } from "lucide-react";

export default function InformaticistNotificationsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
      <div className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
        <Info className="h-5 w-5 text-blue-500 shrink-0" />
        <p className="text-sm text-blue-700">
          Drift alerts, evaluation completions, and data quality events will appear here in real time.
        </p>
      </div>
    </div>
  );
}
