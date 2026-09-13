"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Activity, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RiskScreeningPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.push(`/nurse/patients/${patientId}`)} className="gap-2">
        <ArrowLeft className="h-4 w-4" />Patient
      </Button>
      <h1 className="text-xl font-bold text-slate-900">Risk Screening</h1>
      <div className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Nurses may submit triage vitals for AI risk screening. Full prediction results are routed to the assigned physician. Autonomous diagnosis is not permitted.
        </p>
      </div>
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <Activity className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="text-slate-500">Risk screening is triggered automatically after vital entry.</p>
          <p className="text-xs text-slate-400">Results are reviewed by the assigned physician before any clinical action.</p>
        </CardContent>
      </Card>
    </div>
  );
}
