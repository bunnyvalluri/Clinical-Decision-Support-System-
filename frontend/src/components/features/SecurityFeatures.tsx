import React from "react";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck,
  Server,
  EyeOff,
  Database,
  CheckCircle2,
} from "lucide-react";

interface SecurityPillar {
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECURITY_PILLARS: SecurityPillar[] = [
  {
    title: "Role-Based Access Control (RBAC)",
    category: "IDENTITY & ACCESS",
    description:
      "Granular 5-role authorization matrix ensures patients, doctors, nurses, informaticists, and admins access only authorized scopes.",
    icon: KeyRound,
  },
  {
    title: "Object-Level Authorization",
    category: "DATA ISOLATION",
    description:
      "Enforced at the Django ORM layer to prevent cross-patient data access and horizontal privilege escalation (IDOR protection).",
    icon: Lock,
  },
  {
    title: "Immutable Audit Trails",
    category: "COMPLIANCE & ACCOUNTABILITY",
    description:
      "Every prediction request, clinician override, vital entry, and administrative modification is permanently logged with timestamps.",
    icon: FileCheck,
  },
  {
    title: "End-to-End Encryption",
    category: "CRYPTOGRAPHIC PROTECTION",
    description:
      "TLS 1.3 encryption in transit across all HTTP/WebSocket connections and AES-256 storage encryption at rest in Neon PostgreSQL.",
    icon: Database,
  },
  {
    title: "Context Minimization for AI",
    category: "PRIVACY PRESERVATION",
    description:
      "ClinicalRiskContextBuilder sanitizes patient records to strip unnecessary identifiers before submitting vitals to inference.",
    icon: EyeOff,
  },
  {
    title: "Continuous Security Auditing",
    category: "DEVSECOPS & VERIFICATION",
    description:
      "Integrated Bruno API security suites, Pentest Agents, and Strix scanners actively verify endpoints against OWASP vulnerabilities.",
    icon: ShieldCheck,
  },
];

export function SecurityFeatures() {
  return (
    <section id="security" className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            HEALTHCARE DATA PROTECTION
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Secure by Design
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Designed with healthcare privacy and security requirements in mind. Our architecture
            enforces least-privilege access, data minimization, and persistent audit logging.
          </p>
        </div>

        {/* 6 Security Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {SECURITY_PILLARS.map((p) => {
            const IconComponent = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xs hover:border-teal-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-2xs">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {p.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-950 tracking-tight">
                    {p.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Honest Compliance Notice Banner */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 max-w-3xl mx-auto flex items-start sm:items-center gap-3.5 shadow-2xs text-left">
          <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong className="font-semibold text-slate-900">Governance Commitment:</strong> Engineered in accordance with 21 CFR Part 11 electronic records guidance and HIPAA security rule principles, ensuring complete cryptographic trace and access boundary enforcement.
          </p>
        </div>
      </div>
    </section>
  );
}
