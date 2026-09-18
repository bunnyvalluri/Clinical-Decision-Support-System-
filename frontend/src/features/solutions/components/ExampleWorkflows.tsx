"use client";

import React from "react";
import {
  FileCheck,
  Stethoscope,
  HeartPulse,
  LineChart,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface WorkflowScenario {
  id: string;
  badge: string;
  title: string;
  actor: string;
  problem: string;
  solution: string;
  outcome: string;
  icon: React.ElementType;
}

const SCENARIOS: WorkflowScenario[] = [
  {
    id: "patient-risk",
    badge: "Example workflow: Patient Risk",
    title: "Patient Risk Review",
    actor: "Ambulatory Risk Evaluation",
    problem:
      "A patient presenting for routine follow-up exhibits subtle, compounding physiological deviations across blood pressure and resting pulse.",
    solution:
      "HealthNova AI evaluates the longitudinal record through a validated Random Forest classifier, highlighting elevated cardiovascular risk without alarmism.",
    outcome:
      "Early lifestyle intervention and preventative beta-blocker titration instituted before acute hypertensive crisis.",
    icon: FileCheck,
  },
  {
    id: "nurse-triage",
    badge: "Example workflow: Nurse Triage",
    title: "Bedside Nurse Triage",
    actor: "Emergency Intake & Floor Nursing",
    problem:
      "High intake volumes create risk of delayed identification for patients with subtle early sepsis markers.",
    solution:
      "Authorized bedside vitals are scanned against qSOFA/NEWS2 protocols with automated threshold alerts directly to the triage nurse tablet.",
    outcome:
      "Immediate lactate lab draw and bedside physician escalation completed 45 minutes faster than standard manual intake.",
    icon: HeartPulse,
  },
  {
    id: "doctor-review",
    badge: "Example workflow: Doctor Review",
    title: "Physician Clinical Review",
    actor: "Attending Inpatient Physician",
    problem:
      "Physician must rapidly assess complex multivariable risk without wading through hundreds of unstructured EHR notes.",
    solution:
      "Physician workspace presents an aggregated risk score accompanied by top 3 TreeSHAP feature contributions and confidence interval.",
    outcome:
      "Clinician verifies reasoning in 90 seconds, signs off on targeted diagnostics, and updates chart with complete audit record.",
    icon: Stethoscope,
  },
  {
    id: "informatics",
    badge: "Example workflow: Analytics",
    title: "Healthcare Analytics & Governance",
    actor: "Clinical Informaticist & Data Lead",
    problem:
      "Seasonal demographic shifts can cause ML model calibration to drift over time if left unmonitored.",
    solution:
      "Informatics console runs automated Population Stability Index (PSI) and KS-tests across feature distributions weekly.",
    outcome:
      "Minor feature distribution shift caught early, and model recalibrated safely through version-controlled governance committee review.",
    icon: LineChart,
  },
];

export function ExampleWorkflows() {
  return (
    <section className="py-16 sm:py-20 bg-slate-50/70 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700 mb-2">
            CONCEPTUAL SCENARIOS
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Example Clinical Intelligence Scenarios
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Walkthroughs illustrating how HealthNova AI assists clinicians across typical healthcare workflows. (All scenarios represent conceptual design workflows, not actual patient health records).
          </p>
        </div>

        {/* 4 Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            return (
              <div
                key={scenario.id}
                className="rounded-2xl bg-white border border-slate-200 p-6 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
                      {scenario.badge}
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-teal-600">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-950 mb-1">
                    {scenario.title}
                  </h3>
                  <p className="text-xs font-semibold text-teal-700 mb-4">
                    {scenario.actor}
                  </p>

                  <div className="space-y-3 text-xs leading-relaxed">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <strong className="text-slate-900 block mb-0.5">Clinical Challenge:</strong>
                      <span className="text-slate-600">{scenario.problem}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-teal-50/40 border border-teal-100">
                      <strong className="text-teal-950 block mb-0.5">HealthNova AI Solution:</strong>
                      <span className="text-slate-700">{scenario.solution}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100">
                      <strong className="text-emerald-950 block mb-0.5">Clinical Decision & Outcome:</strong>
                      <span className="text-slate-700">{scenario.outcome}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-teal-600" />
                    Human-in-the-loop approved
                  </span>
                  <span className="font-mono">Audit Logged</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
