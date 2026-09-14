"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileCheck,
  HeartPulse,
  Info,
  Pill,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/authStore";

export default function PatientHealthSummaryPage() {
  const { user } = useAuthStore();
  const [copied, setCopied] = React.useState(false);

  const mrn = user?.license_number || "MRN-PA-90241";
  const patientName = user?.full_name || "Eleanor Vance";

  const handleCopyMrn = () => {
    navigator.clipboard.writeText(mrn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-sky-500" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Comprehensive Health Summary
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Verified Clinical Profile
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Consolidated electronic medical summary of verified diagnoses, active prescription regimens, documented hypersensitivities, and preventative immunization baselines.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <button
                onClick={handleCopyMrn}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-mono font-semibold transition-colors"
              >
                <span>MRN: {mrn}</span>
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : null}
              </button>
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-medium">
                Patient: <strong className="text-slate-900">{patientName}</strong> (68F)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-medium">
                Blood Group: <strong className="text-slate-900">A+</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-medium">
                Primary: Dr. Sarah Lin, MD (Cardiology)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link href="/user/medical-records/timeline">
              <Button
                variant="outline"
                size="sm"
                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-semibold gap-1.5 shadow-2xs"
              >
                <Calendar className="h-3.5 w-3.5 text-teal-600" /> Full Event Timeline
              </Button>
            </Link>
            <Button
              onClick={() => alert("Downloading Official Comprehensive Health Summary (PDF)...")}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1.5 shadow-xs"
            >
              <Download className="h-3.5 w-3.5" /> Export PDF Summary
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Pillars Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Diagnoses */}
        <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <HeartPulse className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900">Active Diagnoses</CardTitle>
            </div>
            <span className="text-[11px] font-bold text-slate-400">3 Total</span>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3">
            {[
              { code: "I10", name: "Essential Hypertension", status: "Controlled", date: "Diag: 2021" },
              { code: "E78.0", name: "Hypercholesterolemia", status: "Managed", date: "Diag: 2023" },
              { code: "I20.9", name: "Angina Pectoris", status: "Monitored", date: "Diag: 2025" },
            ].map((d) => (
              <div key={d.code} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{d.name}</h4>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 text-slate-600">
                    {d.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span className="font-mono">ICD-10: {d.code}</span>
                  <span>{d.date}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Current Medications */}
        <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <Pill className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900">Active Prescriptions</CardTitle>
            </div>
            <span className="text-[11px] font-bold text-slate-400">3 Active</span>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3">
            {[
              { name: "Lisinopril Oral Tablet", dose: "10 mg daily (morning)", purpose: "Blood Pressure Control", refills: "2 refills remaining" },
              { name: "Atorvastatin Calcium", dose: "20 mg daily (evening)", purpose: "Lipid / Cholesterol", refills: "3 refills remaining" },
              { name: "Aspirin Enteric Coated", dose: "81 mg daily (morning)", purpose: "Cardioprotection", refills: "Active OTC" },
            ].map((m) => (
              <div key={m.name} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{m.name}</h4>
                </div>
                <p className="text-xs text-slate-700 font-semibold">{m.dose}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span className="text-teal-700 font-medium">{m.purpose}</span>
                  <span>{m.refills}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Documented Allergies */}
        <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <AlertCircle className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900">Allergies &amp; Warnings</CardTitle>
            </div>
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              2 Alerts
            </span>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3">
            {[
              { allergen: "Penicillins", reaction: "Maculopapular rash & urticaria", severity: "MODERATE", note: "Avoid all beta-lactam class" },
              { allergen: "Iodinated Radiocontrast", reaction: "Flushing & acute pruritus", severity: "HIGH", note: "Premedicate with antihistamines" },
            ].map((a) => (
              <div key={a.allergen} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{a.allergen}</h4>
                  <Badge variant={a.severity === "HIGH" ? "destructive" : "warning"} className="text-[9px] px-1.5 py-0">
                    {a.severity}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">{a.reaction}</p>
                <p className="text-[10px] text-amber-800 font-medium pt-0.5">Clinical Note: {a.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Immunizations & Preventative */}
        <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Syringe className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900">Immunizations</CardTitle>
            </div>
            <span className="text-[11px] font-bold text-emerald-600">Up to Date</span>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3">
            {[
              { name: "Influenza Quadrivalent", date: "Oct 15, 2025", status: "Current" },
              { name: "COVID-19 Updated Booster", date: "Nov 02, 2025", status: "Current" },
              { name: "Pneumococcal (PCV20)", date: "Aug 12, 2024", status: "Completed" },
            ].map((imm) => (
              <div key={imm.name} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{imm.name}</h4>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {imm.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Administered: {imm.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Cardiovascular Baseline & Emergency Information Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2 Cols: Cardiovascular Risk Baseline */}
        <Card className="lg:col-span-2 bg-white border-slate-200/90 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Cardiovascular Clinical Risk Baseline
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Calculated from verified laboratory lipid panels, ECG, and home ambulatory telemetry
                </CardDescription>
              </div>
            </div>
            <Badge variant="success" className="text-xs">Model Verified</Badge>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    Moderate Estimated 10-Year Cardiovascular Risk Tier (42%)
                  </span>
                  <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Tier 2
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Based on historical physiological markers (mean resting systolic pressure of 134 mmHg, baseline cholesterol of 210 mg/dL, and female non-smoker demographic profile).
                </p>
              </div>

              <Link href="/user/predictions" className="shrink-0">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5 shadow-xs">
                  View Detailed Metrics <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Baseline BP</span>
                <p className="text-base font-extrabold text-slate-900">134/86</p>
                <span className="text-[10px] text-slate-500 font-medium">Controlled</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Resting HR</span>
                <p className="text-base font-extrabold text-slate-900">76 bpm</p>
                <span className="text-[10px] text-emerald-600 font-medium">Sinus Rhythm</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Chol.</span>
                <p className="text-base font-extrabold text-slate-900">210 mg/dL</p>
                <span className="text-[10px] text-amber-600 font-medium">On Statin</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">eGFR (Kidney)</span>
                <p className="text-base font-extrabold text-slate-900">&gt; 90 mL/min</p>
                <span className="text-[10px] text-emerald-600 font-medium">Normal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 1 Col: Emergency & Advanced Directives */}
        <Card className="bg-white border-slate-200/90 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-rose-600" />
              <CardTitle className="text-sm font-bold text-slate-900">Emergency &amp; Directives</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Designated Emergency Contact</span>
              <p className="text-xs font-bold text-slate-900">Robert Vance (Spouse)</p>
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" /> (555) 392-1084
              </p>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Preferred Hospital Facility</span>
              <p className="text-xs font-bold text-slate-900">General Heart &amp; Vascular Pavilion</p>
              <p className="text-[11px] text-slate-500">Cardiology Inpatient &amp; ER</p>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>Advance Directives:</span>
                <span className="font-semibold text-emerald-700">On File (Full Code)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Medical Power of Attorney:</span>
                <span className="font-semibold text-slate-800">Robert Vance</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
