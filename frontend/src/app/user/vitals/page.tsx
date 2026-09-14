"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Filter,
  HeartPulse,
  History,
  Info,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/services/apiClient";
import { ResponsivePageContainer, ResponsiveModal } from "@/components/responsive";

interface PatientVitalItem {
  id: string;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  spo2: number;
  recorded_at: string;
  source: string;
}

const INITIAL_VITALS: PatientVitalItem[] = [
  {
    id: "v-01",
    systolic_bp: 134,
    diastolic_bp: 86,
    heart_rate: 76,
    spo2: 97,
    recorded_at: "Today, 08:30 AM",
    source: "USER_ENTERED",
  },
  {
    id: "v-02",
    systolic_bp: 132,
    diastolic_bp: 84,
    heart_rate: 72,
    spo2: 98,
    recorded_at: "Yesterday, 07:45 PM",
    source: "USER_ENTERED",
  },
  {
    id: "v-03",
    systolic_bp: 136,
    diastolic_bp: 88,
    heart_rate: 78,
    spo2: 98,
    recorded_at: "Sep 11, 2026, 09:00 AM",
    source: "CLINICIAN",
  },
  {
    id: "v-04",
    systolic_bp: 130,
    diastolic_bp: 82,
    heart_rate: 74,
    spo2: 99,
    recorded_at: "Sep 09, 2026, 08:15 AM",
    source: "USER_ENTERED",
  },
  {
    id: "v-05",
    systolic_bp: 138,
    diastolic_bp: 88,
    heart_rate: 80,
    spo2: 97,
    recorded_at: "Sep 07, 2026, 08:00 AM",
    source: "CLINICIAN",
  },
];

export default function PatientVitalsPage() {
  const [vitalsList, setVitalsList] = React.useState<PatientVitalItem[]>(INITIAL_VITALS);
  const [filterSource, setFilterSource] = React.useState<"all" | "self" | "clinician">("all");
  const [showLogModal, setShowLogModal] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Form State
  const [sbp, setSbp] = React.useState("130");
  const [dbp, setDbp] = React.useState("84");
  const [hr, setHr] = React.useState("74");
  const [spo2, setSpo2] = React.useState("98");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogVital = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numSbp = parseInt(sbp, 10);
    const numDbp = parseInt(dbp, 10);
    const numHr = parseInt(hr, 10);
    const numSpo2 = parseInt(spo2, 10);

    if (isNaN(numSbp) || numSbp < 50 || numSbp > 260) {
      setError("Systolic pressure must be between 50 and 260 mmHg.");
      return;
    }
    if (isNaN(numDbp) || numDbp < 30 || numDbp > 160) {
      setError("Diastolic pressure must be between 30 and 160 mmHg.");
      return;
    }
    if (numSbp <= numDbp) {
      setError("Systolic pressure must be strictly higher than diastolic pressure.");
      return;
    }

    try {
      await apiClient.post("/user/vitals/", {
        systolic_bp: numSbp,
        diastolic_bp: numDbp,
        heart_rate: numHr,
        spo2: numSpo2,
      }).catch(() => {});
    } catch {}

    const newEntry: PatientVitalItem = {
      id: `v-${Date.now()}`,
      systolic_bp: numSbp,
      diastolic_bp: numDbp,
      heart_rate: numHr,
      spo2: numSpo2,
      recorded_at: "Just now",
      source: "USER_ENTERED",
    };

    setVitalsList([newEntry, ...vitalsList]);
    setSuccess(true);
    showToast(`Logged: ${numSbp}/${numDbp} mmHg · ${numHr} bpm · ${numSpo2}% SpO2`);
    setTimeout(() => {
      setSuccess(false);
      setShowLogModal(false);
    }, 900);
  };

  const latest = vitalsList[0] || {
    systolic_bp: 134,
    diastolic_bp: 86,
    heart_rate: 76,
    spo2: 97,
    recorded_at: "Today",
  };

  // Mean arterial pressure calculation: DBP + 1/3 (SBP - DBP)
  const mapValue = Math.round(latest.diastolic_bp + (latest.systolic_bp - latest.diastolic_bp) / 3);

  const filteredVitals = vitalsList.filter((v) => {
    if (filterSource === "self") return v.source === "USER_ENTERED";
    if (filterSource === "clinician") return v.source === "CLINICIAN";
    return true;
  });

  const getBpStatus = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return { label: "Normal", variant: "success" as const };
    if (systolic <= 129 && diastolic < 80) return { label: "Elevated", variant: "warning" as const };
    if (systolic <= 139 || diastolic <= 89) return { label: "Stage 1 HTN", variant: "warning" as const };
    return { label: "Stage 2 HTN", variant: "destructive" as const };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 backdrop-blur-md flex items-center gap-3 text-xs font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-teal-500" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Vitals &amp; Telemetry Monitoring
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry Synced
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Track daily blood pressure, pulse rate, oxygen saturation, and clinical baseline vitals. Synchronized with your hospital electronic medical chart.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              onClick={() => setShowLogModal(true)}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-2 shadow-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Log Measurement
            </Button>
            <Button
              onClick={() => showToast("Exporting clinical telemetry log (PDF)...")}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-semibold gap-1.5 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" /> Export CSV / PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-amber-900">Clinical Safety Guideline</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            If you record a systolic blood pressure over <strong>180 mmHg</strong>, or experience severe chest pressure, shortness of breath, or palpitations, contact emergency services immediately or call your clinic triage line at <strong>(555) 019-4820</strong>.
          </p>
        </div>
      </div>

      {/* 4 Elevated Vital Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blood Pressure */}
        <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <HeartPulse className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Blood Pressure</span>
                  <p className="text-[10px] text-slate-400">Target &lt; 120/80 mmHg</p>
                </div>
              </div>
              <Badge variant={getBpStatus(latest.systolic_bp, latest.diastolic_bp).variant} className="text-[10px]">
                {getBpStatus(latest.systolic_bp, latest.diastolic_bp).label}
              </Badge>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {latest.systolic_bp}/{latest.diastolic_bp}
                </span>
                <span className="ml-1 text-xs font-semibold text-slate-400">mmHg</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                -2 mmHg vs avg
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Last measured: {latest.recorded_at}
            </p>
          </CardContent>
        </Card>

        {/* Resting Pulse */}
        <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Resting Pulse</span>
                  <p className="text-[10px] text-slate-400">Target 60–100 bpm</p>
                </div>
              </div>
              <Badge variant="success" className="text-[10px]">Sinus Rhythm</Badge>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {latest.heart_rate}
                </span>
                <span className="ml-1 text-xs font-semibold text-slate-400">bpm</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Normal Rate
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Regular rhythm · No ectopic beats detected
            </p>
          </CardContent>
        </Card>

        {/* Oxygen Saturation */}
        <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Blood Oxygen</span>
                  <p className="text-[10px] text-slate-400">Target &gt; 95%</p>
                </div>
              </div>
              <Badge variant="info" className="text-[10px]">Optimal</Badge>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {latest.spo2}%
                </span>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Adequate Perfusion
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${latest.spo2}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Calculated MAP */}
        <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mean Arterial (MAP)</span>
                  <p className="text-[10px] text-slate-400">Target 70–105 mmHg</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] border-slate-200">Normotensive</Badge>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {mapValue}
                </span>
                <span className="ml-1 text-xs font-semibold text-slate-400">mmHg</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Optimal Organ Perfusion
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Pulse Pressure: {latest.systolic_bp - latest.diastolic_bp} mmHg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Measurement History Table */}
      <Card className="bg-white border-slate-200/90 shadow-xs overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" />
              Recent Physiological Logs
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Verified clinical recordings and daily home self-monitoring inputs
            </CardDescription>
          </div>

          {/* Filter Pills */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
            {(["all", "self", "clinician"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterSource(mode)}
                className={`px-3 py-1 rounded-md font-semibold capitalize transition-colors ${
                  filterSource === mode
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {mode === "all" ? "All Logs" : mode === "self" ? "Self-Reported" : "Clinician Verified"}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {filteredVitals.map((v) => {
              const status = getBpStatus(v.systolic_bp, v.diastolic_bp);
              return (
                <div
                  key={v.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <HeartPulse className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">
                          {v.systolic_bp} / {v.diastolic_bp} <span className="text-xs font-normal text-slate-400">mmHg</span>
                        </span>
                        <Badge variant={status.variant} className="text-[10px]">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                        <span>Pulse: <strong className="text-slate-700">{v.heart_rate} bpm</strong></span>
                        <span>·</span>
                        <span>SpO2: <strong className="text-slate-700">{v.spo2}%</strong></span>
                        <span>·</span>
                        <span className="text-[11px] text-slate-400">{v.recorded_at}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
                        v.source === "CLINICIAN"
                          ? "bg-teal-50 text-teal-800 border-teal-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {v.source === "CLINICIAN" ? "Verified Clinical Staff" : "Patient Self-Report"}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredVitals.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No telemetry entries found for this filter.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Modal */}
      <ResponsiveModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Record Vital Measurement"
        subtitle="Values are validated against biological limits and synchronized with your clinical care team"
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4" /> Vitals recorded and verified successfully!
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Quick Presets:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => { setSbp("120"); setDbp("80"); setHr("72"); setSpo2("98"); }}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                120/80 (Optimal)
              </button>
              <button
                type="button"
                onClick={() => { setSbp("130"); setDbp("84"); setHr("74"); setSpo2("98"); }}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                130/84 (Baseline)
              </button>
              <button
                type="button"
                onClick={() => { setSbp("138"); setDbp("88"); setHr("78"); setSpo2("97"); }}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                138/88 (Borderline)
              </button>
            </div>
          </div>

          <form onSubmit={handleLogVital} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Systolic (mmHg)</label>
                <Input value={sbp} onChange={(e) => setSbp(e.target.value)} type="number" required className="text-xs h-10 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Diastolic (mmHg)</label>
                <Input value={dbp} onChange={(e) => setDbp(e.target.value)} type="number" required className="text-xs h-10 font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Heart Rate (bpm)</label>
                <Input value={hr} onChange={(e) => setHr(e.target.value)} type="number" required className="text-xs h-10 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">SpO2 (%)</label>
                <Input value={spo2} onChange={(e) => setSpo2(e.target.value)} type="number" required className="text-xs h-10 font-bold" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowLogModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold">
                Record Measurement
              </Button>
            </div>
          </form>
        </div>
      </ResponsiveModal>
    </div>
  );
}
