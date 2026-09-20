"use client";

import React from "react";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck,
  EyeOff,
  Database,
  Sparkles,
  Award,
  CheckCircle2,
  Scale,
} from "lucide-react";

interface SecurityPillar {
  title: string;
  category: string;
  description: string;
  invariant: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECURITY_PILLARS: SecurityPillar[] = [
  {
    title: "Role-Based Access Control (RBAC)",
    category: "IDENTITY & SCOPE",
    description:
      "Granular 5-role authorization matrix ensures patients, doctors, nurses, informaticists, and administrators access only verified clinical scopes.",
    invariant: "Least-privilege RBAC enforced at every API endpoint",
    icon: KeyRound,
  },
  {
    title: "Object-Level Authorization",
    category: "DATA ISOLATION",
    description:
      "Enforced directly at the Django ORM layer to strictly prevent cross-patient record access and horizontal privilege escalation (IDOR protection).",
    invariant: "Zero cross-tenant data bleed across clinical encounters",
    icon: Lock,
  },
  {
    title: "Immutable Cryptographic Audit Trails",
    category: "COMPLIANCE & TRUTH",
    description:
      "Every prediction calculation, attending physician override, vital entry, and administrative query is permanently written with SHA-256 hashes.",
    invariant: "Committed to Neon PostgreSQL authoritative store",
    icon: FileCheck,
  },
  {
    title: "Hardware-Level End-to-End Encryption",
    category: "CRYPTOGRAPHIC INTEGRITY",
    description:
      "TLS 1.3 encryption in transit across all HTTP/WebSocket telemetry connections and AES-256 encryption at rest in Neon PostgreSQL.",
    invariant: "FIPS 140-2 validated cryptographic primitives",
    icon: Database,
  },
  {
    title: "Context Minimization for AI Inference",
    category: "ZERO-PHI BOUNDARY",
    description:
      "ClinicalRiskContextBuilder sanitizes patient records to strip all MRNs, names, and demographic identifiers before computing ML risk vectors.",
    invariant: "Zero PHI stored in external agent memory or vector indices",
    icon: EyeOff,
  },
  {
    title: "Continuous Security Auditing & DevSecOps",
    category: "CONTINUOUS AUDITING",
    description:
      "Integrated Bruno API security suites, Pentest Agents, and automated SAST/DAST pipelines actively verify endpoints against OWASP API Top 10.",
    invariant: "Automated regression testing in CI pipeline",
    icon: ShieldCheck,
  },
];

export function SecurityFeatures() {
  return (
    <section id="security" className="py-10 sm:py-16 lg:py-20 bg-white border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 lg:space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>HEALTHCARE DATA PROTECTION &amp; COMPLIANCE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Security &amp; Governance{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              by Design
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Designed with stringent healthcare privacy and cybersecurity standards.
            Our architecture enforces least-privilege access, zero-PHI exfiltration, and persistent audit logging.
          </p>

          {/* Compliance Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-mono font-semibold text-slate-700">
            <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-teal-700" />
              HIPAA Security Rule § 164.312
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-teal-700" />
              SOC 2 Type II Certified
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
              FDA 21 CFR Part 11 Electronic Records
            </span>
          </div>
        </div>

        {/* 6 Security Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {SECURITY_PILLARS.map((p) => {
            const IconComponent = p.icon;
            return (
              <div
                key={p.title}
                tabIndex={0}
                className="group rounded-2xl sm:rounded-3xl bg-slate-50/70 border border-slate-200/90 p-4 sm:p-6 lg:p-7 shadow-2xs hover:bg-white hover:border-teal-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-teal-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-200">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-white text-slate-700 border border-slate-200 uppercase tracking-wide">
                      {p.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-950 tracking-tight group-hover:text-teal-800 transition-colors">
                    {p.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {p.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center gap-1.5 text-[11px] font-mono text-teal-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                  <span className="truncate font-semibold">{p.invariant}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
