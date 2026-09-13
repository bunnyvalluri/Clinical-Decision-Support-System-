"use client";

import { FileText } from "lucide-react";

export default function DoctorReportsPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
      <div className="bg-white border border-slate-200 rounded-xl p-16 text-center space-y-3">
        <FileText className="h-12 w-12 text-slate-300 mx-auto" />
        <p className="text-slate-500">Clinical reports will appear here once generated.</p>
        <p className="text-xs text-slate-400">Reports are generated from authorized prediction and clinical data.</p>
      </div>
    </div>
  );
}
