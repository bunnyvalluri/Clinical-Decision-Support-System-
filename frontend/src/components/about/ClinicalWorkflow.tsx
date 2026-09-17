import React from "react";
import {
  FileSpreadsheet,
  CheckCheck,
  Cpu,
  Activity,
  Sliders,
  Stethoscope,
  UserCheck,
  ArrowRight,
  ArrowDown,
} from "lucide-react";

interface WorkflowStep {
  step: number;
  label: string;
  role: "SYSTEM" | "CLINICIAN";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 1,
    label: "Patient Data",
    role: "SYSTEM",
    description: "Physiological vitals, ECG ST depression, blood pressure & lab assays.",
    icon: FileSpreadsheet,
    accentColor: "border-slate-200 bg-slate-50 text-slate-700",
  },
  {
    step: 2,
    label: "Data Validation",
    role: "SYSTEM",
    description: "Biological plausibility checks and Mahalanobis out-of-distribution detection.",
    icon: CheckCheck,
    accentColor: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    step: 3,
    label: "Machine Learning Model",
    role: "SYSTEM",
    description: "Group-aware calibrated Random Forest / Ensemble inference.",
    icon: Cpu,
    accentColor: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  {
    step: 4,
    label: "Risk Prediction",
    role: "SYSTEM",
    description: "Calibrated probability output categorized into clinical triage risk tiers.",
    icon: Activity,
    accentColor: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    step: 5,
    label: "Explainability",
    role: "SYSTEM",
    description: "Local TreeSHAP feature attributions and Shannon entropy bounds.",
    icon: Sliders,
    accentColor: "border-teal-200 bg-teal-50 text-teal-700",
  },
  {
    step: 6,
    label: "Clinical Review",
    role: "CLINICIAN",
    description: "Licensed physician or triage nurse evaluates outputs against bedside presentation.",
    icon: Stethoscope,
    accentColor: "border-purple-200 bg-purple-50 text-purple-700",
  },
  {
    step: 7,
    label: "Human Decision",
    role: "CLINICIAN",
    description: "Final diagnosis, clinical prescription, and patient care pathway signed off.",
    icon: UserCheck,
    accentColor: "border-emerald-300 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20",
  },
];

export function ClinicalWorkflow() {
  return (
    <section id="workflow" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            INTELLIGENCE PATHWAY
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            How Clinical Intelligence Comes Together
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            The platform provides structured, transparent decision support throughout the care pathway.
            The licensed healthcare professional remains the sole authority for clinical decisions.
          </p>
        </div>

        {/* Workflow Progression Stepper */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 relative">
          {WORKFLOW_STEPS.map((s, idx) => {
            const IconComponent = s.icon;
            const isClinicianStep = s.role === "CLINICIAN";

            return (
              <div key={s.label} className="flex flex-col relative">
                <div
                  className={`rounded-2xl border p-5 flex flex-col justify-between h-full shadow-2xs transition-all hover:shadow-md ${s.accentColor} ${
                    isClinicianStep ? "border-2 shadow-xs" : ""
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header with Step Number and Role Tag */}
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-xs shadow-2xs">
                        0{s.step}
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                          isClinicianStep
                            ? "bg-emerald-700 text-white"
                            : "bg-slate-200/80 text-slate-700"
                        }`}
                      >
                        {s.role}
                      </span>
                    </div>

                    <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <h3 className="text-sm font-bold text-slate-950 tracking-tight leading-snug">
                      {s.label}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                </div>

                {/* Arrow connector between steps on desktop */}
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full bg-white border border-slate-200 items-center justify-center shadow-xs text-slate-400"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reassurance Governance Banner */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center max-w-2xl mx-auto">
          <p className="text-xs text-slate-500 font-medium">
            Strict Non-Autonomous Guarantee: Automated models compute risk priors; human clinicians review, modify, and authorize all final therapeutic interventions.
          </p>
        </div>
      </div>
    </section>
  );
}
