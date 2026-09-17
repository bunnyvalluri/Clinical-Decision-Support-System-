import React from "react";
import {
  FileSpreadsheet,
  CheckCheck,
  Cpu,
  Activity,
  Sliders,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

interface MLStep {
  step: string;
  name: string;
  actor: "ML ENGINE" | "CLINICIAN" | "SYSTEM";
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ML_STEPS: MLStep[] = [
  {
    step: "01",
    name: "Patient Data",
    actor: "SYSTEM",
    detail: "Vitals, ECG ST depression, blood pressure, lab assays ingestion.",
    icon: FileSpreadsheet,
  },
  {
    step: "02",
    name: "Data Validation",
    actor: "SYSTEM",
    detail: "Biological plausibility checks & Mahalanobis out-of-distribution guard.",
    icon: CheckCheck,
  },
  {
    step: "03",
    name: "Feature Processing",
    actor: "ML ENGINE",
    detail: "StandardScaler normalization & group-aware feature pipelines.",
    icon: Sliders,
  },
  {
    step: "04",
    name: "ML Model Ensemble",
    actor: "ML ENGINE",
    detail: "Random Forest champion, SVM (RBF), and AdaBoost benchmarks.",
    icon: Cpu,
  },
  {
    step: "05",
    name: "Risk Prediction",
    actor: "ML ENGINE",
    detail: "Calibrated probability output partitioned into clinical risk tiers.",
    icon: Activity,
  },
  {
    step: "06",
    name: "Explainability",
    actor: "ML ENGINE",
    detail: "TreeSHAP additive margin decomposition & entropy uncertainty score.",
    icon: Sliders,
  },
  {
    step: "07",
    name: "Clinical Review",
    actor: "CLINICIAN",
    detail: "Attending physician reviews prediction with override documentation.",
    icon: Stethoscope,
  },
  {
    step: "08",
    name: "Audit & Record",
    actor: "SYSTEM",
    detail: "Immutable audit trail committed to Neon PostgreSQL database.",
    icon: ShieldCheck,
  },
];

export function MLWorkflow() {
  return (
    <section id="ml-workflow" className="py-16 sm:py-24 bg-slate-50/60 border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            MACHINE LEARNING PIPELINE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Machine Learning for Clinical Risk Intelligence
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            From biological plausibility screening to TreeSHAP feature attributions and mandatory
            physician review, every prediction is transparent, calibrated, and auditable.
          </p>
        </div>

        {/* 8-Step Pipeline Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ML_STEPS.map((s, idx) => {
            const IconComponent = s.icon;
            const isClinician = s.actor === "CLINICIAN";

            return (
              <div
                key={s.step}
                className={`rounded-2xl border p-5 bg-white shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs ${
                  isClinician
                    ? "border-teal-400 ring-2 ring-teal-500/10"
                    : "border-slate-200"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      STEP {s.step}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        isClinician
                          ? "bg-teal-700 text-white"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {s.actor}
                    </span>
                  </div>

                  <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
                    <IconComponent className="h-5 w-5" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-950 tracking-tight">
                    {s.name}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Supported Model Architectures Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {[
            {
              name: "Random Forest Classifier",
              role: "Champion Model",
              desc: "100-tree ensemble with Platt sigmoid calibration wrapper; optimal sensitivity on acute cardiac risk cohorts.",
              metric: "Active Champion",
            },
            {
              name: "Support Vector Machine (SVM)",
              role: "Benchmark Model",
              desc: "Radial Basis Function (RBF) kernel with non-linear margin hyperplanes for boundary verification.",
              metric: "RBF Kernel",
            },
            {
              name: "AdaBoost Classifier",
              role: "Adaptive Boosting",
              desc: "Sequential weak learners iteratively weighting borderline physiological outliers.",
              metric: "Adaptive Boost",
            },
          ].map((m) => (
            <div
              key={m.name}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {m.metric}
                </span>
                <Cpu className="h-4 w-4 text-teal-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-950">{m.name}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>

        {/* Prominent Risk Prediction Safety Disclaimer Banner (Readable, Non-Buried) */}
        <div className="rounded-2xl bg-amber-50/70 border border-amber-200/90 p-5 max-w-3xl mx-auto flex items-start sm:items-center gap-3.5 shadow-2xs">
          <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
            <strong className="font-bold">Risk Prediction Safety:</strong> Risk predictions are decision-support outputs and should be interpreted by qualified healthcare professionals alongside relevant clinical information and bedside assessment.
          </p>
        </div>
      </div>
    </section>
  );
}
