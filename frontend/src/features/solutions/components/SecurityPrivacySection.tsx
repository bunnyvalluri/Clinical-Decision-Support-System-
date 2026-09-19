"use client";

import React from "react";
import {
  Shield,
  Lock,
  KeyRound,
  FileText,
  Server,
  Eye,
  Cpu,
  Database,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface SecurityFeature {
  title: string;
  architecture: string;
  complianceTag: string;
  description: string;
  icon: React.ElementType;
}

const SECURITY_FEATURES: SecurityFeature[] = [
  {
    title: "Granular Role-Based Access (RBAC)",
    architecture: "Django Permissions & Token Auth",
    complianceTag: "HIPAA §164.312(a)",
    description:
      "Strict separation of roles (Doctor, Nurse, Informaticist, Admin, Patient) ensuring users only view authorized patient subsets.",
    icon: KeyRound,
  },
  {
    title: "Least-Privilege Principle",
    architecture: "ClinicalRiskContextBuilder",
    complianceTag: "Context Minimization",
    description:
      "Context minimization extracts only vital physiological parameters necessary for inference, omitting names, SSNs, and addresses.",
    icon: Lock,
  },
  {
    title: "Cryptographic Audit Trails",
    architecture: "Neon PostgreSQL",
    complianceTag: "21 CFR Part 11 Aligned",
    description:
      "Every prediction query, vital change, and clinician sign-off writes immutable append-only logs for tamper-evident compliance.",
    icon: FileText,
  },
  {
    title: "Zero-Trust Encrypted Ingestion",
    architecture: "TLS 1.3 & AES-256-GCM",
    complianceTag: "NIST SP 800-52",
    description:
      "End-to-end encrypted transport across client, Django backend, and secure database connections with automated cert rotation.",
    icon: Shield,
  },
  {
    title: "Real-Time Access Monitoring",
    architecture: "Redis & Celery Auditing",
    complianceTag: "Anomaly Tripwires",
    description:
      "Continuous inspection of active sessions and API query spikes with automated rate limiting and brute-force protection.",
    icon: Eye,
  },
  {
    title: "Protected AI Gateway Workflows",
    architecture: "Sanitized LLM Routing",
    complianceTag: "Zero External PHI",
    description:
      "Semantic prompt injection defense and automated outbound PHI redactors ensure third-party LLMs never ingest patient identifiers.",
    icon: Cpu,
  },
];

export function SecurityPrivacySection() {
  return (
    <section id="security-privacy" className="py-16 sm:py-20 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span>ENTERPRISE ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Security Built Into Healthcare Intelligence
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Healthcare data demands defensive engineering. Our architecture implements defense-in-depth across the application, database, and machine learning layers.
          </p>
        </div>

        {/* 6 Security Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECURITY_FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="group rounded-2xl bg-white border border-slate-200/90 p-6 shadow-2xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {feat.architecture}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-950 mb-2 group-hover:text-teal-700 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Enforced by Policy</span>
                  </span>
                  <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                    {feat.complianceTag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
