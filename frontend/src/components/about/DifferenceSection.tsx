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
  HeartPulse,
  Activity,
  RotateCcw,
  Sparkles,
  Zap,
  Lock,
  Stethoscope,
  ChevronRight,
  FileCheck,
} from "lucide-react";

interface DifferenceFeature {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  techTag: string;
  icon: React.ComponentType<{ className?: string }>;
  metricBadge: string;
}

const FEATURES: DifferenceFeature[] = [
  {
    id: "ensemble",
    title: "Calibrated Multi-Model Ensembles",
    subtitle: "MACHINE LEARNING CORE",
    description:
      "CatBoost and Random Forest ensembles evaluated on multi-hospital cohorts; Platt-calibrated probabilities paired with Shannon entropy uncertainty bounds.",
    techTag: "Brier Score: 0.08 • AUC 0.94",
    icon: Brain,
    metricBadge: "Ensemble ML",
  },
  {
    id: "shap",
    title: "Local TreeSHAP Explainability",
    subtitle: "ZERO BLACK-BOX OPACITY",
    description:
      "Exact additive Shapley attributions calculate the precise pathophysiological contribution of every vital sign and lab assay toward the patient's risk trajectory.",
    techTag: "Exact Shapley Attributions",
    icon: Eye,
    metricBadge: "TreeSHAP",
  },
  {
    id: "streaming",
    title: "Sub-20ms Telemetry Streaming",
    subtitle: "REAL-TIME EVENT LOOPS",
    description:
      "High-throughput ASGI WebSocket pipelines powered by Django Channels and Redis deliver sub-20ms point-of-care event synchronization directly to bedside displays.",
    techTag: "ASGI WebSockets / Redis",
    icon: Radio,
    metricBadge: "<20ms Sync",
  },
  {
    id: "safety-gates",
    title: "Deterministic Safety Interlocks",
    subtitle: "HARDCODED CLINICAL AUDITS",
    description:
      "Deterministic medical rules (qSOFA, NEWS2, shock index) cross-audit every statistical prediction before alerting clinicians to prevent aberrant recommendations.",
    techTag: "Deterministic Verification",
    icon: ShieldCheck,
    metricBadge: "qSOFA & NEWS2",
  },
  {
    id: "zero-phi",
    title: "Zero-PHI Stateless Memory Boundary",
    subtitle: "PATIENT PRIVACY BY DESIGN",
    description:
      "Context minimization ensures patient identifiers never enter external agent memories or vector stores. Neon PostgreSQL is the sole authoritative ACID store.",
    techTag: "Neon PostgreSQL Store",
    icon: Layers,
    metricBadge: "HIPAA Zero-Leak",
  },
  {
    id: "human-loop",
    title: "Clinician-in-the-Loop Authority",
    subtitle: "MANDATORY ATTENDING GATE",
    description:
      "100% human sign-off architecture. AI provides risk signals and evidence; licensed attending physicians retain exclusive authority for all clinical orders.",
    techTag: "Mandatory Physician Sign-Off",
    icon: UserCheck,
    metricBadge: "100% Human Gate",
  },
];

interface PatientCase {
  id: string;
  name: string;
  mrn: string;
  room: string;
  diagnosis: string;
  statusText: string;
  riskScore: string;
  riskTier: string;
  riskColor: string;
  riskBarWidth: string;
  calibratedMargin: string;
  vitals: { hr: number; bp: string; map: number; spo2: string; rr: number; temp: string };
  shapDrivers: {
    feature: string;
    value: string;
    impact: string;
    isPositive: boolean;
    barWidth: string;
  }[];
  deterministicRule: string;
  safetySeverity: "danger" | "warning" | "normal";
}

const PATIENT_CASES: PatientCase[] = [
  {
    id: "case-sepsis",
    name: "Eleanor Vance, 68F",
    mrn: "MRN-882910",
    room: "ICU Bed 04",
    diagnosis: "Post-Op Hemicolectomy Day 2",
    statusText: "ACUTE SEPTIC SHOCK TRAJECTORY DETECTED",
    riskScore: "84.7%",
    riskTier: "HIGH RISK TIER",
    riskColor: "text-rose-600",
    riskBarWidth: "85%",
    calibratedMargin: "Margin: 0.81 • Brier: 0.08 • +6.2h Lead Time",
    vitals: { hr: 118, bp: "86/52", map: 58, spo2: "91% (RA)", rr: 26, temp: "38.9°C" },
    shapDrivers: [
      { feature: "Serum Lactate", value: "3.8 mmol/L", impact: "+0.214 (Risk +)", isPositive: true, barWidth: "82%" },
      { feature: "Mean Arterial Pressure", value: "58 mmHg", impact: "+0.168 (Risk +)", isPositive: true, barWidth: "66%" },
      { feature: "SpO2 / FiO2 Ratio", value: "182", impact: "+0.092 (Risk +)", isPositive: true, barWidth: "44%" },
      { feature: "Platelet Count", value: "210 ×10³/µL", impact: "-0.038 (Protective)", isPositive: false, barWidth: "24%" },
    ],
    deterministicRule: "qSOFA = 2 (Positive) • NEWS2 = 8 (High Alert). 1-Hour Sepsis Bundle recommended for clinician authorization.",
    safetySeverity: "danger",
  },
  {
    id: "case-respiratory",
    name: "Marcus Chen, 49M",
    mrn: "MRN-654219",
    room: "SDU Bed 08",
    diagnosis: "Severe Community-Acquired Pneumonia",
    statusText: "HYPOXEMIC RESPIRATORY DECOMPENSATION",
    riskScore: "68.4%",
    riskTier: "ELEVATED RISK TIER",
    riskColor: "text-amber-600",
    riskBarWidth: "68%",
    calibratedMargin: "Margin: 0.68 • Brier: 0.05 • +4.8h Lead Time",
    vitals: { hr: 104, bp: "114/72", map: 86, spo2: "88% (4L NC)", rr: 28, temp: "38.2°C" },
    shapDrivers: [
      { feature: "PaO2 / FiO2 Ratio", value: "195", impact: "+0.198 (Risk +)", isPositive: true, barWidth: "75%" },
      { feature: "Tachypnea (RR)", value: "28 /min", impact: "+0.142 (Risk +)", isPositive: true, barWidth: "56%" },
      { feature: "Arterial pH", value: "7.31", impact: "+0.076 (Risk +)", isPositive: true, barWidth: "38%" },
      { feature: "Systolic BP", value: "114 mmHg", impact: "-0.048 (Protective)", isPositive: false, barWidth: "26%" },
    ],
    deterministicRule: "qSOFA = 1 (Borderline) • NEWS2 = 7 (High Alert). Recommend High-Flow Nasal Cannula (HFNC) titration audit.",
    safetySeverity: "warning",
  },
  {
    id: "case-stable",
    name: "Arthur Pendelton, 54M",
    mrn: "MRN-773412",
    room: "Ward Bed 2B",
    diagnosis: "Post-CABG Day 4 Recovery",
    statusText: "HEMODYNAMICALLY STABLE AMBULATORY",
    riskScore: "14.2%",
    riskTier: "LOW RISK TIER",
    riskColor: "text-emerald-600",
    riskBarWidth: "14%",
    calibratedMargin: "Margin: 0.92 • Brier: 0.003 • Routine Surveillance",
    vitals: { hr: 72, bp: "122/78", map: 92, spo2: "98% (RA)", rr: 14, temp: "36.8°C" },
    shapDrivers: [
      { feature: "Serum Lactate", value: "1.1 mmol/L", impact: "-0.142 (Protective)", isPositive: false, barWidth: "35%" },
      { feature: "Mean Arterial Pressure", value: "92 mmHg", impact: "-0.118 (Protective)", isPositive: false, barWidth: "30%" },
      { feature: "Left Ventricular EF", value: "58%", impact: "-0.084 (Protective)", isPositive: false, barWidth: "22%" },
      { feature: "Sinus Rhythm Telemetry", value: "Regular", impact: "-0.046 (Protective)", isPositive: false, barWidth: "18%" },
    ],
    deterministicRule: "qSOFA = 0 (Negative) • NEWS2 = 1 (Normal). Patient hemodynamically stable. Routine ward nursing active.",
    safetySeverity: "normal",
  },
];

export function DifferenceSection() {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [activeFeatureId, setActiveFeatureId] = useState("ensemble");
  const [signedOff, setSignedOff] = useState(false);

  const patient = PATIENT_CASES[selectedCaseIdx];

  const handleSelectCase = (idx: number) => {
    setSelectedCaseIdx(idx);
    setSignedOff(false);
  };

  return (
    <section id="difference" className="py-12 sm:py-20 lg:py-28 bg-slate-50/50 border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-8 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>OUR CLINICAL DIFFERENCE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Intelligence. Integration.{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Clinical Impact.
            </span>
          </h2>
          <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
            HealthNova AI is built from the bedside up — combining empirical machine learning
            ensembles with hardcoded deterministic safety rules and local TreeSHAP explainability.
          </p>
        </div>

        {/* Workstation Grid: Capabilities (Left 7) & Bedside Simulator (Right 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: 6 Core Engineering Differentiators */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                CORE SYSTEM CAPABILITIES
              </span>
              <span className="text-xs font-mono text-teal-700 font-semibold">
                6 Verified Invariants
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((feat) => {
                const Icon = feat.icon;
                const isActive = activeFeatureId === feat.id;
                return (
                  <div
                    key={feat.id}
                    onClick={() => setActiveFeatureId(feat.id)}
                    className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                      isActive
                        ? "bg-white border-teal-600 shadow-md ring-1 ring-teal-500/20"
                        : "bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                            isActive
                              ? "bg-teal-700 text-white shadow-sm"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {feat.metricBadge}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-950 tracking-tight">
                          {feat.title}
                        </h4>
                        <span className="text-[10px] font-mono font-bold text-teal-700 block mt-0.5 uppercase tracking-wider">
                          {feat.subtitle}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {feat.description}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                      <Zap className="h-3 w-3 text-teal-700 shrink-0" />
                      <span className="truncate">{feat.techTag}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: High-Fidelity Bedside Clinical Tablet Simulator */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-white border border-slate-300 p-5 sm:p-6 shadow-xl space-y-4">
              {/* Tablet Top Bezel */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600 ml-1 uppercase tracking-wider">
                    BEDSIDE POINT-OF-CARE TABLET
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
                  LIVE FHIR FEED
                </span>
              </div>

              {/* Patient Case Selector Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                {PATIENT_CASES.map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCase(idx)}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer truncate ${
                      selectedCaseIdx === idx
                        ? "bg-white text-slate-950 shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>{idx === 0 ? "Case A (Sepsis)" : idx === 1 ? "Case B (Resp)" : "Case C (Stable)"}</span>
                  </button>
                ))}
              </div>

              {/* Patient Banner with Live Status */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-950 text-sm block">
                      {patient.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {patient.mrn} • {patient.room}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {patient.diagnosis}
                  </span>
                </div>

                <div className="pt-1 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-700 truncate">
                    {patient.statusText}
                  </span>
                  <span className={`text-base font-black font-mono ${patient.riskColor}`}>
                    {patient.riskScore}
                  </span>
                </div>

                {/* Calibrated Risk Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      patient.safetySeverity === "danger"
                        ? "bg-gradient-to-r from-amber-500 to-rose-600"
                        : patient.safetySeverity === "warning"
                        ? "bg-gradient-to-r from-amber-400 to-amber-600"
                        : "bg-gradient-to-r from-teal-500 to-emerald-500"
                    }`}
                    style={{ width: patient.riskBarWidth }}
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-500 block">
                  {patient.calibratedMargin}
                </span>
              </div>

              {/* Live Vitals Table */}
              <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-xs">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">HR</span>
                  <span className="font-bold text-slate-900">{patient.vitals.hr}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">BP / MAP</span>
                  <span className="font-bold text-slate-900">{patient.vitals.map}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">SpO2</span>
                  <span className="font-bold text-slate-900">{patient.vitals.spo2}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">RR</span>
                  <span className="font-bold text-slate-900">{patient.vitals.rr}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">TEMP</span>
                  <span className="font-bold text-slate-900">{patient.vitals.temp}</span>
                </div>
              </div>

              {/* TreeSHAP Pathophysiological Drivers */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-teal-700" />
                    TreeSHAP Biomarker Attributions
                  </span>
                  <span className="text-[10px] text-slate-500">Additive Margin</span>
                </div>

                <div className="space-y-1.5">
                  {patient.shapDrivers.map((driver) => (
                    <div key={driver.feature} className="space-y-0.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-700 font-semibold">{driver.feature} ({driver.value})</span>
                        <span
                          className={`font-bold ${
                            driver.isPositive ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {driver.impact}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            driver.isPositive ? "bg-rose-500" : "bg-emerald-500"
                          }`}
                          style={{ width: driver.barWidth }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deterministic Rule Interlock */}
              <div
                className={`p-3 rounded-2xl border text-xs font-mono space-y-1 ${
                  patient.safetySeverity === "danger"
                    ? "bg-rose-50/70 border-rose-200 text-rose-950"
                    : patient.safetySeverity === "warning"
                    ? "bg-amber-50/70 border-amber-200 text-amber-950"
                    : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {patient.safetySeverity === "danger" ? (
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  ) : patient.safetySeverity === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  )}
                  <span>Deterministic Audit Result:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700">
                  {patient.deterministicRule}
                </p>
              </div>

              {/* Interactive Clinician Sign-Off Gate */}
              <div className="pt-1">
                {signedOff ? (
                  <div className="p-3 rounded-2xl bg-teal-50 border border-teal-300 text-teal-900 text-xs font-mono flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-700" />
                      <div>
                        <span className="font-bold block">Attending Physician Sign-Off Confirmed</span>
                        <span className="text-[10px] text-teal-700">
                          Cryptographic Stamp #882910-SIG-APPROVED
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSignedOff(false)}
                      className="text-[10px] font-bold underline text-teal-800 cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSignedOff(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-teal-900/10"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Authorize Clinical Protocol (Attending Sign-Off)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
