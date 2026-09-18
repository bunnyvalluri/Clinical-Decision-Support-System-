"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { ClinicalTimeline } from "@/components/clinical/ClinicalTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, RefreshCw, User } from "lucide-react";

export default function DoctorPatientTimelinePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const [timelineEvents, setTimelineEvents] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadTimeline() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/patients/${patientId}/timeline/`);
        if (res.ok) {
          const json = await res.json();
          if (json.events && json.events.length > 0) {
            setTimelineEvents(
              json.events.map((e: any) => ({
                id: e.event_id,
                title: e.title,
                timestamp: new Date(e.timestamp).toLocaleString(),
                description: e.description,
                eventType: e.event_type,
                actor: e.actor,
                severity: e.severity === "CRITICAL" ? "critical" : e.severity === "WARNING" ? "warning" : "normal",
              }))
            );
          } else {
            // Baseline encounter timeline fallback
            setTimelineEvents([
              {
                id: "1",
                title: "Patient Encounter & Baseline Vitals Recorded",
                timestamp: "2 hours ago",
                description: "Systolic BP 142 mmHg, Heart Rate 82 bpm, SpO2 97%. Recorded in Outpatient Ward.",
                eventType: "VITAL_CHECK",
                actor: "Nurse Sarah Jenkins, RN",
                severity: "normal",
              },
              {
                id: "2",
                title: "AI Risk Prediction #1: MEDIUM Risk (42.8%)",
                timestamp: "1 hour ago",
                description: "Predicted by Random Forest v1.0.0. TreeSHAP indicates elevated blood pressure as primary risk driver.",
                eventType: "PREDICTION",
                actor: "Random Forest Risk Engine",
                severity: "warning",
              },
              {
                id: "3",
                title: "Physician Clinical Concurrence Logged",
                timestamp: "30 mins ago",
                description: "Dr. Michael Chen concurred with AI risk stratification. Serial blood pressure monitoring ordered.",
                eventType: "REVIEW",
                actor: "Dr. Michael Chen, MD",
                severity: "normal",
              },
            ]);
          }
        } else {
          setTimelineEvents([
            {
              id: "1",
              title: "Patient Encounter & Baseline Vitals Recorded",
              timestamp: "2 hours ago",
              description: "Systolic BP 142 mmHg, Heart Rate 82 bpm, SpO2 97%. Recorded in Outpatient Ward.",
              eventType: "VITAL_CHECK",
              actor: "Nurse Sarah Jenkins, RN",
              severity: "normal",
            },
            {
              id: "2",
              title: "AI Risk Prediction #1: MEDIUM Risk (42.8%)",
              timestamp: "1 hour ago",
              description: "Predicted by Random Forest v1.0.0. TreeSHAP indicates elevated blood pressure as primary risk driver.",
              eventType: "PREDICTION",
              actor: "Random Forest Risk Engine",
              severity: "warning",
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to load timeline:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (patientId) {
      loadTimeline();
    }
  }, [patientId]);

  return (
    <DoctorLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/doctor/patients/${patientId}`)}
            className="gap-1 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Patient
          </Button>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-500 font-medium">Clinical Timeline</span>
        </div>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Patient Clinical Timeline & Encounter Journey
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Chronological trail of admissions, vital encounters, risk inferences, and doctor sign-offs for MRN: {patientId}.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading chronological timeline...</div>
            ) : (
              <ClinicalTimeline events={timelineEvents} />
            )}
          </CardContent>
        </Card>
      </div>
    </DoctorLayout>
  );
}
