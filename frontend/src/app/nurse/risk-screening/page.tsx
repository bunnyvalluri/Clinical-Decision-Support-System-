"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Info,
  RefreshCw,
  Search,
  ShieldAlert,
  User,
  Zap,
} from "lucide-react";
import { NurseLayout } from "@/components/layout/NurseLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/services/apiClient";

interface PatientRiskItem {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  age?: number;
  gender?: string;
  latest_risk_level?: string;
  latest_risk_score?: number;
  latest_vitals?: {
    systolic_bp?: number;
    diastolic_bp?: number;
    heart_rate?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
    body_temperature?: number;
  };
}

export default function NurseRiskScreeningPage() {
  const [patients, setPatients] = React.useState<PatientRiskItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [escalatingId, setEscalatingId] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  const fetchPatients = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/patients/");
      const items = res.data?.results || res.data?.data || res.data || [];
      setPatients(Array.isArray(items) ? items : []);
    } catch (err) {
      console.warn("Could not fetch patient risk list:", err);
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleEscalate = async (patient: PatientRiskItem) => {
    setEscalatingId(patient.id);
    try {
      await apiClient.post("/clinical/triage/escalate/", {
        patient_id: patient.id,
        reason: `Bedside acute deterioration screening triggered for ${patient.first_name} ${patient.last_name} (${patient.mrn}). Priority evaluation requested.`,
        priority: "HIGH",
      });
      setActionSuccess(`Physician escalation dispatched for ${patient.mrn}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error("Escalation failed:", err);
    } finally {
      setEscalatingId(null);
    }
  };

  const filtered = patients.filter((p) => {
    const full = `${p.first_name} ${p.last_name} ${p.mrn}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  return (
    <NurseLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bedside Risk Screening</h1>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                Triage &amp; Escalation Hub
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Physiological risk stratification, deterministic qSOFA sepsis tracking, and rapid physician escalation.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPatients}
            disabled={isLoading}
            className="gap-1.5 text-xs self-start md:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Census
          </Button>
        </div>

        {/* Clinical Alert Notice */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-xs text-amber-900 flex items-start gap-3">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Deterministic Triage Policy Invariant</p>
            <p className="text-amber-800">
              Immediate bedside evaluation is required for patients with altered mental status, SBP ≤ 100 mmHg, or RR ≥ 22
              breaths/min (qSOFA ≥ 2). Automated predictions augment but never replace nurse clinical judgment.
            </p>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by patient name or MRN…"
              className="pl-9 text-xs bg-white border-slate-200"
            />
          </div>
        </div>

        {/* Patient Risk Census */}
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="p-5 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">Ward Patient Census &amp; Acuity Tiers</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {filtered.length} patients monitored under bedside screening protocol.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading patient census...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-sm font-medium text-slate-500">
                No clinical events available.
              </div>
            ) : (
              filtered.map((patient) => {
                const risk = patient.latest_risk_level || "LOW";
                const isCritical = risk === "CRITICAL" || risk === "HIGH";
                return (
                  <div key={patient.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-3.5">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isCritical ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-blue-50 text-blue-600 border border-blue-200"}`}>
                        <User className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{patient.first_name} {patient.last_name}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs font-mono text-slate-500">MRN: {patient.mrn}</span>
                          <Badge variant="outline" className={`text-[10px] font-bold ${isCritical ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                            {risk}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {patient.age ? `${patient.age} yrs` : "Adult"} · {patient.gender || "Unspecified"} · Triage Status: Active Census
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEscalate(patient)}
                        disabled={escalatingId === patient.id}
                        className="gap-1.5 text-xs text-rose-700 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                      >
                        <AlertOctagon className="h-3.5 w-3.5" />
                        {escalatingId === patient.id ? "Escalating..." : "Escalate to MD"}
                      </Button>
                      <Link href={`/doctor/patients/${patient.id}/predictions`}>
                        <Button size="sm" variant="ghost" className="gap-1 text-xs">
                          Risk Assessment
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </NurseLayout>
  );
}
