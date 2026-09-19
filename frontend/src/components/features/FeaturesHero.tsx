"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Activity,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Cpu,
  TrendingUp,
  Layers,
  Zap,
  Radio,
  UserCheck,
  Sliders,
  AlertTriangle,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MockPatient {
  id: string;
  name: string;
  bed: string;
  condition: string;
  statusText: string;
  riskScore: string;
  riskTier: "HIGH RISK" | "ELEVATED" | "NORMAL";
  riskColor: string;
  riskBg: string;
  riskBorder: string;
  barWidth: string;
  leadTime: string;
  vitals: { hr: number; bp: string; map: number; spo2: string; rr: number };
  shapFactors: { name: string; impact: string; isPositive: boolean }[];
  ruleGate: string;
}

const MOCK_PATIENTS: MockPatient[] = [
  {
    id: "patient-1",
    name: "Eleanor Vance, 68F",
    bed: "ICU BED 04",
    condition: "Post-Op Colorectal Day 2",
    statusText: "ACUTE SEPTIC SHOCK TRAJECTORY",
    riskScore: "84.7%",
    riskTier: "HIGH RISK",
    riskColor: "text-rose-700",
    riskBg: "bg-rose-50",
    riskBorder: "border-rose-200",
    barWidth: "85%",
    leadTime: "+6.2h Anticipatory Lead",
    vitals: { hr: 118, bp: "86/52", map: 58, spo2: "91% (RA)", rr: 26 },
    shapFactors: [
      { name: "Serum Lactate 3.8", impact: "+0.214", isPositive: true },
      { name: "MAP Depressed 58", impact: "+0.168", isPositive: true },
      { name: "SpO2/FiO2 182", impact: "+0.092", isPositive: true },
    ],
    ruleGate: "qSOFA = 2 (Positive) • NEWS2 = 8 (High Alert)",
  },
  {
    id: "patient-2",
    name: "David Morales, 71M",
    bed: "ICU BED 02",
    condition: "Acute Anterior STEMI",
    statusText: "HEMODYNAMIC INSTABILITY ALERT",
    riskScore: "76.2%",
    riskTier: "HIGH RISK",
    riskColor: "text-rose-700",
    riskBg: "bg-rose-50",
    riskBorder: "border-rose-200",
    barWidth: "76%",
    leadTime: "+4.5h Anticipatory Lead",
    vitals: { hr: 96, bp: "92/60", map: 70, spo2: "93% (2L)", rr: 22 },
    shapFactors: [
      { name: "ST Elevation 1.8mm", impact: "+0.231", isPositive: true },
      { name: "Troponin I 4.2", impact: "+0.184", isPositive: true },
      { name: "LVEF Depressed 38%", impact: "+0.112", isPositive: true },
    ],
    ruleGate: "Killip Class II • Cardiogenic Shock Index = 1.04",
  },
  {
    id: "patient-3",
    name: "Marcus Chen, 49M",
    bed: "SDU BED 08",
    condition: "Severe Viral Pneumonia",
    statusText: "HYPOXEMIC DECOMPENSATION",
    riskScore: "68.4%",
    riskTier: "ELEVATED",
    riskColor: "text-amber-700",
    riskBg: "bg-amber-50",
    riskBorder: "border-amber-200",
    barWidth: "68%",
    leadTime: "+5.1h Anticipatory Lead",
    vitals: { hr: 104, bp: "114/72", map: 86, spo2: "88% (4L)", rr: 28 },
    shapFactors: [
      { name: "PaO2/FiO2 195", impact: "+0.198", isPositive: true },
      { name: "Tachypnea RR 28", impact: "+0.142", isPositive: true },
      { name: "Arterial pH 7.31", impact: "+0.076", isPositive: true },
    ],
    ruleGate: "ROX Index = 3.62 • NEWS2 = 7 (High Alert)",
  },
];

export function FeaturesHero() {
  const [selectedPatientIdx, setSelectedPatientIdx] = useState(0);
  const patient = MOCK_PATIENTS[selectedPatientIdx];

  const proofMetrics = [
    { label: "Inference Latency", value: "0.136 ms", sub: "Sub-millisecond compute", icon: Zap },
    { label: "Ensemble Accuracy", value: "ROC-AUC 0.94", sub: "Multi-cohort validated", icon: Cpu },
    { label: "Telemetry Push", value: "<20 ms", sub: "ASGI WebSocket stream", icon: Radio },
    { label: "Human Authority", value: "100% Enforced", sub: "Physician sign-off gate", icon: UserCheck },
  ];

  return (
    <section className="relative overflow-hidden pt-6 pb-16 sm:pt-10 sm:pb-20 lg:pt-12 lg:pb-24 bg-gradient-to-b from-slate-50/80 via-white to-white border-b border-slate-200">
      {/* Precision subtle engineering grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 [mask-image:radial-gradient(ellipse_75%_55%_at_50%_30%,#000_65%,transparent_100%)]"
      />

      {/* Atmospheric subtle clinical gradient orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-1/4 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -left-20 h-[450px] w-[450px] rounded-full bg-sky-500/8 blur-3xl"
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-teal-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-900">Platform Features</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Headline & Action CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Regulatory Eyebrow Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-300 text-slate-800 text-xs font-mono font-semibold shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
              </span>
              <span className="tracking-wide uppercase text-teal-800 font-bold">
                ENTERPRISE CLINICAL SUITE
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-sans">FDA SaMD Aligned</span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-teal-700 font-sans hidden sm:inline">12 Core Capabilities</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.08]">
                Comprehensive{" "}
                <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
                  Clinical Intelligence
                </span>
              </h1>
              <p className="text-lg sm:text-xl font-medium text-slate-700 tracking-tight">
                Engineered for Acute Bedside Triage &amp; Early Deterioration Intercept
              </p>
            </div>

            {/* Supporting Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
              HealthNova AI integrates calibrated multi-model machine learning, sub-20ms WebSocket telemetry,
              and deterministic clinical scoring rules (qSOFA, NEWS2). Designed from the ICU up, our suite
              enables physicians and nurses to detect acute decompensation hours in advance while preserving
              absolute clinical authority.
            </p>

            {/* Reassurance Disclaimer Badge */}
            <div className="p-4 sm:p-4.5 rounded-2xl bg-white border border-teal-200 shadow-sm flex items-start gap-3.5 max-w-xl">
              <div className="h-10 w-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-teal-700/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                    Clinician-in-the-Loop Standard
                  </strong>
                  <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    NON-AUTONOMOUS
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Advanced AI models compute calibrated risk trajectories and factor attributions.
                  Licensed attending physicians retain sole authority for all diagnostic,
                  therapeutic, and prescription orders.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a href="#powerful-features">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-bold px-7 shadow-md shadow-teal-900/10 gap-2 text-sm h-12 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Explore Capabilities Matrix</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#ai-intelligence">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-950 font-semibold px-6 text-sm h-12 gap-2 rounded-xl shadow-2xs transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <Layers className="h-4 w-4 text-teal-700" />
                  <span>Clinical Intelligence Architecture</span>
                </Button>
              </a>
            </div>

            {/* Proof Metrics Ribbon */}
            <div className="pt-5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {proofMetrics.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-teal-700 mb-1">
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider truncate">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-950 font-mono tracking-tight">
                      {item.value}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                      {item.sub}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: 100% Light Bedside Multi-Patient Telemetry Console */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-lg rounded-3xl bg-white text-slate-900 p-5 sm:p-6 shadow-xl border border-slate-300 space-y-4">
              {/* Console Top Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-700 ml-1 tracking-wider uppercase">
                    BEDSIDE TELEMETRY HUD
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
                  SUB-20MS STREAM
                </span>
              </div>

              {/* Patient Bed Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                {MOCK_PATIENTS.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPatientIdx(idx)}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer truncate ${
                      selectedPatientIdx === idx
                        ? "bg-white text-slate-950 shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>{p.bed}</span>
                  </button>
                ))}
              </div>

              {/* Active Patient Telemetry Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-950 text-sm block">
                      {patient.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {patient.condition}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${patient.riskBg} ${patient.riskColor} ${patient.riskBorder}`}>
                      {patient.riskTier}
                    </span>
                    <span className="block text-[9px] font-mono text-slate-500 mt-0.5">
                      {patient.leadTime}
                    </span>
                  </div>
                </div>

                {/* Status Flag and Score */}
                <div className="pt-1 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-700">
                    {patient.statusText}
                  </span>
                  <span className={`text-base font-black font-mono ${patient.riskColor}`}>
                    {patient.riskScore}
                  </span>
                </div>

                {/* Calibrated Risk Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: patient.barWidth }}
                  />
                </div>
              </div>

              {/* Vitals Quadrant */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Activity className="h-3.5 w-3.5 text-teal-700" />
                    Point-of-Care Vitals
                  </span>
                  <span className="text-teal-800 font-bold">Synchronized</span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
                  <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[9px] text-slate-500 block">HR</span>
                    <span className="text-xs font-bold text-slate-900">{patient.vitals.hr}</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[9px] text-slate-500 block">BP</span>
                    <span className="text-xs font-bold text-slate-900">{patient.vitals.bp}</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[9px] text-slate-500 block">MAP</span>
                    <span className="text-xs font-bold text-rose-600">{patient.vitals.map}</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[9px] text-slate-500 block">SpO2</span>
                    <span className="text-xs font-bold text-slate-900">{patient.vitals.spo2}</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[9px] text-slate-500 block">RR</span>
                    <span className="text-xs font-bold text-rose-600">{patient.vitals.rr}</span>
                  </div>
                </div>
              </div>

              {/* TreeSHAP Biomarker Attributions */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-teal-700" />
                    TreeSHAP Biomarker Drivers:
                  </span>
                  <span className="text-[10px] text-slate-500">Additive Margin</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                  {patient.shapFactors.map((f) => (
                    <div
                      key={f.name}
                      className="p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-800"
                    >
                      <span className="block text-[8px] text-slate-500 truncate">{f.name}</span>
                      <span className="font-bold text-rose-700">{f.impact}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deterministic Rule Interlock */}
              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-xs font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0" />
                  <div>
                    <span className="font-bold text-teal-950 block">Deterministic Safety Interlock</span>
                    <span className="text-[10px] text-teal-800">{patient.ruleGate}</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-200">
                  PASSED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
