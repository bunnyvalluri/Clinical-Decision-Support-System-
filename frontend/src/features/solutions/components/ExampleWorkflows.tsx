"use client";

import React, { useState } from "react";
import {
  FileCheck,
  Stethoscope,
  HeartPulse,
  LineChart,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
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
    <section className="py-16 sm:py-22 bg-slate-50/70 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span>CONCEPTUAL SCENARIOS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
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
                className="group rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all flex flex-col justify-between text-left"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-teal-700 uppercase tracking-wider block">
                          {scenario.actor}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-slate-950 group-hover:text-teal-700 transition-colors">
                          {scenario.title}
                        </h3>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      {scenario.badge}
                    </span>
                  </div>

                  {/* 3 Step Boxes: Problem, Solution, Outcome */}
                  <div className="space-y-3 pt-2">
                    <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800 mb-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Clinical Challenge</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {scenario.problem}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-teal-800 mb-1">
                        <Lightbulb className="h-3.5 w-3.5" />
                        <span>HealthNova AI Assist</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {scenario.solution}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Clinical Outcome</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        {scenario.outcome}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                    Human Clinician Sign-Off Enforced
                  </span>
                  <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                    21 CFR Part 11
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
