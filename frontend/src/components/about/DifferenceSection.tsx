"use client";

import React, { useState } from "react";
import {
  Brain,
  Eye,
  Radio,
  UserCheck,
  ShieldCheck,
  Layers,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  HeartPulse,
  Activity,
  RotateCcw,
  Sparkles,
  Zap,
  Lock,
} from "lucide-react";

interface DifferenceFeature {
  title: string;
  description: string;
  techTag: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  iconColor: string;
}

const FEATURES: DifferenceFeature[] = [
  {
    title: "Calibrated Multi-Model Predictions",
    description:
      "Ensemble machine learning models evaluated on multi-hospital cohorts; calibrated probabilities with epistemic uncertainty bounds.",
    techTag: "CatBoost + Random Forest Ensembles",
    icon: Brain,
    badge: "Ensemble ML",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700 border-teal-200",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
  },
  {
    title: "Transparent Explainability",
    description:
      "TreeSHAP and localized feature attributions present transparent pathophysiological drivers for every clinical alert.",
    techTag: "Exact Additive Shapley Values",
    icon: Eye,
    badge: "TreeSHAP",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700 border-amber-200",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
  },
  {
    title: "Real-Time Telemetry Streaming",
    description:
      "Sub-20ms point-of-care event updates via Django Channels and Redis keep bedside teams continuously informed.",
    techTag: "ASGI WebSockets / Redis Layer",
    icon: Radio,
    badge: "Channels & Redis",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700 border-blue-200",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
  },
  {
    title: "Deterministic Safety Railings",
    description:
      "Hardcoded clinical scoring rules (qSOFA, NEWS2, shock index) cross-audit every statistical prediction before alerting.",
    techTag: "Deterministic Verification Gates",
    icon: ShieldCheck,
    badge: "Safety Gates",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700 border-emerald-200",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
  },
  {
    title: "Zero-PHI Memory Boundary",
    description:
      "Stateless agent pipelines with context minimization ensure zero protected health information is stored in shared cloud indices.",
    techTag: "Neon PostgreSQL Authoritative Store",
    icon: Layers,
    badge: "HIPAA Zero-Leak",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700 border-purple-200",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-700",
  },
  {
    title: "Clinician-in-the-Loop Authority",
    description:
      "Mandatory human sign-off architecture. AI provides recommendations and evidence; licensed clinicians retain final decision authority.",
    techTag: "100% Attending Physician Gate",
    icon: UserCheck,
    badge: "Human Sign-Off",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-700 border-rose-200",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-700",
  },
];

interface PatientCase {
  id: string;
  name: string;
  mrn: string;
  room: string;
  status: string;
  riskScore: string;
  riskTier: "HIGH RISK TIER" | "LOW RISK TIER";
  riskTierBadge: string;
  gaugeWidth: string;
  gaugeGradient: string;
  marginText: string;
  vitals: { hr: number; bp: string; spo2: string; rr: number };
  shapDrivers: {
    feature: string;
    value: string;
    impact: string;
    isPositive: boolean;
    barWidth: string;
  }[];
  safetyRule: string;
  safetySeverity: "danger" | "normal";
}

const PATIENTS: PatientCase[] = [
  {
    id: "case-sepsis",
    name: "Eleanor Vance, 68F",
    mrn: "MRN-882910",
    room: "Room ICU-04",
    status: "POST-OP DAY 2 • SEPTIC SHOCK TRAJECTORY",
    riskScore: "84.7%",
    riskTier: "HIGH RISK TIER",
    riskTierBadge: "bg-rose-50 text-rose-800 border-rose-200",
    gaugeWidth: "85%",
    gaugeGradient: "from-amber-500 via-rose-500 to-red-600",
    marginText: "Calibrated Margin: 0.81 • Brier: 0.08",
    vitals: { hr: 118, bp: "86/52", spo2: "91%", rr: 26 },
    shapDrivers: [
      { feature: "Serum Lactate", value: "3.8 mmol/L", impact: "+0.214 (Risk +)", isPositive: true, barWidth: "80%" },
      { feature: "Mean Arterial Pressure", value: "58 mmHg", impact: "+0.168 (Risk +)", isPositive: true, barWidth: "65%" },
      { feature: "SpO2 / FiO2 Ratio", value: "182", impact: "+0.092 (Risk +)", isPositive: true, barWidth: "45%" },
      { feature: "Platelet Count", value: "210 ×10³/µL", impact: "-0.038 (Protective)", isPositive: false, barWidth: "25%" },
    ],
    safetyRule: "qSOFA = 2 (Positive) • NEWS2 = 8 (High Alert). Recommended 1-Hour Sepsis Bundle ready for clinician authorization.",
    safetySeverity: "danger",
  },
  {
    id: "case-stable",
    name: "Arthur Pendelton, 54M",
    mrn: "MRN-773412",
    room: "Room WARD-2B",
    status: "POST-CABG DAY 4 • AMBULATORY RECOVERY",
    riskScore: "14.2%",
    riskTier: "LOW RISK TIER",
    riskTierBadge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    gaugeWidth: "14%",
    gaugeGradient: "from-emerald-400 to-teal-500",
    marginText: "Calibrated Margin: 0.92 • Brier: 0.003",
    vitals: { hr: 72, bp: "122/78", spo2: "98%", rr: 14 },
    shapDrivers: [
      { feature: "Serum Lactate", value: "1.1 mmol/L", impact: "-0.142 (Protective)", isPositive: false, barWidth: "35%" },
      { feature: "Mean Arterial Pressure", value: "92 mmHg", impact: "-0.118 (Protective)", isPositive: false, barWidth: "30%" },
      { feature: "Left Ventricular EF", value: "58%", impact: "-0.084 (Protective)", isPositive: false, barWidth: "22%" },
      { feature: "Sinus Rhythm Telemetry", value: "Regular", impact: "-0.046 (Protective)", isPositive: false, barWidth: "18%" },
    ],
    safetyRule: "qSOFA = 0 (Negative) • NEWS2 = 1 (Normal). Patient hemodynamically stable. Routine ward nursing surveillance active.",
    safetySeverity: "normal",
  },
];

export function DifferenceSection() {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);

  const currentPatient = PATIENTS[selectedCaseIndex];

  const handleSwitchPatient = (idx: number) => {
    setSelectedCaseIndex(idx);
    setAcknowledged(false);
  };

  return (
    <section id="difference" className="py-20 sm:py-28 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-200/80 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>OUR CLINICAL DIFFERENCE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Intelligence. Integration.{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Clinical Impact.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            HealthNova AI is built from the bedside up — not as an unconstrained generative chatbot,
            but as a dual-gated, deterministic and machine-learning clinical intelligence system.
          </p>
        </div>

        {/* Feature Grid & Interactive Bedside Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Features Column (Left 7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {FEATURES.map((feat) => {
              const IconComponent = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`h-11 w-11 rounded-xl border border-slate-200/80 ${feat.iconBg} ${feat.iconColor} flex items-center justify-center shadow-2xs transition-transform duration-300 group-hover:scale-110`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${feat.badgeBg} ${feat.badgeText}`}
                      >
                        {feat.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-950 tracking-tight group-hover:text-teal-700 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                    <Zap className="h-3 w-3 text-teal-600" />
                    <span>{feat.techTag}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clinical Tablet Mockup (Right 5 cols) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-white border border-slate-300/80 p-5 sm:p-6 shadow-2xl shadow-slate-200 space-y-4">
              {/* Tablet Top Bezel & Camera Notch */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600 ml-1">
                    BEDSIDE CLINICAL TELEMETRY
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>SYNCHRONIZED</span>
                </div>
              </div>

              {/* Patient Selection Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                {PATIENTS.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSwitchPatient(idx)}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer truncate ${
                      selectedCaseIndex === idx
                        ? "bg-white text-slate-950 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="sm:hidden">{idx === 0 ? "Case A (Sepsis)" : "Case B (Stable)"}</span>
                    <span className="hidden sm:inline">{idx === 0 ? "Patient A (Sepsis Alert)" : "Patient B (Stable Post-Op)"}</span>
                  </button>
                ))}
              </div>

              {/* Patient Banner with Live Vitals */}
              <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-950 block text-sm">
                      {currentPatient.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {currentPatient.room} &bull; {currentPatient.mrn}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    {currentPatient.status.split("•")[0]}
                  </span>
                </div>

                {/* Vitals Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-center font-mono">
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-[10px]">
                    <span className="text-slate-400 block text-[9px]">HR</span>
                    <strong className="text-slate-900">{currentPatient.vitals.hr} bpm</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-[10px]">
                    <span className="text-slate-400 block text-[9px]">NIBP</span>
                    <strong className="text-slate-900">{currentPatient.vitals.bp}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-[10px]">
                    <span className="text-slate-400 block text-[9px]">SpO2</span>
                    <strong className="text-slate-900">{currentPatient.vitals.spo2}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-[10px]">
                    <span className="text-slate-400 block text-[9px]">RESP</span>
                    <strong className="text-slate-900">{currentPatient.vitals.rr}/m</strong>
                  </div>
                </div>
              </div>

              {/* Patient Risk Prediction Banner */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    DETERIORATION RISK ASSESSMENT
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${currentPatient.riskTierBadge}`}
                  >
                    {currentPatient.riskTier}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-3xl sm:text-4xl font-black text-slate-950 font-mono tracking-tight">
                    {currentPatient.riskScore}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {currentPatient.marginText}
                  </span>
                </div>

                {/* Tri-color Risk Gauge with Dynamic Fill */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                    <div
                      className={`h-2.5 rounded-full bg-gradient-to-r ${currentPatient.gaugeGradient} transition-all duration-500`}
                      style={{ width: currentPatient.gaugeWidth }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>LOW (0-30%)</span>
                    <span>MODERATE (30-70%)</span>
                    <span className={selectedCaseIndex === 0 ? "text-rose-600 font-bold" : "text-slate-400"}>
                      HIGH (70-100%)
                    </span>
                  </div>
                </div>
              </div>

              {/* TreeSHAP Explainability Attribution Preview */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-teal-600" />
                    TreeSHAP Feature Attributions
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Log-Odds Impact</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {currentPatient.shapDrivers.map((driver) => (
                    <div key={driver.feature}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-700 font-medium">{driver.feature} ({driver.value})</span>
                        <span className={`font-mono font-bold ${driver.isPositive ? "text-rose-600" : "text-emerald-700"}`}>
                          {driver.impact}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${driver.isPositive ? "bg-rose-500" : "bg-emerald-500"}`}
                          style={{ width: driver.barWidth }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deterministic Safety Railing Audit */}
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  currentPatient.safetySeverity === "danger"
                    ? "bg-amber-50/80 border-amber-200 text-amber-950"
                    : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                }`}
              >
                {currentPatient.safetySeverity === "danger" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <p className="text-[11px] leading-snug">
                  <strong>Safety Rule Check:</strong> {currentPatient.safetyRule}
                </p>
              </div>

              {/* Clinician Action Gateway */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setAcknowledged(!acknowledged)}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                    acknowledged
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-teal-600 hover:bg-teal-700 text-white"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {acknowledged
                      ? "Signed by Attending M.D. (Dr. Vadla Abhinay)"
                      : selectedCaseIndex === 0
                      ? "Acknowledge & Order Bundle"
                      : "Confirm Routine Clinical Surveillance"}
                  </span>
                </button>

                {acknowledged && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-900 flex items-center justify-between">
                    <span>Audit Trace: Neon PostgreSQL ID #TX-8921</span>
                    <button
                      type="button"
                      onClick={() => setAcknowledged(false)}
                      className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  </div>
                )}
              </div>

              {/* Figure Caption */}
              <p className="text-[10px] text-slate-500 text-center italic pt-1">
                Figure: Assistive clinical decision interface showing transparent model attributions with required physician sign-off.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
