"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Calendar, HeartPulse, ShieldCheck, Download, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PatientMedicalRecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params?.recordId as string;
  const [correctionRequested, setCorrectionRequested] = React.useState(false);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/user/medical-records")} className="text-xs gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Records
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Cardiology Outpatient Clinic
              </Badge>
              <span className="text-xs font-mono text-slate-400">ID: {recordId}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Cardiovascular Evaluation &amp; Treatment Assessment
            </h1>
          </div>
          <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-200 self-start sm:self-auto">
            <Download className="h-3.5 w-3.5" /> Download Record
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400">Encounter Date:</span>
            <p className="font-bold text-slate-800 mt-0.5">2026-09-10 14:30</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400">Attending Provider:</span>
            <p className="font-bold text-slate-800 mt-0.5">Dr. Elena Vance, MD</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400">Blood Pressure:</span>
            <p className="font-bold text-slate-800 mt-0.5">132 / 84 mmHg</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400">Verification:</span>
            <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Clinician Signed
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Clinical Assessment &amp; Provider Notes</h3>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-700 space-y-2">
            <p>
              Patient presented for scheduled follow-up. Subjective report indicates good tolerance of prescribed antihypertensive regimen with no reported syncope, orthostatic dizziness, or pedal edema.
            </p>
            <p>
              Vital measurements remain stable with mean systolic pressure of 132 mmHg. Resting ECG demonstrates normal sinus rhythm with baseline flat ST segment unchanged from prior study. Continue current therapy.
            </p>
          </div>
        </div>

        {/* HIPAA Patient Rights & Request Correction */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            Medical records are cryptographically sealed. Direct modifications are restricted under clinical record retention laws.
          </p>
          {correctionRequested ? (
            <span className="text-xs font-semibold text-teal-700">Correction Request Submitted to Records Department</span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCorrectionRequested(true)}
              className="text-xs border-slate-200 text-slate-600 hover:text-slate-900"
            >
              Request Record Correction / Review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
