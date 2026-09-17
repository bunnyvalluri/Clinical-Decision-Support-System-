import React from "react";
import {
  Database,
  Server,
  Radio,
  Cpu,
  Bot,
  Search,
  Workflow,
  Layout,
  CheckCircle2,
} from "lucide-react";

interface TechCategory {
  category: string;
  roleDescription: string;
  technologies: { name: string; detail: string }[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const TECH_ECOSYSTEM: TechCategory[] = [
  {
    category: "Authoritative Data Store",
    roleDescription: "Sole authoritative persistent source of truth",
    technologies: [
      { name: "Neon PostgreSQL", detail: "ACID transactions, PITR, serverless autoscaling" },
    ],
    icon: Database,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    category: "Clinical Backend",
    roleDescription: "HIPAA-aligned RBAC, audit trails & API gateway",
    technologies: [
      { name: "Python / Django", detail: "Deterministic security, ORM boundaries" },
      { name: "Django REST Framework", detail: "Strict schema validation & serialization" },
    ],
    icon: Server,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    category: "Real-Time Telemetry",
    roleDescription: "Bi-directional WebSocket streaming under 20ms",
    technologies: [
      { name: "Django Channels", detail: "ASGI event loops & clinical ward broadcasts" },
      { name: "Redis Channel Layer", detail: "High-throughput in-memory pub/sub broker" },
    ],
    icon: Radio,
    color: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    category: "Calibrated Machine Learning",
    roleDescription: "Ensemble risk modeling with local explainability",
    technologies: [
      { name: "scikit-learn", detail: "Random Forest, SVM (RBF), AdaBoost" },
      { name: "TreeSHAP", detail: "Per-patient feature attributions & margin breakdown" },
      { name: "MLOps Drift Monitor", detail: "PSI, Kolmogorov-Smirnov, Brier calibration" },
    ],
    icon: Cpu,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    category: "Governed AI & Agents",
    roleDescription: "Controlled tool execution & context minimization",
    technologies: [
      { name: "AI Gateway & Ollama", detail: "Policy-governed local & frontier model routing" },
      { name: "Ruflo Swarm Coordinator", detail: "Hierarchical clinical safety supervisor" },
      { name: "Clinical RAG", detail: "Approved institutional protocol retrieval" },
    ],
    icon: Bot,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    category: "Clinical Search & Indexing",
    roleDescription: "Fast typographic search with strict privacy filters",
    technologies: [
      { name: "Meilisearch", detail: "Sub-5ms clinical protocol & vocabulary indexing" },
    ],
    icon: Search,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    category: "Asynchronous Workflows",
    roleDescription: "Distributed task scheduling and offline inference",
    technologies: [
      { name: "Celery & Redis", detail: "Background report generation & batch scoring" },
    ],
    icon: Workflow,
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    category: "Modern Clinician Frontend",
    roleDescription: "Accessible, responsive light-mode hospital interface",
    technologies: [
      { name: "Next.js 16 (App Router)", detail: "Server Components & optimized asset delivery" },
      { name: "React 19 & TypeScript", detail: "Type-safe state management & zero-runtime bugs" },
      { name: "shadcn/ui & Tailwind CSS", detail: "WCAG 2.2 AA compliant healthcare tokens" },
    ],
    icon: Layout,
    color: "bg-sky-50 text-sky-700 border-sky-200",
  },
];

export function TechnologyFoundation() {
  return (
    <section id="technology" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            OUR TECHNOLOGY FOUNDATION
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Built for Modern Clinical Intelligence
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            A resilient, HIPAA-aligned architecture uniting authoritative clinical storage,
            sub-20ms real-time messaging, and calibrated machine learning models.
          </p>
        </div>

        {/* Technology Ecosystem Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TECH_ECOSYSTEM.map((tech) => {
            const IconComponent = tech.icon;
            return (
              <div
                key={tech.category}
                className="rounded-2xl bg-slate-50/70 border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-200"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${tech.color}`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {tech.category}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 italic">
                    {tech.roleDescription}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    {tech.technologies.map((t) => (
                      <div key={t.name} className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <CheckCircle2 className="h-3 w-3 text-teal-600 shrink-0" />
                          <span>{t.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 pl-4.5 leading-tight">
                          {t.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
