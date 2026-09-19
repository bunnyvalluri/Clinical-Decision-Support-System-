"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Stethoscope,
  HeartHandshake,
  Building2,
  Database,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  BarChart2,
  TrendingDown,
  Lock,
} from "lucide-react";

interface RoleSolution {
  id: string;
  role: string;
  badge: string;
  icon: React.ElementType;
  headline: string;
  description: string;
  portalRoute: string;
  portalCta: string;
  capabilities: {
    title: string;
    description: string;
  }[];
  sampleWorkflowTitle: string;
  sampleWorkflowSteps: string[];
  mockTelemetry: {
    label: string;
    value: string;
    status: string;
    sublabel: string;
    detailBadge: string;
  };
}

const ROLES_DATA: RoleSolution[] = [
  {
    id: "patients",
    role: "Patients",
    badge: "Personal Health Portal",
    icon: User,
    headline: "Understand Your Health with Clarity & Confidence",
    description:
      "Patients gain a transparent, easy-to-understand view of their personal vital trajectories, preventive risk summaries, and care recommendations without medical confusion.",
    portalRoute: "/user/dashboard",
    portalCta: "Explore Patient Portal",
    capabilities: [
      {
        title: "Personal Health Dashboard",
        description: "Unified view of historical vitals, lab reports, and longitudinal health markers.",
      },
      {
        title: "Explainable Risk Insights",
        description: "Clear, color-coded health indicators with plain-language explanations.",
      },
      {
        title: "Longitudinal Trends",
        description: "Track blood pressure, heart rate, and sleep trajectories over weeks and months.",
      },
      {
        title: "Clinical Reports & Summaries",
        description: "Download verified doctor summaries and lab results securely anytime.",
      },
      {
        title: "Appointments & Care Plans",
        description: "Review upcoming consultations, follow-ups, and clinician care guidelines.",
      },
      {
        title: "Health Education Library",
        description: "Clinically reviewed guidance on managing chronic conditions and preventive wellness.",
      },
    ],
    sampleWorkflowTitle: "Patient Wellness Workflow",
    sampleWorkflowSteps: [
      "Patient records morning blood pressure via connected device or manual log",
      "System compares value against personalized baseline (120/80 mmHg)",
      "Normal trend confirmed with positive reinforcement and preventive tips",
      "Patient receives non-alarmist reminder for upcoming quarterly review",
    ],
    mockTelemetry: {
      label: "Blood Pressure Trend",
      value: "118 / 78 mmHg",
      status: "OPTIMAL",
      sublabel: "Stable baseline over past 30 days",
      detailBadge: "Dr. Rostova Verified",
    },
  },
  {
    id: "doctors",
    role: "Doctors",
    badge: "Physician Clinical Workspace",
    icon: Stethoscope,
    headline: "Evidence-Informed Clinical Decision Support at Bedside",
    description:
      "Physicians receive contextualized risk scores, TreeSHAP feature attributions, and clinical timelines that support diagnostic thoroughness without adding administrative clicks.",
    portalRoute: "/doctor/dashboard",
    portalCta: "Explore Physician Workspace",
    capabilities: [
      {
        title: "Comprehensive Patient Overview",
        description: "Instant aggregation of active vitals, comorbidities, and acute trend alerts.",
      },
      {
        title: "Multi-Model Risk Predictions",
        description: "Validated SVM, Random Forest, and AdaBoost probability assessments.",
      },
      {
        title: "TreeSHAP Explainability",
        description: "Deconstructed feature contributions showing exactly why alerts were triggered.",
      },
      {
        title: "Longitudinal Signal Visualizer",
        description: "Interactive timeseries of heart rate variability, SpO2, and mean arterial pressure.",
      },
      {
        title: "One-Click Clinical Review",
        description: "Sign off on risk recommendations with immutable 21 CFR Part 11 electronic records.",
      },
      {
        title: "AI Research Assistant",
        description: "Retrieve approved institutional treatment guidelines and clinical peer reviews.",
      },
    ],
    sampleWorkflowTitle: "Bedside Clinical Review Workflow",
    sampleWorkflowSteps: [
      "Physician opens patient profile during morning ICU ward rounds",
      "System displays multi-model risk score (0.14 LOW) with TreeSHAP attributions",
      "Physician correlates model insight with physical exam and approves care plan",
      "Review action committed with cryptographic audit hash to PostgreSQL",
    ],
    mockTelemetry: {
      label: "Cardiac Decompensation Risk",
      value: "0.14 (LOW RISK)",
      status: "CALIBRATED",
      sublabel: "TreeSHAP: HRV Stability (+0.06), MAP (0.00)",
      detailBadge: "21 CFR Part 11 Signed",
    },
  },
  {
    id: "nurses",
    role: "Nurses",
    badge: "Bedside & Triage Station",
    icon: HeartHandshake,
    headline: "Rapid Triage Acuity & Early Deterioration Screening",
    description:
      "Bedside nurses and triage teams monitor ward-level patient acuity, receive early warnings before acute decompensation, and coordinate escalations smoothly.",
    portalRoute: "/nurse/dashboard",
    portalCta: "Explore Nurse Station",
    capabilities: [
      {
        title: "Ward Acuity Overview",
        description: "Color-coded census showing real-time triage tiers across assigned beds.",
      },
      {
        title: "Early Sepsis & NEWS2 Alerts",
        description: "Automated scoring tripwires flagging occult deterioration hours ahead.",
      },
      {
        title: "Bedside Vitals Quick-Entry",
        description: "Rapid numeric input with instant physiological plausibility boundary checks.",
      },
      {
        title: "Adaptive Alarm Filtering",
        description: "Smart noise suppression reducing false alarms by up to 42% on telemetry.",
      },
      {
        title: "Structured Escalation Protocol",
        description: "One-tap notification of attending physician with pre-filled SBAR context.",
      },
      {
        title: "Task Coordination Board",
        description: "Checklists for vitals reassessments, medication times, and doctor sign-offs.",
      },
    ],
    sampleWorkflowTitle: "Acute Triage Escalation Pathway",
    sampleWorkflowSteps: [
      "Bedside monitor records sudden respiratory rate increase from 16 to 24 bpm",
      "NEWS2 score trips to 5 (Moderate), triggering early nurse alert",
      "Nurse performs rapid bedside check and initiates secondary lactate check",
      "Nurse escalates SBAR summary directly to on-call hospitalist via portal",
    ],
    mockTelemetry: {
      label: "Ward Census Acuity",
      value: "14 Monitored Beds",
      status: "NORMAL CENSUS",
      sublabel: "0 Critical, 2 Moderate, 12 Stable",
      detailBadge: "42% Alarms Suppressed",
    },
  },
  {
    id: "organizations",
    role: "Healthcare Organizations",
    badge: "Health System Operations",
    icon: Building2,
    headline: "Operational Efficiency & Population Health Intelligence",
    description:
      "Hospital executives, chief medical officers, and department heads monitor cross-facility performance, optimize bed capacity, and mitigate preventable readmissions.",
    portalRoute: "/solutions#results",
    portalCta: "Explore Health System Solutions",
    capabilities: [
      {
        title: "Enterprise Risk Dashboard",
        description: "System-wide visibility across emergency departments, ICUs, and medical floors.",
      },
      {
        title: "30-Day Readmission Mitigation",
        description: "Cohort risk stratifications identifying patients needing targeted transitional care.",
      },
      {
        title: "Capacity & Flow Forecasting",
        description: "Predictive inpatient bed demands based on emergency department triage velocity.",
      },
      {
        title: "Quality & Safety Compliance",
        description: "Automated institutional audit reports satisfying Joint Commission and CMS metrics.",
      },
      {
        title: "Clinician Burnout Reduction",
        description: "Documentation time savings measured across attending and nursing cohorts.",
      },
      {
        title: "Multi-Facility Governance",
        description: "Standardized clinical protocols across multi-hospital health systems.",
      },
    ],
    sampleWorkflowTitle: "Institutional Value Flow",
    sampleWorkflowSteps: [
      "Quality officer reviews system-wide 30-day readmission risk report",
      "Cardiology unit identified with elevated post-discharge vulnerability",
      "Executive allocates dedicated remote nurse follow-up protocol for unit",
      "Subsequent quarter demonstrates measurable 32% drop in avoidable readmissions",
    ],
    mockTelemetry: {
      label: "30-Day Readmission Rate",
      value: "32% REDUCTION",
      status: "MEASURED",
      sublabel: "Across 2,500+ patient cohort rollout",
      detailBadge: "CMS Quality Verified",
    },
  },
  {
    id: "data-teams",
    role: "Health Data Teams",
    badge: "Informatics & MLOps Console",
    icon: Database,
    headline: "Model Governance, Drift Auditing & FHIR Data Intelligence",
    description:
      "Clinical informaticists and health data engineers monitor data pipeline integrity, validate machine learning performance, detect demographic drift, and enforce zero-trust security.",
    portalRoute: "/informaticist/dashboard",
    portalCta: "Explore Informatics Console",
    capabilities: [
      {
        title: "Data Quality Intelligence",
        description: "Continuous validation of EHR field completeness and sensor telemetry integrity.",
      },
      {
        title: "ML Model Registry",
        description: "Version-controlled tracking of active Random Forest, SVM, and AdaBoost weights.",
      },
      {
        title: "Clinical Model Evaluation",
        description: "Real-time auditing of ROC-AUC, Precision-Recall, F1-scores, and calibration.",
      },
      {
        title: "Population Drift Monitoring",
        description: "Automated KS-test and PSI statistical tests detecting feature distribution shifts.",
      },
      {
        title: "AI Gateway & LLM Auditing",
        description: "Prompt injection defenses, token tracking, and context minimization scans.",
      },
      {
        title: "Immutable Security Audit Log",
        description: "PostgreSQL-backed cryptographic audit records of all risk queries and sign-offs.",
      },
    ],
    sampleWorkflowTitle: "Informatics Governance Protocol",
    sampleWorkflowSteps: [
      "Continuous background evaluator runs monthly PSI drift test on vitals features",
      "Blood glucose distribution shift detected in outpatient clinic population",
      "Informaticist initiates model recalibration pipeline with fresh validated cohort",
      "New model release deployed safely after human clinical committee approval",
    ],
    mockTelemetry: {
      label: "Population Stability Index (PSI)",
      value: "0.04 (NO DRIFT)",
      status: "PASSING",
      sublabel: "All 32 vitals features within reference bounds",
      detailBadge: "Auto KS-Test Validated",
    },
  },
];

export function RoleSolutionsTabs() {
  const [activeTab, setActiveTab] = useState("doctors");

  const currentRole = ROLES_DATA.find((r) => r.id === activeTab) || ROLES_DATA[1];
  const CurrentIcon = currentRole.icon;

  return (
    <section id="role-solutions" className="py-16 sm:py-22 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span>ROLE-BASED WORKSPACES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Solutions Designed Around Healthcare Professionals
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Every clinical role has distinct requirements. HealthNova AI delivers customized interfaces and intelligence tools tailored to each professional responsibility.
          </p>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 mb-8 no-scrollbar gap-2">
          {ROLES_DATA.map((r) => {
            const Icon = r.icon;
            const isSelected = r.id === activeTab;
            return (
              <button
                key={r.id}
                role="tab"
                aria-selected={isSelected}
                aria-controls={`panel-${r.id}`}
                id={`tab-${r.id}`}
                onClick={() => setActiveTab(r.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-600/20"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{r.role}</span>
              </button>
            );
          })}
        </div>

        {/* Active Role Content Card */}
        <div
          id={`panel-${currentRole.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${currentRole.id}`}
          className="rounded-3xl bg-slate-50/70 border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-xs"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Left Column: Role Details & Capabilities */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                  <CurrentIcon className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                    {currentRole.badge}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-950 mt-1">
                    {currentRole.headline}
                  </h3>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {currentRole.description}
              </p>

              {/* 6 Capabilities Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {currentRole.capabilities.map((cap, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-teal-300 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 mb-1">
                          {cap.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {cap.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Link */}
              <div className="pt-2">
                <Link href={currentRole.portalRoute}>
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors">
                    <span>{currentRole.portalCta}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Column: Interactive Workflow Visualizer & Live Mock Telemetry */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-6 shadow-xs text-left">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-teal-600 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-slate-800">
                      LIVE WORKFLOW PATHWAY
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Active Governance
                  </span>
                </div>

                {/* Simulated Telemetry Banner */}
                <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">
                      {currentRole.mockTelemetry.label}
                    </span>
                    <span className="text-sm font-mono font-black text-slate-900">
                      {currentRole.mockTelemetry.value}
                    </span>
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      {currentRole.mockTelemetry.sublabel}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                      {currentRole.mockTelemetry.status}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 block pt-1">
                      {currentRole.mockTelemetry.detailBadge}
                    </span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider text-teal-800">
                  {currentRole.sampleWorkflowTitle}
                </h4>

                {/* Numbered Steps */}
                <div className="space-y-3.5">
                  {currentRole.sampleWorkflowSteps.map((step, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-3 text-xs">
                      <div className="h-6 w-6 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                        {sIdx + 1}
                      </div>
                      <p className="text-slate-600 leading-relaxed pt-0.5">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinical Oversight Callout */}
              <div className="mt-6 p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/80 flex items-start gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-snug">
                  <strong className="font-bold text-slate-900">Role Boundary Assurance:</strong> All actions adhere to strict RBAC boundaries. Final clinical decisions require authenticated clinician sign-off.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
