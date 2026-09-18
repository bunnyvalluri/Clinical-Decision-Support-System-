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
} from "lucide-react";

interface DifferenceFeature {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  badgeBg: string;
  badgeText: string;
}

const FEATURES: DifferenceFeature[] = [
  {
    title: "Calibrated Multi-Model Predictions",
    description:
      "Ensemble machine learning models evaluated on multi-hospital cohorts; calibrated probabilities with epistemic uncertainty bounds.",
    icon: Brain,
    badge: "Ensemble ML",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700 border-teal-200",
  },
  {
    title: "Transparent Explainability",
    description:
      "TreeSHAP and localized feature attributions present transparent pathophysiological drivers for every clinical alert.",
    icon: Eye,
    badge: "TreeSHAP",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700 border-amber-200",
  },
  {
    title: "Real-Time Telemetry Streaming",
    description:
      "Sub-20ms point-of-care event updates via Django Channels and Redis keep bedside teams continuously informed.",
    icon: Radio,
    badge: "Channels & Redis",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700 border-blue-200",
  },
  {
    title: "Deterministic Safety Railings",
    description:
      "Hardcoded clinical scoring rules (qSOFA, NEWS2, shock index) cross-audit every statistical prediction before alerting.",
    icon: ShieldCheck,
    badge: "Safety Gates",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700 border-emerald-200",
  },
  {
    title: "Zero-PHI Memory Boundary",
    description:
      "Stateless agent pipelines with context minimization ensure zero protected health information is stored in shared cloud indices.",
    icon: Layers,
    badge: "HIPAA Zero-Leak",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700 border-purple-200",
  },
  {
    title: "Clinician-in-the-Loop Authority",
    description:
      "Mandatory human sign-off architecture. AI provides recommendations and evidence; licensed clinicians retain final decision authority.",
    icon: UserCheck,
    badge: "Human Sign-Off",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-700 border-rose-200",
  },
];

export function DifferenceSection() {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <section id="difference" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full shadow-2xs">
            OUR CLINICAL DIFFERENCE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Intelligence. Integration. Clinical Impact.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            HealthNova AI is built from the bedside up — not as an experimental generative LLM,
            but as a dual-gated, deterministic and machine-learning intelligence system.
          </p>
        </div>

        {/* Feature Grid & Clinical Dashboard Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Features Column (Left 7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((feat) => {
              const IconComponent = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-2xs hover:border-teal-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-teal-700 shadow-2xs">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${feat.badgeBg} ${feat.badgeText}`}
                      >
                        {feat.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-950 tracking-tight">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clinical Tablet/Dashboard Mockup (Right 5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-slate-50/90 border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
              {/* Tablet Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-mono font-bold text-slate-600 ml-1">
                    BEDSIDE CLINICAL TELEMETRY
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>SYNCHRONIZED</span>
                </div>
              </div>

              {/* Patient Banner */}
              <div className="px-4 py-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Eleanor Vance, 68F</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Room ICU-04 &bull; MRN-882910
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  POST-OP DAY 2
                </span>
              </div>

              {/* Patient Risk Prediction Banner */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    DETERIORATION RISK ASSESSMENT
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                    HIGH RISK TIER
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-slate-950 font-mono tracking-tight">
                    84.7%
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Calibrated Margin: 0.81 &bull; Brier: 0.08
                  </span>
                </div>

                {/* Tri-color Risk Gauge */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                    <div className="bg-emerald-400 h-2.5 w-[30%]" />
                    <div className="bg-amber-400 h-2.5 w-[40%]" />
                    <div className="bg-rose-500 h-2.5 w-[30%]" />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>LOW (0-30%)</span>
                    <span>MODERATE (30-70%)</span>
                    <span className="text-rose-600 font-bold">HIGH (70-100%)</span>
                  </div>
                </div>
              </div>

              {/* TreeSHAP Explainability Attribution Preview */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-teal-600" />
                    TreeSHAP Feature Attributions
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Log-Odds Impact</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-700 font-medium">Serum Lactate (3.8 mmol/L)</span>
                      <span className="font-mono font-bold text-rose-700">+0.214 (Risk +)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: "75%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-700 font-medium">Mean Arterial Pressure (58 mmHg)</span>
                      <span className="font-mono font-bold text-amber-700">+0.168 (Risk +)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "55%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-700 font-medium">SpO2 / FiO2 Ratio (182)</span>
                      <span className="font-mono font-bold text-amber-700">+0.092 (Risk +)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "38%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-700 font-medium">Platelet Count (210 ×10³/µL)</span>
                      <span className="font-mono font-bold text-emerald-700">-0.038 (Protective)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "20%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Deterministic Safety Railing Audit */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-snug">
                  <strong>Safety Rule Check:</strong> qSOFA = 2 (Positive) &bull; NEWS2 = 8 (High Alert). Recommended Sepsis Bundle order ready for clinician authorization.
                </p>
              </div>

              {/* Clinician Action Buttons */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAcknowledged(true)}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
                    acknowledged
                      ? "bg-emerald-600 text-white"
                      : "bg-teal-600 hover:bg-teal-700 text-white"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{acknowledged ? "Signed by Attending M.D." : "Acknowledge & Order Bundle"}</span>
                </button>
              </div>

              {/* Caption */}
              <p className="text-[11px] text-slate-500 text-center italic pt-1">
                Figure: Assistive clinical decision interface showing transparent model attributions with required physician sign-off.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
