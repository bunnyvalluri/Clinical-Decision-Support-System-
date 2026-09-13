"use client";

import { Brain, CheckCircle2, Clock, Archive, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const REGISTRY_STAGES = [
  { stage: "Candidate", count: 2, color: "text-slate-600", bg: "bg-slate-100" },
  { stage: "Validated", count: 1, color: "text-blue-700", bg: "bg-blue-50" },
  { stage: "Approved", count: 1, color: "text-purple-700", bg: "bg-purple-50" },
  { stage: "Active", count: 1, color: "text-emerald-700", bg: "bg-emerald-50" },
  { stage: "Archived", count: 3, color: "text-slate-500", bg: "bg-slate-50" },
  { stage: "Rejected", count: 0, color: "text-rose-700", bg: "bg-rose-50" },
];

export default function ModelRegistryPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Model Registry — Lifecycle Stages</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {REGISTRY_STAGES.map(({ stage, count, color, bg }) => (
          <Card key={stage} className={`border border-slate-200`}>
            <CardContent className={`py-5 text-center rounded-xl ${bg}`}>
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-slate-600 mt-1">{stage}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm text-slate-600">Registry Notes</CardTitle></CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p>• <strong>Candidate</strong>: Under development, not yet validated.</p>
          <p>• <strong>Validated</strong>: Passed statistical validation. Awaiting clinical approval.</p>
          <p>• <strong>Approved</strong>: Clinically approved. Ready for production.</p>
          <p>• <strong>Active</strong>: In production. Predictions are being generated.</p>
          <p>• <strong>Archived</strong>: Retired. Historical predictions preserved.</p>
          <p>• <strong>Rejected</strong>: Failed validation or clinical review. Removed from pipeline.</p>
        </CardContent>
      </Card>
    </div>
  );
}
