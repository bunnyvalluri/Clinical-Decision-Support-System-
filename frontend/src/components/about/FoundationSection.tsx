"use client";

import React, { useState } from "react";
import {
  Eye,
  Target,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Radio,
  FileCheck,
  Scale,
  Sparkles,
} from "lucide-react";

interface ParadigmDimension {
  dimension: string;
  traditional: string;
  healthnova: string;
  metric: string;
}

const PARADIGM_ROWS: ParadigmDimension[] = [
  {
    dimension: "Intervention Window",
    traditional: "Reactive: Alerts trigger 0–15 min post-threshold collapse",
    healthnova: "Anticipatory: Sepsis & respiratory decompensation forecast 6–8 hours in advance",
    metric: "+6.4 Hours Lead Time",
  },
  {
    dimension: "Alarm Specificity",
    traditional: "Severe alarm fatigue: Up to 99% non-actionable bedside beeps",
    healthnova: "Dual-gated: Hardcoded deterministic safety interlocks eliminate alarm noise",
    metric: "72% Noise Reduction",
  },
  {
    dimension: "Clinical Explainability",
    traditional: "Opaque black box: Flashing lights without physiological drivers",
    healthnova: "Local TreeSHAP attributions: Transparent pathophysiological biomarker breakdown",
    metric: "100% Attributable",
  },
  {
    dimension: "Decision Authority",
    traditional: "Un-audited fragmented alerts across disparate monitors",
    healthnova: "Mandatory human-in-the-loop: Licensed clinician sign-off required for orders",
    metric: "100% Human Governed",
  },
  {
    dimension: "EHR Interoperability",
    traditional: "Siloed bedside displays requiring manual chart transcription",
    healthnova: "Native HL7 FHIR v4.0.1 and SMART-on-FHIR embedded directly in Epic & Cerner",
    metric: "<20ms Telemetry Sync",
  },
  {
    dimension: "PHI Memory Boundary",
    traditional: "Un-redacted patient data stored in third-party vendor clouds",
    healthnova: "Context minimization: Zero PHI in external agent memory; Neon PostgreSQL sole store",
    metric: "HIPAA Zero-Leak",
  },
];

interface Pillar {
  title: string;
  ethos: string;
  lead: string;
  deliverables: string[];
  metricTag: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PILLARS: Pillar[] = [
  {
    title: "Our Vision",
    ethos: "ANTICIPATORY & PRECISION CARE",
    lead: "Transforming inpatient and acute hospital care into an anticipatory, precision-guided environment where preventable clinical deteriorations are intercepted hours before bedside monitors alarm.",
    deliverables: [
      "Early sepsis trajectory prediction 6-8 hours in advance",
      "Sub-20ms telemetry synchronization across acute wards",
      "Elimination of cognitive documentation and alarm fatigue",
    ],
    metricTag: "Target: Sub-20ms Bedside Sync",
    icon: Eye,
  },
  {
    title: "Our Mission",
    ethos: "EVIDENCE-INFORMED DECISION SUPPORT",
    lead: "Empowering frontline physicians, intensive care nurses, and rapid response teams with calibrated, transparent, and clinically-validated decision support tools that eliminate diagnostic blindspots.",
    deliverables: [
      "Platt-calibrated ensemble ML evaluated on multi-hospital cohorts",
      "Native bidirectional HL7 FHIR v4.0.1 EHR interoperability",
      "Context minimization redacting patient PHI prior to inference",
    ],
    metricTag: "Evaluated: ROC-AUC 0.94",
    icon: Target,
  },
  {
    title: "Our Purpose",
    ethos: "HUMAN-CENTERED CLINICAL AI",
    lead: "Engineering reliable, ethically-grounded clinical intelligence that respects physician autonomy, enforces strict HIPAA/SOC 2 privacy, and preserves the inviolable doctor-patient relationship.",
    deliverables: [
      "Mandatory attending physician gate: AI assists, humans decide",
      "Strict compliance with FDA non-device CDSS guidance",
      "Sole authoritative persistence in Neon PostgreSQL",
    ],
    metricTag: "Policy: 100% Clinician Sign-Off",
    icon: HeartHandshake,
  },
];

export function FoundationSection() {
  const [selectedPillar, setSelectedPillar] = useState(0);

  return (
    <section id="foundation" className="py-20 sm:py-28 bg-white border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Eyebrow & Headline */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>CLINICAL PARADIGM SHIFT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Bridging the Gap Between{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Telemetry, Intelligence &amp; Care
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Traditional hospital monitoring is reactive and fragmented. HealthNova AI shifts
            clinical operations from retroactive alarm triage to anticipatory bedside decision support.
          </p>
        </div>

        {/* 1. Paradigm Comparison: Traditional vs HealthNova */}
        <div className="rounded-3xl bg-slate-50 border border-slate-300/80 p-6 sm:p-8 lg:p-10 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider block">
                SYSTEMIC COMPARISON
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                Traditional Bedside Monitoring vs. HealthNova CDS Platform
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Conventional EHR / Monitors
              </span>
              <span className="flex items-center gap-1.5 text-teal-800 font-bold">
                <span className="h-2 w-2 rounded-full bg-teal-600" />
                HealthNova Dual-Gated AI
              </span>
            </div>
          </div>

          {/* Desktop High-Density Comparison Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-300 font-mono text-xs uppercase text-slate-600">
                  <th className="py-3 px-4 w-1/5 font-bold">Clinical Dimension</th>
                  <th className="py-3 px-4 w-2/5 font-bold text-slate-600">Traditional Reactive Monitoring</th>
                  <th className="py-3 px-4 w-2/5 font-bold text-teal-900 bg-teal-100/50 rounded-t-lg">
                    HealthNova Anticipatory CDS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {PARADIGM_ROWS.map((row) => (
                  <tr key={row.dimension} className="hover:bg-slate-100/70 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      {row.dimension}
                      <span className="block text-[10px] font-mono text-teal-700 font-semibold mt-0.5">
                        {row.metric}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-normal">
                      <div className="flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5 font-bold text-xs shrink-0">✕</span>
                        <span>{row.traditional}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-950 bg-teal-50/50">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-teal-700 mt-0.5 shrink-0" />
                        <span>{row.healthnova}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Comparison Cards */}
          <div className="md:hidden space-y-4">
            {PARADIGM_ROWS.map((row) => (
              <div
                key={row.dimension}
                className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-mono font-bold text-xs text-slate-900">{row.dimension}</span>
                  <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {row.metric}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="text-slate-500 flex items-start gap-1.5">
                    <span className="text-slate-400 font-bold shrink-0">✕</span>
                    <span>{row.traditional}</span>
                  </div>
                  <div className="text-slate-950 font-medium flex items-start gap-1.5 bg-teal-50/70 p-2 rounded-lg border border-teal-100">
                    <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                    <span>{row.healthnova}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Institutional Foundation Pillars: Vision, Mission, Purpose */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              INSTITUTIONAL BEDROCK
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Vision, Mission &amp; Purpose
            </h3>
            <p className="text-sm text-slate-600">
              Three unyielding commitments guiding our clinical software architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              const isSelected = selectedPillar === idx;
              return (
                <div
                  key={pillar.title}
                  onClick={() => setSelectedPillar(idx)}
                  className={`rounded-3xl p-6 sm:p-8 border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? "bg-white border-teal-600 shadow-lg ring-1 ring-teal-500/20"
                      : "bg-slate-50/90 hover:bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-teal-700 text-white shadow-md shadow-teal-800/20"
                            : "bg-white border border-slate-200 text-slate-700"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 uppercase tracking-wider shadow-2xs">
                        {pillar.ethos}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-slate-950 tracking-tight">
                        {pillar.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {pillar.lead}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-200/80 space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Core Commitments:
                      </span>
                      {pillar.deliverables.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                      {pillar.metricTag}
                    </span>
                    <span className="text-slate-400 text-xs">Pillar 0{idx + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
