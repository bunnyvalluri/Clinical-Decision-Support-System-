"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { PatientTimelineViewer } from "@/components/clinical/PatientTimelineViewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DoctorPatientTimelinePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();

  return (
    <DoctorLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/doctor/patients/${patientId}`)}
            className="gap-1 text-xs text-slate-700 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Patient Chart
          </Button>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-500 font-medium">Longitudinal Clinical Timeline</span>
        </div>

        {patientId && (
          <PatientTimelineViewer patientId={patientId} mrn={patientId} />
        )}
      </div>
    </DoctorLayout>
  );
}
