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
} from "lucide-react";

interface TechCategory {
  category: string;
  roleDescription: string;
  technologies: { name: string; detail: string }[];
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
}

const TECH_ECOSYSTEM: TechCategory[] = [
  {
    category: "Authoritative Data Store",
    roleDescription: "Sole authoritative persistent source of truth",
    technologies: [
      { name: "Neon PostgreSQL", detail: "ACID transactions, point-in-time recovery, autoscaling" },
    ],
    icon: Database,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    badgeBg: "bg-emerald-50/80",
    badgeText: "text-emerald-800 border-emerald-200",
  },
  {
    category: "Clinical Backend",
    roleDescription: "Deterministic security, ORM boundaries & audit trails",
    technologies: [
      { name: "Python / Django", detail: "Deterministic security, ORM boundaries" },
      { name: "Django REST Framework", detail: "Strict schema validation & serialization" },
    ],
    icon: Server,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    badgeBg: "bg-blue-50/80",
    badgeText: "text-blue-800 border-blue-200",
  },
  {
    category: "Clinician Frontend",
    roleDescription: "Accessible, responsive light-mode hospital interface",
    technologies: [
      { name: "Next.js 16 (App Router)", detail: "Server Components & optimized asset delivery" },
      { name: "React 19 & TypeScript", detail: "Type-safe state management & zero-runtime bugs" },
    ],
    icon: Layout,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
    badgeBg: "bg-teal-50/80",
    badgeText: "text-teal-800 border-teal-200",
  },
  {
    category: "EHR Interoperability",
    roleDescription: "Native HL7 FHIR v4.0.1 and SMART-on-FHIR",
    technologies: [
      { name: "HL7 FHIR v4.0.1", detail: "Bi-directional patient sync (Epic, Cerner)" },
      { name: "SMART on FHIR", detail: "Embedded point-of-care EHR launch workflows" },
    ],
    icon: Network,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-700",
    badgeBg: "bg-indigo-50/80",
    badgeText: "text-indigo-800 border-indigo-200",
  },
  {
    category: "Machine Learning Engine",
    roleDescription: "Ensemble risk modeling with local explainability",
    technologies: [
      { name: "scikit-learn & CatBoost", detail: "Random Forest, Gradient Boosting, SVM" },
      { name: "TreeSHAP", detail: "Per-patient feature attributions & margin breakdown" },
    ],
    icon: Cpu,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    badgeBg: "bg-amber-50/80",
    badgeText: "text-amber-800 border-amber-200",
  },
  {
    category: "Governed AI & Agents",
    roleDescription: "Controlled tool execution & context minimization",
    technologies: [
      { name: "Ruflo Swarm Coordinator", detail: "Hierarchical clinical safety supervisor" },
      { name: "Clinical Knowledge Base", detail: "Approved institutional protocol retrieval" },
    ],
    icon: Bot,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-700",
    badgeBg: "bg-purple-50/80",
    badgeText: "text-purple-800 border-purple-200",
  },
  {
    category: "Real-Time Telemetry",
    roleDescription: "Bi-directional WebSocket streaming under 20ms",
    technologies: [
      { name: "Django Channels", detail: "ASGI event loops & clinical ward broadcasts" },
      { name: "Redis Channel Layer", detail: "High-throughput in-memory pub/sub broker" },
    ],
    icon: Radio,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-700",
    badgeBg: "bg-rose-50/80",
    badgeText: "text-rose-800 border-rose-200",
  },
  {
    category: "Security & Cryptography",
    roleDescription: "Zero PHI exfiltration & cryptographic audit logs",
    technologies: [
      { name: "AES-256 & TLS 1.3", detail: "Hardware-level encryption in transit and rest" },
      { name: "Role-Based ACL", detail: "5 clinical roles enforced with immutable audit logs" },
    ],
    icon: Lock,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-700",
    badgeBg: "bg-sky-50/80",
    badgeText: "text-sky-800 border-sky-200",
  },
];

export function TechnologyFoundation() {
  return (
    <section id="technology" className="py-16 sm:py-24 bg-slate-50/50 border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full shadow-2xs">
            SYSTEM ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Built for Modern Clinical Intelligence
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            A robust, low-latency, and distributed architecture engineered for mission-critical healthcare environments.
          </p>
        </div>

        {/* 8 Tech Categories Grid (2 rows x 4 cols on lg) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TECH_ECOSYSTEM.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <div
                key={cat.category}
                className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-2xs hover:border-teal-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-11 w-11 rounded-xl border border-slate-200/80 ${cat.iconBg} ${cat.iconColor} flex items-center justify-center shadow-2xs`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${cat.badgeBg} ${cat.badgeText}`}
                    >
                      {cat.category.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-950 tracking-tight">
                      {cat.category}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                      {cat.roleDescription}
                    </p>
                  </div>
                </div>

                {/* Technologies List */}
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                  {cat.technologies.map((t) => (
                    <div key={t.name} className="text-xs">
                      <span className="font-bold text-slate-800 block">{t.name}</span>
                      <span className="text-[11px] text-slate-500">{t.detail}</span>
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
