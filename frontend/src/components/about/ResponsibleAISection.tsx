"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Eye,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  Award,
  Activity,
  Terminal,
  Server,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

interface AgentRole {
  name: string;
  codename: string;
  responsibility: string;
  invariants: string[];
  safetyGate: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SWARM_ROLES: AgentRole[] = [
  {
    name: "Swarm Coordinator",
    codename: "coordinator",
    responsibility: "Top-level orchestrator. Dispatches telemetry, aggregates consensus across safety agents, and requests human sign-off.",
    invariants: ["Dispatches subtasks without storing raw PHI", "Enforces unanimous safety clearance"],
    safetyGate: "Zero autonomous action dispatch",
    icon: Terminal,
  },
  {
    name: "Clinical Safety Agent",
    codename: "clinical-safety-agent",
    responsibility: "Audits every risk prediction against deterministic medical scoring rules (qSOFA, NEWS2, shock index) and uncertainty thresholds.",
    invariants: ["Hardcoded qSOFA / NEWS2 verification", "Epistemic uncertainty threshold check"],
    safetyGate: "Abstains if uncertainty > 0.82",
    icon: ShieldCheck,
  },
  {
    name: "ML Engineer Agent",
    codename: "ml-engineer-agent",
    responsibility: "Continuously audits model calibration curves, Brier reliability scores, and multi-hospital evaluation metrics.",
    invariants: ["Platt probability calibration audit", "Forbids metric fabrication"],
    safetyGate: "Brier reliability threshold < 0.10",
    icon: Activity,
  },
  {
    name: "MLOps & Drift Agent",
    codename: "mlops-agent",
    responsibility: "Monitors cohort feature stability and concept drift (PSI, Kolmogorov-Smirnov) to trigger human retraining gates.",
    invariants: ["Population Stability Index tracking", "Automated alert on seasonal drift"],
    safetyGate: "Drift gate trigger PSI > 0.100",
    icon: TrendingUp,
  },
  {
    name: "Explainability Agent",
    codename: "clinical-explainability-agent",
    responsibility: "Computes exact additive TreeSHAP pathophysiological feature attributions for every bedside alert.",
    invariants: ["Additive Shapley decomposition", "Biological plausibility checks"],
    safetyGate: "100% factor attribution required",
    icon: Eye,
  },
  {
    name: "Healthcare Security & Privacy",
    codename: "privacy-agent",
    responsibility: "Enforces stateless context minimization, least-privilege RBAC matrices, and zero PHI in external agent memory.",
    invariants: ["Zero-PHI external memory boundary", "Neon PostgreSQL sole authoritative store"],
    safetyGate: "Context minimization filter",
    icon: Lock,
  },
];

interface ResponsiblePillar {
  title: string;
  subtitle: string;
  description: string;
  auditStamp: string;
  icon: React.ComponentType<{ className?: string }>;
  points: string[];
}

const PILLARS: ResponsiblePillar[] = [
  {
    title: "Human Oversight",
    subtitle: "CLINICIAN IN THE LOOP",
    description:
      "AI never issues standalone prescriptions or autonomous diagnoses. Clinicians inspect risk probabilities and retain final clinical sign-off.",
    auditStamp: "Attending Gate: Mandatory",
    icon: UserCheck,
    points: [
      "Mandatory attending physician sign-off gate",
      "Explicit audit documentation for clinical overrides",
      "Zero autonomous prescriptions or therapies",
    ],
  },
  {
    title: "Absolute Explainability",
    subtitle: "INTERPRETABLE INFERENCES",
    description:
      "Black-box predictions are prohibited. Every patient risk score is paired with localized TreeSHAP feature attributions and entropy bounds.",
    auditStamp: "TreeSHAP Local Attributions",
    icon: Eye,
    points: [
      "TreeSHAP additive feature attributions",
      "Shannon entropy uncertainty abstention flags",
      "Biologically plausible range validation checks",
    ],
  },
  {
    title: "Privacy & Security",
    subtitle: "ZERO PHI LEAKAGE",
    description:
      "All persistent records reside securely in Neon PostgreSQL. Patient PHI is excluded from external agent memories, and role boundaries are audited.",
    auditStamp: "Authoritative Neon Store",
    icon: ShieldCheck,
    points: [
      "Neon PostgreSQL sole authoritative store",
      "Least-privilege RBAC matrices across 5 roles",
      "Stateless context minimization before inference",
    ],
  },
  {
    title: "Continuous Drift Monitoring",
    subtitle: "EMPIRICAL CALIBRATION",
    description:
      "Models undergo ongoing drift analysis (PSI, KS-tests), Brier score calibration, and sensitivity audits to guard against performance decay.",
    auditStamp: "PSI Drift Detection Active",
    icon: TrendingUp,
    points: [
      "Continuous Brier score calibration audits",
      "Population Stability Index (PSI) drift alarms",
      "Automated governance alerts to MLOps team",
    ],
  },
];

export function ResponsibleAISection() {
  const [activeRoleIdx, setActiveRoleIdx] = useState(0);
  const activeRole = SWARM_ROLES[activeRoleIdx];
  const RoleIcon = activeRole.icon;

  return (
    <section id="responsible-ai" className="py-20 sm:py-28 bg-slate-50/50 border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>ETHICAL AI &amp; CLINICAL GOVERNANCE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Responsible Intelligence{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              by Design
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            We hold our clinical AI architecture to the highest institutional standards of patient
            safety, probabilistic calibration, deterministic safety interlocks, and regulatory governance.
          </p>

          {/* Regulatory Badges Strip */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-mono font-semibold text-slate-700">
            <span className="px-3 py-1 rounded-full bg-white border border-slate-300 shadow-2xs flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-teal-700" />
              FDA SaMD Guidance Aligned
            </span>
            <span className="px-3 py-1 rounded-full bg-white border border-slate-300 shadow-2xs flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-teal-700" />
              HIPAA Omnibus Rule
            </span>
            <span className="px-3 py-1 rounded-full bg-white border border-slate-300 shadow-2xs flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
              SOC 2 Type II Security
            </span>
            <span className="px-3 py-1 rounded-full bg-white border border-slate-300 shadow-2xs flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-teal-700" />
              HL7 FHIR v4.0.1
            </span>
          </div>
        </div>

        {/* 1. Ruflo Policy-Governed Swarm Interactive Architecture */}
        <div className="rounded-3xl bg-white border border-slate-300 p-6 sm:p-8 lg:p-10 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider block">
                POLICY-GOVERNED SWARM ORCHESTRATION
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                Ruflo v3.42.0 Hierarchical Multi-Agent Safety Consensus
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hierarchical Consensus Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Agent Role Selector (5 cols) */}
            <div className="lg:col-span-5 space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Specialized Clinical Safety Agents:
              </span>
              {SWARM_ROLES.map((role, idx) => {
                const Icon = role.icon;
                const isSelected = activeRoleIdx === idx;
                return (
                  <button
                    key={role.codename}
                    type="button"
                    onClick={() => setActiveRoleIdx(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-white text-slate-950 border-teal-600 shadow-md ring-2 ring-teal-500/20"
                        : "bg-slate-50 hover:bg-white text-slate-900 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          isSelected ? "bg-teal-700 text-white shadow-xs" : "bg-white border border-slate-200 text-slate-700"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-slate-950">
                          {role.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            isSelected ? "text-teal-800 font-bold" : "text-slate-500"
                          }`}
                        >
                          @{role.codename}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-3.5 w-3.5 ${
                        isSelected ? "text-teal-700 translate-x-1" : "text-slate-400"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Agent Detail Card (7 cols) */}
            <div className="lg:col-span-7">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
                      @{activeRole.codename}
                    </span>
                    <h4 className="text-xl font-bold text-slate-950 tracking-tight">
                      {activeRole.name}
                    </h4>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <RoleIcon className="h-5 w-5" />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeRole.responsibility}
                </p>

                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                    Strict Operational Invariants:
                  </span>
                  {activeRole.invariants.map((inv) => (
                    <div key={inv} className="flex items-center gap-2 text-xs font-medium text-slate-800">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                      <span>{inv}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-white text-slate-900 font-mono text-xs flex items-center justify-between border border-slate-200 shadow-2xs">
                  <span className="text-slate-500">Enforced Safety Gate:</span>
                  <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {activeRole.safetyGate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Four Governance Pillars (Human Oversight, Explainability, Privacy, Drift) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shadow-2xs">
                      <Icon className="h-5 w-5 text-teal-700" />
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {pillar.auditStamp}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-950 tracking-tight">
                      {pillar.title}
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-teal-700 block uppercase">
                      {pillar.subtitle}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {pillar.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    {pillar.points.map((pt) => (
                      <div key={pt} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                        <CheckCircle2 className="h-3 w-3 text-teal-700 mt-0.5 shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Mandatory Regulatory Non-Autonomous Disclaimer Callout */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-teal-300 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-teal-900 font-mono font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-teal-700" />
            <span>MANDATORY CLINICAL SAFETY &amp; LEGAL DISCLAIMER</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            HealthNova AI is designed strictly as a clinical decision support system (CDSS) and{" "}
            <strong className="text-slate-950 font-bold">
              should not be treated as an autonomous medical diagnosis or treatment decision
            </strong>{" "}
            system. All clinical risk scores, trajectory forecasts, and protocol recommendations
            require independent clinical evaluation and confirmation by an appropriately qualified,
            licensed healthcare professional prior to initiating any patient care intervention.
          </p>
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-500">
            <span>FDA 21 CFR Part 820 • Class II SaMD Quality Management Framework</span>
            <span className="font-bold text-slate-700">Authoritative Persistence: Neon PostgreSQL</span>
          </div>
        </div>
      </div>
    </section>
  );
}
