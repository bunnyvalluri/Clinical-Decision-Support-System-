import React from "react";
import {
  Brain,
  Eye,
  Radio,
  UserCheck,
  ShieldCheck,
  Layers,
  Activity,
  HeartPulse,
  Sliders,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface DifferenceFeature {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
}

const FEATURES: DifferenceFeature[] = [
  {
    title: "AI-Powered Clinical Insights",
    description:
      "Machine learning models analyze relevant patient data to support structured clinical risk assessment.",
    icon: Brain,
    badge: "Ensemble ML",
  },
  {
    title: "Explainable Predictions",
    description:
      "Model outputs are designed to provide understandable reasoning and supporting signals rather than unexplained predictions.",
    icon: Eye,
    badge: "TreeSHAP",
  },
  {
    title: "Real-Time Intelligence",
    description:
      "Real-time events and workflow updates help healthcare professionals stay informed as relevant information changes.",
    icon: Radio,
    badge: "Channels & Redis",
  },
  {
    title: "Human-in-the-Loop",
    description:
      "Clinical professionals remain responsible for reviewing and interpreting AI-assisted insights before clinical decisions are made.",
    icon: UserCheck,
    badge: "Safety Gate",
  },
  {
    title: "Enterprise-Grade Security",
    description:
      "Privacy, authorization, auditability, least-privilege access, and secure data handling are foundational to the platform.",
    icon: ShieldCheck,
    badge: "HIPAA & RBAC",
  },
  {
    title: "Scalable Architecture",
    description:
      "Modern APIs, background processing, real-time services, machine learning infrastructure, and cloud-ready deployment support future growth.",
    icon: Layers,
    badge: "Celery & Neon",
  },
];

export function DifferenceSection() {
  return (
    <section id="difference" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            WHAT MAKES US DIFFERENT
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Intelligence. Integration. Clinical Impact.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Our platform brings machine learning, clinical data, real-time infrastructure,
            explainability, and human expertise together within one healthcare intelligence ecosystem.
          </p>
        </div>

        {/* Feature Grid & Clinical Dashboard Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Features Column (Left 7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((feat) => {
              const IconComponent = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs hover:border-teal-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {feat.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-950 tracking-tight">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clinical Tablet/Dashboard Mockup (Right 5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-slate-50 border-2 border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
              {/* Tablet Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-mono font-bold text-slate-500 ml-1">
                    BEDSIDE CLINICAL TELEMETRY
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>SYNCHRONIZED</span>
                </div>
              </div>

              {/* Patient Risk Prediction Banner */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Model Risk Assessment
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    MODERATE RISK TIER
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">
                    38.4%
                  </span>
                  <span className="text-xs text-slate-500">
                    Calibrated Margin: 0.24 &bull; Entropy: 0.42
                  </span>
                </div>
                {/* Risk Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: "38.4%" }}
                  />
                </div>
              </div>

              {/* TreeSHAP Explainability Attribution Preview */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-teal-600" />
                    TreeSHAP Feature Attributions
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Additive Margin</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600">ST Depression (1.8mm)</span>
                      <span className="font-mono font-semibold text-rose-700">+0.147 (Risk +)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: "65%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600">Systolic Blood Pressure (142 mmHg)</span>
                      <span className="font-mono font-semibold text-amber-700">+0.068 (Risk +)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "42%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600">Serum Cholesterol (194 mg/dL)</span>
                      <span className="font-mono font-semibold text-emerald-700">-0.024 (Protective)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "22%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinician Review Confirmation Action Box */}
              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
                  <span className="text-xs font-semibold text-teal-900">
                    Awaiting Clinician Validation
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-white text-teal-800 px-2 py-1 rounded-lg border border-teal-200">
                  M.D. SIGN-OFF
                </span>
              </div>

              {/* Caption */}
              <p className="text-[11px] text-slate-500 text-center italic">
                Figure: Assistive clinical decision interface showing transparent model attributions with required physician sign-off.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
