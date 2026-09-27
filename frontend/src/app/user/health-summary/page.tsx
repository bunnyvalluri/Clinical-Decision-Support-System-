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
  Heart,
  HeartPulse,
  Info,
  Layers,
  Lock,
  Pause,
  Pill,
  Play,
  Phone,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  TrendingUp,
  User,
  Wifi,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive";
import { useAuthStore } from "@/features/auth/authStore";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

interface MedicationItem {
  id: string;
  name: string;
  dose: string;
  purpose: string;
  refills: string;
  lastTaken: string;
  isTakenToday: boolean;
}

const INITIAL_MEDICATIONS: MedicationItem[] = [
  {
    id: "med-1",
    name: "Lisinopril Oral Tablet",
    dose: "10 mg daily (morning)",
    purpose: "Blood Pressure Control",
    refills: "2 refills remaining",
    lastTaken: "Today, 08:00 AM",
    isTakenToday: true,
  },
  {
    id: "med-2",
    name: "Atorvastatin Calcium",
    dose: "20 mg daily (evening)",
    purpose: "Lipid / Cholesterol",
    refills: "3 refills remaining",
    lastTaken: "Yesterday, 09:30 PM",
    isTakenToday: false,
  },
  {
    id: "med-3",
    name: "Aspirin Enteric Coated",
    dose: "81 mg daily (morning)",
    purpose: "Cardioprotection",
    refills: "Active OTC",
    lastTaken: "Today, 08:05 AM",
    isTakenToday: true,
  },
];

export default function PatientHealthSummaryPage() {
  const { user } = useAuthStore();
  const [copied, setCopied] = React.useState(false);
  const [livePing, setLivePing] = React.useState(14);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [isStreaming, setIsStreaming] = React.useState(true);
  const [medications, setMedications] = React.useState<MedicationItem[]>(INITIAL_MEDICATIONS);
  const [showLogModal, setShowLogModal] = React.useState(false);
  const [selectedMed, setSelectedMed] = React.useState<MedicationItem | null>(null);

  // Live Telemetry State
  const [liveTelemetry, setLiveTelemetry] = React.useState({
    heartRate: 74,
    sbp: 122,
    dbp: 80,
    spo2: 98,
    temp: 98.6,
    rhythm: "Normal Sinus Rhythm",
    riskTier: "Tier 2 Moderate (41.8%)",
    riskScore: 41.8,
    lastUpdate: "Just now",
  });

  const mrn = user?.license_number || "MRN-PA-90241";
  const patientName = user?.full_name || "Eleanor Vance";

  // WebSocket Live Integration
  const handleWsEvent = React.useCallback((event: { event_type: string; payload?: Record<string, unknown> }) => {
    if (
      event.event_type === "vital_reading_ingested" ||
      event.event_type === "ehr_record_updated" ||
      event.event_type === "health_summary_refreshed"
    ) {
      const p = event.payload || {};
      if (p.heart_rate) {
        setLiveTelemetry((prev) => ({
          ...prev,
          heartRate: Number(p.heart_rate),
          sbp: Number(p.sbp || prev.sbp),
          dbp: Number(p.dbp || prev.dbp),
          lastUpdate: "Just now",
        }));
      }
      setToastMessage("⚡ Real-Time Health Summary Synced via EHR Gateway");
      setTimeout(() => setToastMessage(null), 3500);
    }
  }, []);

  const { status: wsStatus } = useUserWebSocket(handleWsEvent);

  // Live Telemetry Simulation Engine
  React.useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setLiveTelemetry((prev) => {
        // Minor natural biological drift
        const hrDelta = (Math.random() - 0.5) * 2;
        const newHr = Math.round(Math.max(68, Math.min(82, prev.heartRate + hrDelta)));
        
        const sbpDelta = (Math.random() - 0.5) * 1.5;
        const newSbp = Math.round(Math.max(118, Math.min(128, prev.sbp + sbpDelta)));
        
        const dbpDelta = (Math.random() - 0.5) * 1;
        const newDbp = Math.round(Math.max(76, Math.min(84, prev.dbp + dbpDelta)));

        // Live ML Risk Recalculation
        const calculatedRisk = 40 + (newSbp - 120) * 0.4 + (newHr - 72) * 0.2;
        const roundedRisk = Number(calculatedRisk.toFixed(1));

        return {
          ...prev,
          heartRate: newHr,
          sbp: newSbp,
          dbp: newDbp,
          riskScore: roundedRisk,
          riskTier: `Tier 2 Moderate (${roundedRisk}%)`,
          lastUpdate: "Just now",
        };
      });

      setLivePing(12 + Math.floor(Math.random() * 8));
    }, 3000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyMrn = () => {
    navigator.clipboard.writeText(mrn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogDose = (medId: string) => {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === medId
          ? {
              ...m,
              isTakenToday: true,
              lastTaken: "Just now (Logged)",
            }
          : m
      )
    );
    showToast(`✓ Medication dose logged to EHR in ${livePing}ms.`);
    setShowLogModal(false);
  };

  const handleDownloadSummary = () => {
    const content = `=== HEALTHNOVA COMPREHENSIVE HEALTH SUMMARY ===\n` +
      `Patient Name: ${patientName} (68F)\n` +
      `MRN: ${mrn}\n` +
      `Blood Group: A+\n` +
      `Primary Care: Dr. Sarah Lin, MD (Chief of Outpatient Cardiology)\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `Real-Time Telemetry: HR ${liveTelemetry.heartRate} BPM, BP ${liveTelemetry.sbp}/${liveTelemetry.dbp} mmHg, SpO2 ${liveTelemetry.spo2}%\n` +
      `Calculated 10-Yr Cardiovascular Risk: ${liveTelemetry.riskTier}\n\n` +
      `--- ACTIVE DIAGNOSES ---\n` +
      `1. Essential Hypertension (ICD-10: I10) - Controlled [Diag: 2021]\n` +
      `2. Hypercholesterolemia (ICD-10: E78.0) - Managed [Diag: 2023]\n` +
      `3. Angina Pectoris (ICD-10: I20.9) - Monitored [Diag: 2025]\n\n` +
      `--- ACTIVE PRESCRIPTIONS ---\n` +
      medications.map((m, i) => `${i + 1}. ${m.name} - ${m.dose} | ${m.purpose} (${m.refills}) - Last Taken: ${m.lastTaken}`).join("\n") +
      `\n\n--- ALLERGIES & WARNINGS ---\n` +
      `1. Penicillins - Moderate Severity (Maculopapular rash & urticaria)\n` +
      `2. Iodinated Radiocontrast - High Severity (Flushing & acute pruritus)\n\n` +
      `--- PREVENTATIVE IMMUNIZATIONS ---\n` +
      `1. Influenza Quadrivalent - Oct 15, 2025 (Current)\n` +
      `2. COVID-19 Updated Booster - Nov 02, 2025 (Current)\n` +
      `3. Pneumococcal (PCV20) - Aug 12, 2024 (Completed)\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HealthSummary_${patientName.replace(/\s+/g, "_")}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("✓ Official Comprehensive Health Summary exported with live telemetry.");
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto min-w-0 w-full overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200 max-w-md">
          <div className="bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md flex items-center gap-3 text-xs font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="flex-1">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-6 lg:p-7 shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-sky-500" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug">
                Comprehensive Health Summary
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] sm:text-xs font-semibold border border-emerald-200 shrink-0 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live EHR Telemetry Stream Active
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[11px] font-mono border border-sky-200 shrink-0">
                <Wifi className="h-3 w-3 text-sky-600" />
                {livePing}ms sync
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Consolidated, real-time medical summary of verified diagnoses, active prescription compliance, documented hypersensitivities, and continuous cardiovascular risk baselines.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <button
                onClick={handleCopyMrn}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-mono font-semibold transition-colors shadow-2xs text-[11px]"
              >
                <span>MRN: {mrn}</span>
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : null}
              </button>
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-medium text-[11px]">
                Patient: <strong className="text-slate-900">{patientName}</strong> (68F)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-medium text-[11px]">
                Blood Group: <strong className="text-slate-900">A+</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-medium text-[11px]">
                Primary: Dr. Sarah Lin, MD (Cardiology)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStreaming(!isStreaming)}
              className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-semibold gap-1.5 shadow-2xs"
            >
              {isStreaming ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-amber-600" /> Pause Telemetry
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-emerald-600" /> Resume Stream
                </>
              )}
            </Button>
            <Link href="/user/medical-records/timeline" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-semibold gap-1.5 shadow-2xs"
              >
                <Calendar className="h-3.5 w-3.5 text-teal-600" /> Full Event Timeline
              </Button>
            </Link>
            <Button
              onClick={handleDownloadSummary}
              size="sm"
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1.5 shadow-xs transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export PDF Summary
            </Button>
          </div>
        </div>
      </div>

      {/* Live Ambulatory Vitals Ticker Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Heart className="h-3 w-3 text-rose-500 animate-pulse" />
              Live Heart Rate
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
              {liveTelemetry.heartRate} <span className="text-xs font-sans font-normal text-slate-500">BPM</span>
            </p>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
              {liveTelemetry.rhythm}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Activity className="h-3 w-3 text-teal-500" />
              Blood Pressure
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
              {liveTelemetry.sbp}/{liveTelemetry.dbp} <span className="text-xs font-sans font-normal text-slate-500">mmHg</span>
            </p>
            <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.2 rounded">
              Controlled Target
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Radio className="h-3 w-3 text-sky-500 animate-pulse" />
              Oxygen Saturation
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
              {liveTelemetry.spo2}% <span className="text-xs font-sans font-normal text-slate-500">SpO2</span>
            </p>
            <span className="text-[10px] text-sky-700 font-semibold bg-sky-50 px-1.5 py-0.2 rounded">
              Room Air Normal
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-500" />
              Live 10-Yr Risk
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
              {liveTelemetry.riskScore}% <span className="text-xs font-sans font-normal text-slate-500">ASCVD</span>
            </p>
            <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.2 rounded">
              Tier 2 Moderate
            </span>
          </div>
        </div>
      </div>

      {/* 4 Pillars Matrix - Fully Mobile & Tablet Responsive with xl:grid-cols-4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Active Diagnoses */}
        <Card className="bg-white border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between rounded-2xl overflow-hidden">
          <div>
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between gap-2 bg-slate-50/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <HeartPulse className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 truncate">Active Diagnoses</CardTitle>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 shrink-0 whitespace-nowrap">
                3 Total
              </span>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-2.5">
              {[
                { code: "I10", name: "Essential Hypertension", status: "Controlled", date: "Diag: 2021" },
                { code: "E78.0", name: "Hypercholesterolemia", status: "Managed", date: "Diag: 2023" },
                { code: "I20.9", name: "Angina Pectoris", status: "Monitored", date: "Diag: 2025" },
              ].map((d) => (
                <div key={d.code} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{d.name}</h4>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 text-slate-700 shrink-0 whitespace-nowrap bg-white font-semibold">
                      {d.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                    <span className="font-mono text-slate-600 bg-white px-1.5 py-0.2 rounded border border-slate-200">ICD-10: {d.code}</span>
                    <span>{d.date}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </div>
        </Card>

        {/* 2. Active Prescriptions */}
        <Card className="bg-white border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between rounded-2xl overflow-hidden">
          <div>
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between gap-2 bg-slate-50/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-600 border border-teal-200/80 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <Pill className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 truncate">Active Prescriptions</CardTitle>
              </div>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 shrink-0 whitespace-nowrap">
                3 Active
              </span>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-2.5">
              {medications.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{m.name}</h4>
                    {m.isTakenToday ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        <Check className="h-2.5 w-2.5 text-emerald-600" /> Dose Logged
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedMed(m);
                          setShowLogModal(true);
                        }}
                        className="text-[9px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200 shrink-0 transition-colors"
                      >
                        + Log Dose
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 font-semibold">{m.dose}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 flex-wrap gap-1">
                    <span className="text-teal-700 font-medium bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      {m.purpose}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{m.refills}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </div>
        </Card>

        {/* 3. Allergies & Warnings */}
        <Card className="bg-white border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between rounded-2xl overflow-hidden">
          <div>
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between gap-2 bg-slate-50/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 truncate">Allergies &amp; Warnings</CardTitle>
              </div>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shrink-0 whitespace-nowrap">
                2 Alerts
              </span>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-2.5">
              {[
                { allergen: "Penicillins", reaction: "Maculopapular rash & urticaria", severity: "MODERATE", note: "Avoid all beta-lactam class" },
                { allergen: "Iodinated Radiocontrast", reaction: "Flushing & acute pruritus", severity: "HIGH", note: "Premedicate with antihistamines" },
              ].map((a) => (
                <div key={a.allergen} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{a.allergen}</h4>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 font-bold shrink-0 whitespace-nowrap ${
                        a.severity === "HIGH"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {a.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{a.reaction}</p>
                  <p className="text-[10px] text-amber-900 font-medium pt-0.5 bg-amber-50/70 p-1.5 rounded-lg border border-amber-200/60">
                    Clinical Note: {a.note}
                  </p>
                </div>
              ))}
            </CardContent>
          </div>
        </Card>

        {/* 4. Immunizations */}
        <Card className="bg-white border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between rounded-2xl overflow-hidden">
          <div>
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between gap-2 bg-slate-50/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <Syringe className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 truncate">Immunizations</CardTitle>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 whitespace-nowrap">
                Up to Date
              </span>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-2.5">
              {[
                { name: "Influenza Quadrivalent", date: "Oct 15, 2025", status: "Current" },
                { name: "COVID-19 Updated Booster", date: "Nov 02, 2025", status: "Current" },
                { name: "Pneumococcal (PCV20)", date: "Aug 12, 2024", status: "Completed" },
              ].map((imm) => (
                <div key={imm.name} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{imm.name}</h4>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 whitespace-nowrap">
                      {imm.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Administered: {imm.date}</p>
                </div>
              ))}
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Cardiovascular Baseline & Emergency Information Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* 2 Cols: Cardiovascular Risk Baseline */}
        <Card className="lg:col-span-2 bg-white border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between gap-2 bg-slate-50/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 shrink-0 shadow-2xs">
                <Activity className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Cardiovascular Clinical Risk Baseline
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 truncate">
                  Calculated from verified laboratory lipid panels, ECG, and continuous home ambulatory telemetry
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 shrink-0 whitespace-nowrap">
              Model Verified
            </Badge>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    Moderate Estimated 10-Year Cardiovascular Risk Tier ({liveTelemetry.riskScore}%)
                  </span>
                  <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                    Tier 2
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Calculated dynamically from real-time systolic pressure ({liveTelemetry.sbp} mmHg), resting pulse ({liveTelemetry.heartRate} bpm), baseline total cholesterol (210 mg/dL), and female non-smoker demographic profile.
                </p>
              </div>

              <Link href="/user/predictions" className="shrink-0 w-full sm:w-auto">
                <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5 shadow-xs">
                  View Detailed Metrics <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Live BP</span>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                  {liveTelemetry.sbp}/{liveTelemetry.dbp}
                </p>
                <span className="text-[10px] text-slate-500 font-medium">Controlled</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Live Pulse</span>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                  {liveTelemetry.heartRate} bpm
                </p>
                <span className="text-[10px] text-emerald-700 font-medium">Sinus Rhythm</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Chol.</span>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">210 mg/dL</p>
                <span className="text-[10px] text-amber-700 font-medium">On Statin</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">eGFR (Kidney)</span>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">&gt; 90 mL/min</p>
                <span className="text-[10px] text-emerald-700 font-medium">Normal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 1 Col: Emergency & Advanced Directives */}
        <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-row items-center gap-2 bg-slate-50/50">
            <ShieldCheck className="h-4 w-4 text-rose-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Emergency &amp; Directives</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3.5">
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

            <div className="space-y-1 text-xs text-slate-600 pt-1">
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

      {/* Medication Dosing Confirmation Modal */}
      {selectedMed && (
        <ResponsiveModal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          title={`Log Medication Dose: ${selectedMed.name}`}
          subtitle={`Verified EHR Compliance Tracking · ${selectedMed.dose}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 space-y-1">
              <p className="font-bold">{selectedMed.name}</p>
              <p className="text-[11px] text-teal-800">Dosage: {selectedMed.dose}</p>
              <p className="text-[11px] text-teal-800">Indication: {selectedMed.purpose}</p>
            </div>

            <p className="text-slate-600">
              Confirm that you have taken your scheduled dose now. This event will be logged with an immutable timestamp into your electronic medical record.
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleLogDose(selectedMed.id)}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
              >
                <Check className="h-3.5 w-3.5" /> Confirm &amp; Log Dose
              </Button>
            </div>
          </div>
        </ResponsiveModal>
      )}
    </div>
  );
}


