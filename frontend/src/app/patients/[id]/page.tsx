"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  HeartPulse,
  Plus,
  ShieldAlert,
  User,
  Zap,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VitalsTrendChart } from "@/components/ui/chart";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const { patients, predictions, addReport } = useClinicalStore();
  const [reportQueued, setReportQueued] = React.useState(false);

  const patient = patients.find((p) => p.id === patientId) || patients[0];
  const patientPredictions = predictions.filter(
    (p) => p.patient_id === patient.id || p.patient_mrn === patient.mrn
  );

  // Vitals history timeline data
  const vitalsTrendData = [
    { time: "06:00", heartRate: patient.heart_rate - 8, systolicBP: patient.systolic_bp - 10, spo2: 96 },
    { time: "09:00", heartRate: patient.heart_rate - 4, systolicBP: patient.systolic_bp - 5, spo2: 95 },
    { time: "12:00", heartRate: patient.heart_rate, systolicBP: patient.systolic_bp, spo2: patient.spo2 },
    { time: "15:00", heartRate: patient.heart_rate + 4, systolicBP: patient.systolic_bp + 6, spo2: patient.spo2 - 1 },
  ];

  const handleQueuePdfReport = () => {
    const reportId = `rep-pdf-${Date.now()}`;
    addReport({
      id: reportId,
      title: `Clinical Summary Report (${patient.mrn})`,
      report_type: "PATIENT_SUMMARY",
      patient_mrn: patient.mrn,
      status: "PROCESSING",
      progress: 45,
      created_at: new Date().toLocaleTimeString(),
    });
    setReportQueued(true);
    setTimeout(() => {
      router.push("/reports");
    }, 1200);
  };

  return (
    <Shell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/patients" className="hover:text-slate-800 flex items-center gap-1 font-medium">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Patients
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">{patient.first_name} {patient.last_name}</span>
        </div>

        {/* Patient Profile Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xl shadow-sm">
                {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {patient.first_name} {patient.last_name}
                  </h1>
                  <Badge
                    variant={
                      patient.latest_risk_level === "CRITICAL"
                        ? "critical"
                        : patient.latest_risk_level === "HIGH"
                        ? "high"
                        : patient.latest_risk_level === "MEDIUM"
                        ? "medium"
                        : "low"
                    }
                  >
                    {patient.latest_risk_level} RISK ({(patient.latest_risk_score * 100).toFixed(0)}%)
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="font-mono font-bold text-slate-700">{patient.mrn}</span>
                  <span>•</span>
                  <span>{patient.age} years old</span>
                  <span>•</span>
                  <span>{patient.gender === "M" ? "Male" : "Female"}</span>
                  <span>•</span>
                  <span>Blood: <strong className="text-slate-800">{patient.blood_type}</strong></span>
                  <span>•</span>
                  <span>Room: <strong className="text-slate-800">{patient.room_number}</strong></span>
                  <span>•</span>
                  <span>Physician: <strong className="text-slate-800">{patient.primary_doctor}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link href={`/patients/${patient.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
                >
                  <Edit className="h-3.5 w-3.5 text-slate-500" />
                  <span>Edit EHR</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleQueuePdfReport}
                disabled={reportQueued}
                className="text-xs gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
              >
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span>{reportQueued ? "Queued in Celery..." : "Export PDF Report"}</span>
              </Button>
              <Link href={`/clinical/new?patientId=${patient.id}`}>
                <Button variant="secondary" size="sm" className="text-xs gap-1.5 border border-slate-200 shadow-sm">
                  <Activity className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Record Vitals</span>
                </Button>
              </Link>
              <Link href={`/predictions/new?patientId=${patient.id}`}>
                <Button variant="default" size="sm" className="text-xs gap-1.5 shadow-sm">
                  <HeartPulse className="h-3.5 w-3.5" />
                  <span>Run Risk Model</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Current Bedside Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Heart Rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-amber-600">{patient.heart_rate}</span>
              <span className="text-xs text-slate-400 font-mono">bpm</span>
            </div>
            <span className="text-[11px] text-slate-400">Normal range 60-100</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Blood Pressure</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-rose-600">
                {patient.systolic_bp}/{patient.diastolic_bp}
              </span>
              <span className="text-xs text-slate-400 font-mono">mmHg</span>
            </div>
            <span className="text-[11px] text-slate-400">Resting hemodynamic</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">SpO2 (Pulse Oximetry)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-600">{patient.spo2}%</span>
              <span className="text-xs text-slate-400 font-mono">ambient</span>
            </div>
            <span className="text-[11px] text-slate-400">Oxygen saturation</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Blood Glucose</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-purple-600">{patient.blood_glucose}</span>
              <span className="text-xs text-slate-400 font-mono">mg/dL</span>
            </div>
            <span className="text-[11px] text-slate-400">Fasting glycemic marker</span>
          </div>
        </div>

        {/* 2-Column: Vitals Longitudinal Trend + Clinical Encounters */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Vitals Longitudinal Trend Chart (2 Columns) */}
          <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                Vitals Telemetry Longitudinal Trend
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Real-time continuous bedside monitor recordings.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <VitalsTrendChart data={vitalsTrendData} />
            </CardContent>
          </Card>

          {/* Encounters & Notes */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Recent Encounters
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Physician rounds and triage evaluations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs pt-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="font-bold text-slate-800">ICU Cardiology Rounds</span>
                  <span className="text-[10px]">Today 08:30</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Evaluated for persistent substernal chest discomfort. ECG shows minor ST changes. High sensitivity
                  troponin ordered.
                </p>
                <div className="text-[10px] text-emerald-700 font-mono font-semibold">Dr. Elena Vance, MD</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="font-bold text-slate-800">Emergency Admission</span>
                  <span className="text-[10px]">Sep 11, 2026</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Initial triage admission from ED. Patient placed on continuous telemetry monitor.
                </p>
                <div className="text-[10px] text-blue-700 font-mono font-semibold">Sarah Jenkins, RN</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prediction History for This Patient */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-emerald-600" />
                Historical Model Risk Assessments for {patient.first_name}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Ensemble predictions, probabilities, and physician overrides.
              </CardDescription>
            </div>
            <Link href={`/predictions/new?patientId=${patient.id}`}>
              <Button variant="default" size="sm" className="text-xs shadow-sm">
                Run New Assessment
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment Timestamp</TableHead>
                  <TableHead>Risk Tier</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Confidence Interval</TableHead>
                  <TableHead>Model Version</TableHead>
                  <TableHead>Clinician</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patientPredictions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-400 text-xs">
                      No prior assessments for this patient yet. Click &quot;Run Risk Model&quot; to evaluate.
                    </TableCell>
                  </TableRow>
                ) : (
                  patientPredictions.map((pred) => (
                    <TableRow key={pred.id}>
                      <TableCell className="text-xs font-mono text-slate-500">
                        {pred.timestamp}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pred.risk_level === "CRITICAL"
                              ? "critical"
                              : pred.risk_level === "HIGH"
                              ? "high"
                              : pred.risk_level === "MEDIUM"
                              ? "medium"
                              : "low"
                          }
                        >
                          {pred.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-slate-800">
                        {(pred.probability * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">
                        [{(pred.confidence_interval[0] * 100).toFixed(0)}% - {(pred.confidence_interval[1] * 100).toFixed(0)}%]
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">
                        {pred.model_name} {pred.model_version}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {pred.clinician_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/predictions/${pred.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-50">
                            Explain XAI
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
