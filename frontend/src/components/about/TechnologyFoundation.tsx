"use client";

import React from "react";
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
} from "lucide-react";

interface TechCategory {
  category: string;
  tier: string;
  roleDescription: string;
  technologies: { name: string; detail: string; tag: string }[];
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  hoverBorder: string;
}

const TECH_ECOSYSTEM: TechCategory[] = [
  {
    category: "Authoritative Data Store",
    tier: "DATA TIER",
    roleDescription: "Sole authoritative persistent source of truth",
    technologies: [
      { name: "Neon PostgreSQL", detail: "ACID transactions, point-in-time recovery, autoscaling", tag: "PostgreSQL 16" },
    ],
    icon: Database,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-800 border-emerald-200",
    hoverBorder: "hover:border-emerald-400 hover:shadow-emerald-500/5",
  },
  {
    category: "Clinical Backend",
    tier: "LOGIC TIER",
    roleDescription: "Deterministic security, ORM boundaries & audit trails",
    technologies: [
      { name: "Python / Django", detail: "Deterministic security, ORM boundaries", tag: "Python 3.12" },
      { name: "Django REST Framework", detail: "Strict schema validation & serialization", tag: "REST API" },
    ],
    icon: Server,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-800 border-blue-200",
    hoverBorder: "hover:border-blue-400 hover:shadow-blue-500/5",
  },
  {
    category: "Clinician Frontend",
    tier: "INTERFACE TIER",
    roleDescription: "Accessible, responsive light-mode hospital interface",
    technologies: [
      { name: "Next.js 16 (App Router)", detail: "Server Components & optimized asset delivery", tag: "Next.js 16" },
      { name: "React 19 & TypeScript", detail: "Type-safe state management & zero-runtime bugs", tag: "Strict Types" },
    ],
    icon: Layout,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-800 border-teal-200",
    hoverBorder: "hover:border-teal-400 hover:shadow-teal-500/5",
  },
  {
    category: "EHR Interoperability",
    tier: "INTEGRATION TIER",
    roleDescription: "Native HL7 FHIR v4.0.1 and SMART-on-FHIR",
    technologies: [
      { name: "HL7 FHIR v4.0.1", detail: "Bi-directional patient sync (Epic, Cerner)", tag: "FHIR v4.0.1" },
      { name: "SMART on FHIR", detail: "Embedded point-of-care EHR launch workflows", tag: "SMART App" },
    ],
    icon: Network,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-700",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-800 border-indigo-200",
    hoverBorder: "hover:border-indigo-400 hover:shadow-indigo-500/5",
  },
  {
    category: "Machine Learning Engine",
    tier: "ANALYTICS TIER",
    roleDescription: "Ensemble risk modeling with local explainability",
    technologies: [
      { name: "scikit-learn & CatBoost", detail: "Random Forest, Gradient Boosting, SVM", tag: "ROC-AUC 0.94" },
      { name: "TreeSHAP", detail: "Per-patient feature attributions & margin breakdown", tag: "Explainability" },
    ],
    icon: Cpu,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800 border-amber-200",
    hoverBorder: "hover:border-amber-400 hover:shadow-amber-500/5",
  },
  {
    category: "Governed AI & Agents",
    tier: "ORCHESTRATION TIER",
    roleDescription: "Controlled tool execution & context minimization",
    technologies: [
      { name: "Ruflo Swarm Coordinator", detail: "Hierarchical clinical safety supervisor", tag: "Swarm v3.42" },
      { name: "Clinical Knowledge Base", detail: "Approved institutional protocol retrieval", tag: "Validated RAG" },
    ],
    icon: Bot,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-700",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-800 border-purple-200",
    hoverBorder: "hover:border-purple-400 hover:shadow-purple-500/5",
  },
  {
    category: "Real-Time Telemetry",
    tier: "STREAMING TIER",
    roleDescription: "Bi-directional WebSocket streaming under 20ms",
    technologies: [
      { name: "Django Channels", detail: "ASGI event loops & clinical ward broadcasts", tag: "ASGI WebSocket" },
      { name: "Redis Channel Layer", detail: "High-throughput in-memory pub/sub broker", tag: "Sub-20ms" },
    ],
    icon: Radio,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-700",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-800 border-rose-200",
    hoverBorder: "hover:border-rose-400 hover:shadow-rose-500/5",
  },
  {
    category: "Security & Cryptography",
    tier: "SECURITY TIER",
    roleDescription: "Zero PHI exfiltration & cryptographic audit logs",
    technologies: [
      { name: "AES-256 & TLS 1.3", detail: "Hardware-level encryption in transit and rest", tag: "FIPS 140-2" },
      { name: "Role-Based ACL", detail: "5 clinical roles enforced with immutable audit logs", tag: "Zero-Trust" },
    ],
    icon: Lock,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-700",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-800 border-sky-200",
    hoverBorder: "hover:border-sky-400 hover:shadow-sky-500/5",
  },
];

export function TechnologyFoundation() {
  return (
    <section id="technology" className="py-20 sm:py-28 bg-gradient-to-b from-slate-50/70 via-slate-50/40 to-white border-b border-slate-200/80 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>SYSTEM ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Built for Modern{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Clinical Intelligence
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            A robust, low-latency, and distributed architecture engineered specifically for mission-critical hospital environments.
          </p>
        </div>

        {/* 8 Tech Categories Grid (2 rows x 4 cols on lg) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TECH_ECOSYSTEM.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <div
                key={cat.category}
                className={`rounded-2xl bg-white border border-slate-200/90 p-6 shadow-xs ${cat.hoverBorder} hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-11 w-11 rounded-xl border border-slate-200/80 ${cat.iconBg} ${cat.iconColor} flex items-center justify-center shadow-2xs transition-transform duration-300 group-hover:scale-110`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${cat.badgeBg} ${cat.badgeText}`}
                    >
                      {cat.tier}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-950 tracking-tight group-hover:text-teal-700 transition-colors">
                      {cat.category}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                      {cat.roleDescription}
                    </p>
                  </div>
                </div>

                {/* Technologies List */}
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-2.5">
                  {cat.technologies.map((t) => (
                    <div key={t.name} className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{t.name}</span>
                        <span className="text-[9px] font-mono font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                          {t.tag}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 leading-snug block">
                        {t.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
