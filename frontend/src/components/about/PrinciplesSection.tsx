"use client";

import React, { useState } from "react";
import {
  HeartPulse,
  Eye,
  UserCheck,
  Lock,
  Sliders,
  Layers,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Code2,
  Scale,
} from "lucide-react";

interface Principle {
  number: string;
  roman: string;
  title: string;
  ethos: string;
  summary: string;
  clinicalRationale: string;
  mathematicalProof: string;
  regulatoryStandard: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRINCIPLES: Principle[] = [
  {
    number: "01",
    roman: "I",
    title: "Primum Non Nocere",
    ethos: "FIRST, DO NO HARM",
    summary:
      "Algorithmic conservatism prioritizes patient safety above speculative inference. When confidence is low or uncertainty is elevated, the system defers immediately to bedside clinicians.",
    clinicalRationale:
      "A false-positive alert leads to unnecessary interventions and alert desensitization; a false-negative can be fatal. In high-entropy scenarios, abstention preserves clinician vigilance.",
    mathematicalProof:
      "Epistemic uncertainty > 0.82 or Shannon entropy H(p) > 0.65 bits triggers immediate fallback abstention flag.",
    regulatoryStandard: "FDA SaMD Guidance Section 5.2 • AMA Ethical AI Principle 1",
    icon: HeartPulse,
  },
  {
    number: "02",
    roman: "II",
    title: "Absolute Explainability",
    ethos: "TRANSPARENCY BY DEFAULT",
    summary:
      "Black-box neural networks are never deployed without local interpretability. Every risk score is accompanied by exact additive TreeSHAP pathophysiological attributions.",
    clinicalRationale:
      "Physicians cannot act on un-explainable risk scores. TreeSHAP breaks down the risk into actionable physiological components: arterial pressure, serum lactate, oxygenation index.",
    mathematicalProof:
      "Exact Shapley value decomposition: f(x) = φ₀ + ∑ φᵢ(x) where φᵢ represents the marginal impact of biomarker i.",
    regulatoryStandard: "EU AI Act High-Risk Annex III • Section 13 Transparency Mandate",
    icon: Eye,
  },
  {
    number: "03",
    roman: "III",
    title: "Clinician Autonomy",
    ethos: "AMPLIFY, NEVER REPLACE",
    summary:
      "AI is strictly an assistive colleague, never an autonomous decision-maker. We respect clinician intuition and bedside findings with frictionless human-in-the-loop controls.",
    clinicalRationale:
      "Patient care requires holistic bedside judgment that numbers alone cannot capture. AI calculates trajectories; licensed attending physicians retain exclusive sign-off authority.",
    mathematicalProof:
      "Mandatory attending physician cryptographic sign-off gate enforced prior to EHR order transmission.",
    regulatoryStandard: "FDA 21 CFR 820.30 Design Controls • Joint Commission Alert Safety",
    icon: UserCheck,
  },
  {
    number: "04",
    roman: "IV",
    title: "Privacy & Security by Design",
    ethos: "ZERO-PHI MEMORY BOUNDARY",
    summary:
      "Context minimization ensures patient identifiers never leave authoritative Neon PostgreSQL stores. Role-based access control, TLS 1.3, and AES-256 protect every telemetry packet.",
    clinicalRationale:
      "Health systems cannot risk PHI leakage into public LLMs or external vector stores. Stateless agent pipelines guarantee zero persistent PHI in AI memory.",
    mathematicalProof:
      "Deterministic context minimization: Redacts MRN, name, and demographic identifiers before statistical vectorization.",
    regulatoryStandard: "HIPAA Security Rule § 164.312 • SOC 2 Type II Certified",
    icon: Lock,
  },
  {
    number: "05",
    roman: "V",
    title: "Continuous Calibration",
    ethos: "EMPIRICAL STEWARDSHIP",
    summary:
      "Clinical populations drift across seasons and demographics. We continuously evaluate Population Stability Index (PSI), Kolmogorov-Smirnov statistics, and Brier calibration curves.",
    clinicalRationale:
      "Un-monitored models decay quietly over time, causing mis-stratified ICU admissions. Automated drift monitoring flags model drift before patient outcomes are impacted.",
    mathematicalProof:
      "PSI drift alarm triggers retraining review if PSI > 0.100; Brier score maintained below 0.10 across all cohorts.",
    regulatoryStandard: "Good Machine Learning Practice (GMLP) FDA/Health Canada/MHRA",
    icon: Sliders,
  },
  {
    number: "06",
    roman: "VI",
    title: "Seamless Workflow Delivery",
    ethos: "ZERO COGNITIVE FRICTION",
    summary:
      "Intelligence is useless if buried behind separate logins. We integrate natively into EHR views via HL7 FHIR v4.0.1, mobile triage alerts, and ambient clinician dashboards.",
    clinicalRationale:
      "Clinicians operate under severe cognitive burden. Requiring dual monitors or external logins degrades adoption. Point-of-care embedded delivery saves critical minutes.",
    mathematicalProof:
      "SMART-on-FHIR launch embedded within Epic Hyperspace and Cerner Millennium under 20ms round-trip latency.",
    regulatoryStandard: "HL7 FHIR R4.0.1 US Core Implementation Guide",
    icon: Layers,
  },
];

export function PrinciplesSection() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activePrinciple = PRINCIPLES[selectedIdx];
  const ActiveIcon = activePrinciple.icon;

  return (
    <section id="principles" className="py-20 sm:py-28 bg-white border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>ETHICS &amp; GOVERNANCE CONSTITUTION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            The Principles That{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Guide Everything We Do
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Six non-negotiable architectural and clinical invariants engineered to safeguard
            patient care, preserve clinician autonomy, and uphold medical ethics.
          </p>
        </div>

        {/* Master-Detail Constitution Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Principle Selector List (5 cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                CORE CLINICAL INVARIANTS
              </span>
              <span className="text-xs font-mono text-teal-700 font-semibold">
                Select to Inspect Proof
              </span>
            </div>

            {PRINCIPLES.map((p, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={p.number}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-white text-slate-950 border-teal-600 shadow-md ring-2 ring-teal-500/20"
                      : "bg-slate-50 hover:bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                        isSelected
                          ? "bg-teal-700 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700"
                      }`}
                    >
                      {p.roman}
                    </div>
                    <div>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${
                          isSelected ? "text-teal-800" : "text-slate-500"
                        }`}
                      >
                        {p.ethos}
                      </span>
                      <h4 className="text-sm font-bold tracking-tight text-slate-950">
                        {p.title}
                      </h4>
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      isSelected ? "text-teal-700 translate-x-1" : "text-slate-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Deep Clinical Engineering Inspector (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-slate-50 border border-slate-300 p-6 sm:p-8 space-y-6 shadow-sm">
              {/* Active Principle Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200">
                      INVARIANT {activePrinciple.roman}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                      {activePrinciple.ethos}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    {activePrinciple.title}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-800/20">
                  <ActiveIcon className="h-6 w-6" />
                </div>
              </div>

              {/* Core Description */}
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                {activePrinciple.summary}
              </p>

              {/* Deep Clinical Rationale */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                <span className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1.5">
                  <HeartPulse className="h-4 w-4 text-teal-700" />
                  Clinical Justification &amp; Frontline Impact:
                </span>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {activePrinciple.clinicalRationale}
                </p>
              </div>

              {/* Mathematical Formulation / Implementation Proof */}
              <div className="p-4 rounded-2xl bg-white text-slate-900 space-y-2 border border-slate-200 font-mono shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-teal-800 font-bold flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-teal-700" />
                    Algorithmic &amp; Architectural Enforcement:
                  </span>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    100% DETERMINISTIC
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {activePrinciple.mathematicalProof}
                </p>
              </div>

              {/* Regulatory Compliance Anchor */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-500 border-t border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <Scale className="h-4 w-4 text-teal-700" />
                  Regulatory Alignment:
                </span>
                <span className="text-teal-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 font-bold text-[11px]">
                  {activePrinciple.regulatoryStandard}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
