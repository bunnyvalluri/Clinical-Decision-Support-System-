"use client";

import * as React from "react";
import {
  Stethoscope,
  ShieldCheck,
  Sparkles,
  Radio,
  RefreshCw,
  Zap,
  Activity,
  User,
  HeartPulse,
  Brain,
  FileText,
  AlertTriangle,
  ChevronRight,
  Send,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Copy,
  Cpu,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIChat } from "@/components/ai/AIChat";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import apiClient from "@/services/apiClient";
import { BedsideTelemetryBadge } from "@/components/clinical";


interface ActivePatientContext {
  id: string;
  name: string;
  mrn: string;
  risk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  vitals: string;
  topConcern: string;
}

const ACTIVE_PATIENTS: ActivePatientContext[] = [
  {
    id: "pat-1",
    name: "Elena Rostova",
    mrn: "MRN-78429",
    risk: "CRITICAL",
    vitals: "HR 118, BP 84/52, SpO2 92%, Lactate 4.8 mmol/L",
    topConcern: "Septic Shock / SSC 1-Hour Protocol",
  },
  {
    id: "pat-2",
    name: "Arthur Pendelton",
    mrn: "MRN-91204",
    risk: "HIGH",
    vitals: "HR 104, BP 158/96, SpO2 95%, Trop I 1.82 ng/mL",
    topConcern: "Acute Coronary Syndrome / Cath Lab Evaluation",
  },
  {
    id: "pat-3",
    name: "Clara Oswald",
    mrn: "MRN-33019",
    risk: "HIGH",
    vitals: "HR 88, BP 172/98, SpO2 97%, NIHSS 14",
    topConcern: "Acute Ischemic Stroke / Thrombolysis Eligibility",
  },
  {
    id: "pat-4",
    name: "Gregory House",
    mrn: "MRN-64012",
    risk: "MEDIUM",
    vitals: "HR 96, BP 110/70, SpO2 90%, PaO2/FiO2 210",
    topConcern: "Acute Respiratory Distress Syndrome (ARDS)",
  },
];

const DOCTOR_QUERIES = [
  {
    label: "Sepsis Resuscitation Protocol",
    text: "What is the SSC-2021 resuscitation protocol for lactic acid 4.8 mmol/L with MAP < 65 mmHg in septic shock?",
  },
  {
    label: "KDIGO AKI Criteria",
    text: "Check KDIGO Stage 2 AKI criteria for serum creatinine rising from baseline 1.0 to 2.3 mg/dL and recommend urine output monitoring.",
  },
  {
    label: "ACS Troponin & Dual Antiplatelet",
    text: "Evaluate protocol recommendations for acute chest pain with ST depression, elevated Troponin I (1.82 ng/mL), and DAPT timing.",
  },
  {
    label: "Stroke Thrombolysis Checklist",
    text: "Review AHA/ASA IV thrombolytic eligibility checklist for NIHSS 14 with onset 2.5 hours ago and blood pressure 172/98 mmHg.",
  },
  {
    label: "ARDS Protective Ventilation",
    text: "Summarize low tidal volume mechanical ventilation parameters (6 mL/kg PBW) and PEEP titration criteria for PaO2/FiO2 210.",
  },
];

export default function DoctorAIAssistantPage() {
  const [selectedPatient, setSelectedPatient] = React.useState<ActivePatientContext | null>(ACTIVE_PATIENTS[0]);
  const [lastLiveEvent, setLastLiveEvent] = React.useState<{ message: string; timestamp: Date } | null>(null);

  // Live WebSocket Connection
  const { status, lastEvent } = useUserWebSocket();
  const isConnected = status === "connected";

  // Handle Real-time WebSocket Influx
  React.useEffect(() => {
    if (!lastEvent) return;

    if (
      lastEvent.event_type === "NEW_PREDICTION" ||
      lastEvent.event_type === "vitals_updated" ||
      lastEvent.event_type === "review_submitted"
    ) {
      setLastLiveEvent({
        message: `Real-time AI telemetry: Ingested update for ${lastEvent.payload?.patient_mrn || "Patient"} (${new Date().toLocaleTimeString()})`,
        timestamp: new Date(),
      });
    }
  }, [lastEvent]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-5">
      {/* ─── Top Clinical Header & Real-time Live Badge ─── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Physician AI Clinical Assistant & CDSS Copilot
                </h1>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold px-2 py-0.5"
                >
                  Literature-Grounded (SSC, AHA, KDIGO)
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Multi-agent clinical decision support, calibrated TreeSHAP explanations, and real-time protocol synthesis
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Strip & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <BedsideTelemetryBadge label="AI STREAM ACTIVE" bpm={74} isSpike={selectedPatient?.risk === "CRITICAL"} />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs font-semibold text-blue-800 shadow-2xs">
              <Radio className="h-4 w-4 animate-pulse text-blue-600" />
              <span>LIVE AI ENGINE</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>HITL Governed</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Live Event Notification Strip ─── */}
      {lastLiveEvent && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/90 px-4 py-2.5 text-xs text-blue-900 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600 animate-bounce" />
            <span className="font-semibold">{lastLiveEvent.message}</span>
          </div>
          <span className="text-[10px] text-blue-700 font-mono">
            {lastLiveEvent.timestamp.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* ─── Patient Context Selector Bar ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Active Patient Context Injection
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Telemetry & Biomarkers Injected Into AI Context
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {ACTIVE_PATIENTS.map((pat) => {
            const isSelected = selectedPatient?.id === pat.id;
            const isCrit = pat.risk === "CRITICAL";
            const isHigh = pat.risk === "HIGH";

            return (
              <button
                key={pat.id}
                type="button"
                onClick={() => setSelectedPatient(pat)}
                className={`group flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500"
                    : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-slate-900 line-clamp-1">{pat.name}</span>
                    <span
                      className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase ${
                        isCrit
                          ? "bg-rose-100 text-rose-800 font-black"
                          : isHigh
                          ? "bg-orange-100 text-orange-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {pat.risk}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-slate-500 font-semibold">{pat.mrn}</p>
                  <p className="mt-1 text-[11px] text-slate-600 line-clamp-1">{pat.vitals}</p>
                  <p className="mt-0.5 text-[10px] text-blue-700 font-semibold line-clamp-1">{pat.topConcern}</p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-semibold text-blue-600">
                  <span>{isSelected ? "Active Context" : "Inject Patient"}</span>
                  <ChevronRight className={`h-3 w-3 ${isSelected ? "text-blue-700 translate-x-0.5" : "text-slate-400"}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Main Chat Workspace ─── */}
      <div className="h-[680px] rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <AIChat
          agentRole="DOCTOR"
          patientId={selectedPatient?.id}
          roleSubtitle={
            selectedPatient
              ? `Context: ${selectedPatient.name} (${selectedPatient.mrn}) · ${selectedPatient.topConcern}`
              : "Literature-Grounded CDSS · Surviving Sepsis, KDIGO & AHA Protocols"
          }
          initialGreeting={`Hello, Doctor. I am your HealthNova AI Clinical Assistant. ${
            selectedPatient
              ? `I have active real-time telemetry loaded for ${selectedPatient.name} (${selectedPatient.mrn} — ${selectedPatient.vitals}).`
              : "I am connected to the clinical decision support system with real-time multi-agent safety oversight."
          } All clinical recommendations operate strictly under Human-in-the-Loop physician sign-off.`}
          suggestedQueries={DOCTOR_QUERIES}
        />
      </div>
    </div>
  );
}
