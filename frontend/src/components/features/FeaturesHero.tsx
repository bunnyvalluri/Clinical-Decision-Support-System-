"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
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
  CheckCircle2,
  Clock,
  Gauge,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RealtimeEcgWaveform } from "@/components/clinical/RealtimeEcgWaveform";

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
  stDepression: number;
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
    stDepression: 2.4,
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
    stDepression: 3.2,
    shapFactors: [
      { name: "ST Elevation 1.8mm", impact: "+0.231", isPositive: true },
      { name: "Troponin I 4.2", impact: "+0.184", isPositive: true },
      { name: "LVEF Depressed 38%", impact: "+0.112", isPositive: true },
    ],
    ruleGate: "Killip Class II • Shock Index = 1.04",
  },
  {
    id: "patient-3",
    name: "Marcus Chen, 49M",
    bed: "SDU BED 08",
    condition: "Stable Ambulatory Baseline",
    statusText: "NORMATIVE CARDIAC PROFILE",
    riskScore: "12.4%",
    riskTier: "NORMAL",
    riskColor: "text-emerald-700",
    riskBg: "bg-emerald-50",
    riskBorder: "border-emerald-200",
    barWidth: "14%",
    leadTime: "Nominal Stability Margin",
    vitals: { hr: 72, bp: "118/76", map: 90, spo2: "99% (RA)", rr: 16 },
    stDepression: 0.1,
    shapFactors: [
      { name: "Ejection Fraction 58%", impact: "-0.142", isPositive: false },
      { name: "Lactate Clear 0.9", impact: "-0.110", isPositive: false },
      { name: "MAP Optimal 90", impact: "-0.095", isPositive: false },
    ],
    ruleGate: "qSOFA = 0 • NEWS2 = 1 (Low Alert)",
  },
];

const HERO_CLINICIANS = [
  {
    name: "Dr. Vadla Abhinay",
    initials: "VA",
    role: "MD",
    title: "Chief of Cardiology • Attending",
    image: "/doctor-hero.jpg",
    alt: "Attending Cardiologist Dr. Vadla Abhinay reviewing patient risk assessment on tablet",
    node: "NODE 04 • ICU TELEMETRY",
    enc: "ENC-88291",
    vitalsBadge: "114 BPM • 98% SpO2",
    registry: "SHA-256 Verified",
  },
  {
    name: "Dr. Valluri Rahul",
    initials: "VR",
    role: "MD",
    title: "Chief of Cardiology • Attending",
    image: "/doctor-hero-rahul.jpg",
    alt: "Attending Cardiologist Dr. Valluri Rahul reviewing cardiac telemetry on tablet",
    node: "NODE 02 • CCU TELEMETRY",
    enc: "ENC-88292",
    vitalsBadge: "114 BPM • 98% SpO2",
    registry: "SHA-256 Verified",
  },
];

export function FeaturesHero() {
  const [selectedPatientIdx, setSelectedPatientIdx] = useState<number>(0);
  const [activeClinicianIndex, setActiveClinicianIndex] = useState(0);

  // Auto-rotate hero clinician photo every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveClinicianIndex((prev) => (prev + 1) % HERO_CLINICIANS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const patient = MOCK_PATIENTS[selectedPatientIdx];

  const proofMetrics = [
    { label: "SLA LATENCY", value: "< 20ms", sub: "WebSocket telemetry stream", icon: Zap },
    { label: "ANTICIPATORY LEAD", value: "6–8 Hours", sub: "Sepsis early warning", icon: Clock },
    { label: "TREE-SHAP EXPLAINABILITY", value: "100%", sub: "Deterministic feature attribution", icon: Cpu },
    { label: "CLINICAL GATE", value: "Human-in-the-Loop", sub: "Physician order sign-off", icon: ShieldCheck },
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-28 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(13,148,136,0.08),rgba(2,132,199,0.04),transparent)] border-b border-slate-200/80">
      {/* Background medical grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)] pointer-events-none opacity-40 -z-10" />

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Hero Content & Engineering Credentials */}
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
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-tight sm:leading-[1.08]">
                Comprehensive{" "}
                <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
                  Clinical Intelligence
                </span>
              </h1>
              <p className="text-base sm:text-xl font-medium text-slate-700 tracking-tight">
                Engineered for Acute Bedside Triage &amp; Early Deterioration Intercept
              </p>
            </div>

            {/* Supporting Description */}
            <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
              HealthNova AI integrates calibrated multi-model machine learning, sub-20ms WebSocket telemetry,
              and deterministic clinical scoring rules (qSOFA, NEWS2). Designed from the ICU up, our suite
              enables physicians and nurses to detect acute decompensation hours in advance while preserving
              absolute clinical authority.
            </p>

            {/* Reassurance Disclaimer Badge */}
            <div className="p-3.5 sm:p-4.5 rounded-2xl bg-white border border-teal-200 shadow-xs flex items-start gap-3 sm:gap-3.5 max-w-xl">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-teal-700/20">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                    Clinician-in-the-Loop Standard
                  </strong>
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
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
              <a href="#powerful-features" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-bold px-7 shadow-md shadow-teal-900/10 gap-2 text-xs sm:text-sm h-11 sm:h-12 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Explore Capabilities Matrix</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#ai-intelligence" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-950 font-semibold px-6 text-xs sm:text-sm h-11 sm:h-12 gap-2 rounded-xl shadow-2xs transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <Layers className="h-4 w-4 text-teal-700" />
                  <span>Clinical Intelligence Architecture</span>
                </Button>
              </a>
            </div>

            {/* Proof Metrics Ribbon */}
            <div className="pt-5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {proofMetrics.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="p-2.5 sm:p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-teal-700 mb-1">
                      <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider truncate">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-black text-slate-950 font-mono tracking-tight truncate">
                      {item.value}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium truncate mt-0.5">
                      {item.sub}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Senior Clinical Command Frame with 2-Second Rotating Clinician Photo + Bedside HUD */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-md space-y-4">
              {/* Main Medical Frame */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-3.5 shadow-xl space-y-3.5">
                {/* Hospital Telemetry Top Status Header */}
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-between text-[11px] font-mono border border-slate-200/90 transition-all duration-500">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-slate-900 font-bold tracking-tight">
                      {HERO_CLINICIANS[activeClinicianIndex].node}
                    </span>
                  </div>
                  <span className="text-teal-700 font-bold bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded transition-all duration-300">
                    {HERO_CLINICIANS[activeClinicianIndex].enc}
                  </span>
                </div>

                {/* Doctor Image Frame with 2-Second Rotating Photos */}
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-inner group">
                  {HERO_CLINICIANS.map((clinician, idx) => {
                    const isActive = idx === activeClinicianIndex;
                    return (
                      <div
                        key={clinician.name}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                          isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                        }`}
                      >
                        <Image
                          src={clinician.image}
                          alt={clinician.alt}
                          width={600}
                          height={600}
                          priority={idx === 0}
                          className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                        />
                      </div>
                    );
                  })}

                  {/* Telemetry HUD overlay badge */}
                  <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 flex items-center gap-2 shadow-md z-20">
                    <Activity className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
                    <span className="text-[11px] font-mono text-teal-800 font-bold">
                      {HERO_CLINICIANS[activeClinicianIndex].vitalsBadge}
                    </span>
                  </div>

                  {/* Carousel slide indicators - Pure Light Glass */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm z-20">
                    {HERO_CLINICIANS.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveClinicianIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === activeClinicianIndex
                            ? "w-4 bg-teal-600"
                            : "w-1.5 bg-slate-300 hover:bg-slate-400"
                        }`}
                        aria-label={`Switch to photo ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Attending Physician Profile Banner */}
                <div className="p-3 rounded-xl bg-white text-slate-900 flex items-center justify-between border border-slate-200 shadow-xs transition-all duration-300">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs transition-all duration-300">
                      {HERO_CLINICIANS[activeClinicianIndex].initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-950 truncate transition-all duration-300">
                          {HERO_CLINICIANS[activeClinicianIndex].name}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                          {HERO_CLINICIANS[activeClinicianIndex].role}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate transition-all duration-300">
                        {HERO_CLINICIANS[activeClinicianIndex].title}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-2 border-l border-slate-200 shrink-0">
                    <div className="min-w-0">
                      <span className="text-[9px] text-slate-500 font-mono font-semibold block uppercase leading-none">
                        REGISTRY
                      </span>
                      <span className="text-xs font-bold text-emerald-700 font-mono truncate block mt-0.5">
                        {HERO_CLINICIANS[activeClinicianIndex].registry}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Bedside Telemetry Simulation Dock */}
              <div className="rounded-2xl bg-white border border-slate-200 p-3.5 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 font-mono">
                    <Gauge className="h-3.5 w-3.5 text-teal-600" />
                    <span>INTERACTIVE BEDSIDE SIMULATOR</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Select Cohort:
                  </span>
                </div>

                {/* Cohort Pill Tabs */}
                <div className="grid grid-cols-3 gap-1 sm:gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {MOCK_PATIENTS.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPatientIdx(idx)}
                      className={`py-1.5 px-1 sm:px-2 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 text-center ${
                        selectedPatientIdx === idx
                          ? "bg-white text-slate-950 shadow-xs border border-slate-200 ring-1 ring-slate-200/50"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                      }`}
                      title={p.name}
                    >
                      <span className="shrink-0 text-xs">
                        {p.riskTier === "HIGH RISK" ? "⚠️" : p.riskTier === "ELEVATED" ? "⚡" : "✓"}
                      </span>
                      <span className="leading-tight break-normal whitespace-normal sm:whitespace-nowrap font-medium">
                        {p.name.split(",")[0]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Live Realtime ECG Waveform Canvas - 100% Pure Light Clinical Theme */}
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2.5 text-slate-800 shadow-inner">
                  <div className="flex items-center justify-between text-[10px] font-mono pb-1.5 border-b border-slate-200/80">
                    <span className="text-teal-800 font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Lead II • {patient.vitals.hr} BPM
                    </span>
                    <span className="text-slate-500 font-medium">
                      SpO2 {patient.vitals.spo2} • MAP {patient.vitals.map}
                    </span>
                  </div>
                  <div className="h-14 w-full bg-white rounded-lg border border-slate-200/60 my-1 overflow-hidden">
                    <RealtimeEcgWaveform
                      heartRate={patient.vitals.hr}
                      stDepression={patient.stDepression}
                      theme="light"
                      color="#0d9488"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono pt-1 text-slate-600 border-t border-slate-200/80">
                    <span className="font-semibold text-slate-700">{patient.condition}</span>
                    <span className={`font-bold ${patient.riskTier === "HIGH RISK" ? "text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200" : patient.riskTier === "ELEVATED" ? "text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" : "text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"}`}>
                      Risk {patient.riskScore}
                    </span>
                  </div>
                </div>

                {/* Quick attribution pills */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  {patient.shapFactors.slice(0, 2).map((factor) => (
                    <span
                      key={factor.name}
                      className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 truncate"
                    >
                      {factor.name} ({factor.impact})
                    </span>
                  ))}
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 font-bold shrink-0">
                    TreeSHAP Calibrated
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
