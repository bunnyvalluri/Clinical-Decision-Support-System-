"use client";

import * as React from "react";
import { Shell } from "@/components/layout/Shell";
import { SearchIntelligence } from "@/components/web/SearchIntelligence";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, BookOpen, ShieldCheck } from "lucide-react";

export default function PatientEducationPage() {
  return (
    <Shell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Health Education & Verified Medical Resources</h1>
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Health Authorities
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Search peer-reviewed patient education guides from the CDC, NIH, and World Health Organization.
          </p>
        </div>

        {/* Mandatory Non-Diagnostic Clinical Disclaimer */}
        <Card className="border border-blue-200 bg-blue-50/70 shadow-xs">
          <CardContent className="p-4 flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Clinical Disclaimer:</span>
              The resources retrieved here are intended strictly for patient education and informational purposes. They do not constitute medical diagnoses, prescriptions, treatment recommendations, or clinical advice. If you are experiencing symptoms or have questions regarding a medical condition, please contact your healthcare provider or attending clinician directly.
            </div>
          </CardContent>
        </Card>

        {/* Constrained Search (TIER_1 only) */}
        <SearchIntelligence role="PATIENT" allowDomainFilter={false} />
      </div>
    </Shell>
  );
}
