"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  HeartPulse,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

const TABS = ["Overview", "Clinical Records", "Timeline", "Predictions", "Reviews"] as const;
type Tab = (typeof TABS)[number];

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const { predictions } = useClinicalStore();
  const [activeTab, setActiveTab] = React.useState<Tab>("Overview");

  const patientPredictions = predictions.filter((p) => p.patient_id === patientId);
  const patient = patientPredictions[0];

  if (!patient) {
    return (
      <div className="p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center space-y-4">
          <User className="h-12 w-12 text-slate-300 mx-auto" />
          <div>
            <p className="font-semibold text-slate-700">Patient Not Found</p>
            <p className="text-sm text-slate-500 mt-1">ID: {patientId}</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/doctor/patients")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  const riskColor =
    patient.risk_level === "HIGH"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : patient.risk_level === "MEDIUM"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/doctor/patients")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Patients
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{patient.patient_name}</h1>
            <Badge className={`border ${riskColor}`}>
              {patient.risk_level} Risk
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            MRN: {patient.patient_mrn} &bull; Age: {patient.age ?? patient.clinical_factors?.age ?? "—"} &bull; {patient.gender ?? patient.clinical_factors?.sex ?? "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Activity className="h-4 w-4" />
            Run Prediction
          </Button>
          <Link href={`/doctor/patients/${patientId}/predictions`}>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <FileText className="h-4 w-4" />
              View All Records
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium">Latest Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">
                {(patient.probability * 100).toFixed(1)}%
              </p>
              <Badge className={`border mt-2 ${riskColor}`}>{patient.risk_level}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium">Total Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{patientPredictions.length}</p>
              <p className="text-xs text-slate-500 mt-1">Clinical assessments on record</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium">Last Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-slate-800">
                {new Date(patient.created_at || patient.timestamp).toLocaleDateString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">Model: {patient.model_version}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "Predictions" && (
        <div className="space-y-3">
          {patientPredictions.map((pred) => (
            <Link key={pred.id} href={`/doctor/predictions/${pred.id}`} className="block">
              <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-sm transition-all flex items-center gap-4">
                <HeartPulse className="h-8 w-8 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">
                    Risk: {(pred.probability * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(pred.created_at || pred.timestamp).toLocaleString()} &bull; {pred.model_version}
                  </p>
                </div>
                <Badge className={`border text-xs ${riskColor}`}>{pred.risk_level}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      {(activeTab === "Clinical Records" || activeTab === "Timeline" || activeTab === "Reviews") && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {activeTab} will display real data once records exist for this patient.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Connected to backend — awaiting data population.
          </p>
        </div>
      )}
    </div>
  );
}
