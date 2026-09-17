"use client";

import * as React from "react";
import { NurseLayout } from "@/components/layout/NurseLayout";
import { SearchIntelligence } from "@/components/web/SearchIntelligence";
import { ShieldCheck, HeartPulse } from "lucide-react";

export default function NurseResearchPage() {
  return (
    <NurseLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinical Workflow & Guideline Reference</h1>
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Approved Clinical Protocols
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Bedside guideline reference and nursing care protocols retrieved from accredited medical authorities.
          </p>
        </div>

        <SearchIntelligence role="NURSE" allowDomainFilter={false} />
      </div>
    </NurseLayout>
  );
}
