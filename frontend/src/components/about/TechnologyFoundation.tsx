"use client";

import React, { useState } from "react";
import {
  Database,
  Server,
  Layout,
  Network,
  Cpu,
  Bot,
  Radio,
  Lock,
  Sparkles,
  CheckCircle2,
  Zap,
  ShieldCheck,
  ChevronRight,
  Activity,
  Layers,
  Code2,
} from "lucide-react";

interface TechTier {
  tierNumber: string;
  name: string;
  badge: string;
  roleDescription: string;
  technologies: {
    name: string;
    version: string;
    role: string;
    latencySLA: string;
  }[];
  architecturalGuarantees: string[];
  failSafeMode: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ARCHITECTURE_TIERS: TechTier[] = [
  {
    tierNumber: "01",
    name: "High-Assurance Data & Persistence Tier",
    badge: "AUTHORITATIVE STORE",
    roleDescription:
      "The sole authoritative persistent source of truth for all clinical encounters, telemetry snapshots, and audit records.",
    technologies: [
      { name: "Neon PostgreSQL", version: "PostgreSQL 16", role: "ACID transactions & point-in-time recovery", latencySLA: "p99 < 8ms" },
      { name: "Connection Pooling", version: "PgBouncer", role: "Zero-connection-drop concurrency management", latencySLA: "10,000+ pools" },
      { name: "Context Minimizer", version: "Deterministic", role: "Redacts PHI before ML vectorization", latencySLA: "< 0.05ms" },
    ],
    architecturalGuarantees: [
      "Sole authoritative persistence store across entire platform",
      "Zero patient PHI stored in external agent memory or vector indices",
      "Cryptographic immutable audit trail for every clinician interaction",
    ],
    failSafeMode: "Automated read-replica failover with zero data loss recovery",
    icon: Database,
  },
  {
    tierNumber: "02",
    name: "Deterministic Logic & Safety Core",
    badge: "VERIFICATION GATE",
    roleDescription:
      "Hardcoded clinical scoring rules and strict ORM security boundaries cross-auditing all machine-generated predictions.",
    technologies: [
      { name: "Python / Django", version: "Python 3.12", role: "Deterministic clinical business logic & RBAC", latencySLA: "Sub-5ms execution" },
      { name: "Django REST Framework", version: "DRF 3.15", role: "Strict OpenAPI schema validation & serializers", latencySLA: "Strict Typing" },
      { name: "Clinical Rule Engine", version: "qSOFA / NEWS2", role: "Hardcoded clinical baseline verification", latencySLA: "0.012ms audit" },
    ],
    architecturalGuarantees: [
      "Deterministic medical rules cross-audit every statistical prediction",
      "Least-privilege role-based access control across 5 hospital tiers",
      "Comprehensive telemetry audit logging to PostgreSQL backend",
    ],
    failSafeMode: "Immediate fallback to deterministic clinical scoring (NEWS2/qSOFA)",
    icon: Server,
  },
  {
    tierNumber: "03",
    name: "Calibrated ML & Explainability Engine",
    badge: "ANALYTICS ENGINE",
    roleDescription:
      "Ensemble machine learning models paired with exact additive Shapley feature attributions and drift detection.",
    technologies: [
      { name: "CatBoost & Random Forest", version: "Ensemble ML", role: "Multi-hospital evaluated risk stratification", latencySLA: "0.136ms p99" },
      { name: "TreeSHAP Engine", version: "Exact Additive", role: "Local pathophysiological feature attributions", latencySLA: "< 12ms attribution" },
      { name: "MLOps Drift Guard", version: "PSI / KS-Test", role: "Continuous population drift & calibration tracking", latencySLA: "Real-time audit" },
    ],
    architecturalGuarantees: [
      "ROC-AUC 0.94 multi-center validated cohort discrimination",
      "Platt probability calibration maintains Brier score below 0.10",
      "Algorithmic abstention triggered when epistemic uncertainty > 0.82",
    ],
    failSafeMode: "Abstains and emits INSUFFICIENT_INFORMATION flag if confidence is low",
    icon: Cpu,
  },
  {
    tierNumber: "04",
    name: "Zero-Latency Telemetry & Point-of-Care UX",
    badge: "PRESENTATION TIER",
    roleDescription:
      "High-throughput WebSocket streaming and accessible hospital-grade interfaces for bedside clinicians and triage nurses.",
    technologies: [
      { name: "Next.js 16 (App Router)", version: "React 19", role: "Server components & zero-runtime bug architecture", latencySLA: "< 100ms FCP" },
      { name: "Django Channels & Redis", version: "ASGI WebSocket", role: "Sub-20ms point-of-care live telemetry broadcast", latencySLA: "< 20ms sync" },
      { name: "HL7 FHIR v4.0.1", version: "SMART-on-FHIR", role: "Bidirectional embedded launch in Epic & Cerner", latencySLA: "Native iframe" },
    ],
    architecturalGuarantees: [
      "Sub-20ms point-of-care live telemetry streaming across ICU wards",
      "Dedicated clean light-mode clinical palette for high-glare environments",
      "Full WCAG 2.1 AA accessibility and Apple HIG 44px touch targets",
    ],
    failSafeMode: "Graceful HTTP long-polling degradation if WebSocket drops",
    icon: Layout,
  },
];

export function TechnologyFoundation() {
  const [selectedTierIdx, setSelectedTierIdx] = useState(0);
  const activeTier = ARCHITECTURE_TIERS[selectedTierIdx];
  const TierIcon = activeTier.icon;

  return (
    <section id="technology" className="py-20 sm:py-28 bg-white border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>SYSTEM ARCHITECTURE MATRIX</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Built for Mission-Critical{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Clinical Intelligence
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            A 4-tier high-assurance systems architecture engineered with strict separation of
            concerns, zero-PHI boundaries, sub-millisecond inference, and deterministic safety interlocks.
          </p>
        </div>

        {/* Tier Tabs Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ARCHITECTURE_TIERS.map((tier, idx) => {
            const Icon = tier.icon;
            const isSelected = selectedTierIdx === idx;
            return (
              <button
                key={tier.tierNumber}
                type="button"
                onClick={() => setSelectedTierIdx(idx)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-white text-slate-950 border-teal-600 shadow-md ring-2 ring-teal-500/20"
                    : "bg-slate-50 hover:bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-teal-700 text-white shadow-xs" : "bg-white border border-slate-200 text-slate-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase ${
                      isSelected ? "text-teal-800" : "text-slate-500"
                    }`}
                  >
                    Tier {tier.tierNumber}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold tracking-tight text-slate-950 line-clamp-1">
                  {tier.name}
                </h4>
                <span className="text-[10px] text-slate-500 block mt-0.5">{tier.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Tier Deep Inspection Blueprint */}
        <div className="rounded-3xl bg-slate-50 border border-slate-300 p-6 sm:p-8 lg:p-10 space-y-8 shadow-sm">
          {/* Tier Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200">
                  TIER {activeTier.tierNumber} SPECIFICATION
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">{activeTier.badge}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                {activeTier.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
                {activeTier.roleDescription}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-800/20">
              <TierIcon className="h-7 w-7" />
            </div>
          </div>

          {/* Technology Specifications Grid */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block">
              PRODUCTION STACK COMPONENTS &amp; BENCHMARKS
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeTier.technologies.map((tech) => (
                <div
                  key={tech.name}
                  className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-950 text-sm">{tech.name}</h5>
                    <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {tech.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{tech.role}</p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Performance SLA:</span>
                    <span className="font-bold text-slate-800">{tech.latencySLA}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Architectural Guarantees & Fail-Safe Protocol */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
            <div className="md:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
              <span className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                Architectural Invariants &amp; Guarantees:
              </span>
              <div className="space-y-2">
                {activeTier.architecturalGuarantees.map((g) => (
                  <div key={g} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 mt-0.5 shrink-0" />
                    <span>{g}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 p-5 rounded-2xl bg-white text-slate-900 border border-slate-200 space-y-2 font-mono text-xs flex flex-col justify-between shadow-2xs">
              <div className="space-y-1.5">
                <span className="text-teal-800 font-bold flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-teal-700" />
                  Deterministic Fail-Safe Mode:
                </span>
                <p className="text-slate-600 text-xs leading-relaxed font-sans">
                  {activeTier.failSafeMode}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>HA Level: 99.99% Uptime</span>
                <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ACTIVE DEPLOYMENT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
