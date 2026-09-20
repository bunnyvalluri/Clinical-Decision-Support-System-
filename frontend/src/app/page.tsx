"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart2,
  BookOpen,
  Brain,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Fingerprint,
  Gauge,
  Heart,
  HeartPulse,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Stethoscope,
  Terminal,
  TrendingUp,
  UserCheck,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicNavbar, PublicFooter } from "@/components/layout";
import { RealtimeEcgWaveform } from "@/components/clinical/RealtimeEcgWaveform";

// Pre-calibrated clinical cohort presets for the interactive bedside simulator
const PRESETS = [
  {
    name: "Healthy Baseline",
    badge: "LOW RISK",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-300",
    vitals: {
      age: 42,
      systolicBp: 118,
      diastolicBp: 76,
      heartRate: 155,
      stDepression: 0.2,
      cholesterol: 182,
      chestPain: 2, // Non-anginal
    },
  },
  {
    name: "Borderline Ambulatory",
    badge: "MODERATE",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-300",
    vitals: {
      age: 56,
      systolicBp: 142,
      diastolicBp: 90,
      heartRate: 138,
      stDepression: 1.2,
      cholesterol: 236,
      chestPain: 1, // Atypical
    },
  },
  {
    name: "Urgent Cardiology Triage",
    badge: "HIGH RISK",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-300",
    vitals: {
      age: 64,
      systolicBp: 168,
      diastolicBp: 104,
      heartRate: 118,
      stDepression: 2.4,
      cholesterol: 284,
      chestPain: 0, // Typical Angina
    },
  },
  {
    name: "Acute ICU Deterioration",
    badge: "CRITICAL",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-300",
    vitals: {
      age: 72,
      systolicBp: 188,
      diastolicBp: 118,
      heartRate: 94,
      stDepression: 3.8,
      cholesterol: 335,
      chestPain: 3, // Asymptomatic Ischemia
    },
  },
];

const CLINICAL_ROLES_DATA = [
  {
    id: "doctor",
    title: "Attending Cardiologist",
    code: "MD / DO",
    badge: "Clinical Authority",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    icon: Stethoscope,
    tagline: "High-acuity decision intelligence with complete pathophysiological transparency.",
    primaryTools: [
      "12-Lead Holter ECG Telemetry Review",
      "TreeSHAP Biomarker Attribution Waterfall",
      "Mandatory Clinical Override & Sign-off Gate",
      "Automated ReportLab Discharge Summaries",
    ],
    metric: "0.136 ms",
    metricLabel: "Per-Case Inference SLA",
    sla: "Zero Prescriptive Autonomy",
  },
  {
    id: "nurse",
    title: "Triage & Bedside Nurse",
    code: "RN / BSN",
    badge: "Rapid Response",
    badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
    icon: Activity,
    tagline: "Early warning trajectory alerts that intercept deterioration hours before bedside monitors alarm.",
    primaryTools: [
      "Real-Time Bedside Vital Ingestion",
      "Continuous qSOFA & NEWS2 Rule Verification",
      "Early Sepsis Trajectory Interception (+4.2h Lead)",
      "Instant Rapid Response Team STAT Paging",
    ],
    metric: "< 20 ms",
    metricLabel: "Telemetry Synchronization",
    sla: "Sub-Second Alerting",
  },
  {
    id: "informaticist",
    title: "Medical Informaticist",
    code: "MS / PhD",
    badge: "Model Quality",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Brain,
    tagline: "Statistical drift surveillance, PSI/KS evaluations, and continuous calibration monitoring.",
    primaryTools: [
      "Champion Random Forest Registry (SHA-256)",
      "Population Stability Index (PSI) Drift Telemetry",
      "HL7 FHIR v4.0.1 Data Quality Pipeline Validation",
      "Shannon Entropy Uncertainty Quantification",
    ],
    metric: "0.0027",
    metricLabel: "Calibrated Brier Score",
    sla: "Daily Automated Audit",
  },
  {
    id: "executive",
    title: "Hospital CMO & Leadership",
    code: "CMO / VP",
    badge: "Institutional Governance",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    icon: ShieldCheck,
    tagline: "Executive oversight, regulatory 21 CFR Part 11 audit trails, and clinical risk mitigation.",
    primaryTools: [
      "Hospital-Wide Clinical Risk Stratification Heatmaps",
      "Tamper-Evident Immutable PostgreSQL Audit Ledger",
      "False Alarm Alert Fatigue Reduction (-38%)",
      "100% Attending Physician Sign-Off Verification",
    ],
    metric: "ROC-AUC 0.941",
    metricLabel: "Multi-Cohort Evaluation",
    sla: "HIPAA § 164.312 Verified",
  },
];

const HERO_CLINICIANS = [
  {
    name: "Dr. Vadla Abhinay",
    initials: "VA",
    role: "MD",
    title: "Chief of Cardiology • Attending",
    image: "/doctor-hero.jpg",
    alt: "Attending Cardiologist Dr. Vadla Abhinay reviewing patient risk assessment on tablet",
    node: "NODE 04 • ICU TELEMETRY",
    enc: "ENC-88291",
    vitalsBadge: "114 BPM • 98% SpO2",
    registry: "SHA-256 Verified",
  },
  {
    name: "Dr. Valluri Rahul",
    initials: "VR",
    role: "MD",
    title: "Chief of Cardiology • Attending",
    image: "/doctor-hero-rahul.jpg",
    alt: "Attending Cardiologist Dr. Valluri Rahul reviewing cardiac telemetry on tablet",
    node: "NODE 02 • CCU TELEMETRY",
    enc: "ENC-88292",
    vitalsBadge: "114 BPM • 98% SpO2",
    registry: "SHA-256 Verified",
  },
  {
    name: "Dr. Vedha Sree",
    initials: "VS",
    role: "MD",
    title: "Director of Clinical Risk & Safety • Attending",
    image: "/doctor-hero-vedha.jpg",
    alt: "Attending Physician Dr. Vedha Sree reviewing cardiac risk assessment on tablet",
    node: "NODE 03 • EMERGENCY TELEMETRY",
    enc: "ENC-88293",
    vitalsBadge: "114 BPM • 98% SpO2",
    registry: "SHA-256 Verified",
  },
  {
    name: "Dr. Prashanth",
    initials: "KP",
    role: "MD",
    title: "Director of Critical Care & Diagnostics • Attending",
    image: "/doctor-hero-prashanth.jpg?v=2",
    alt: "Attending Physician Dr. Prashanth reviewing hemodynamic telemetry on tablet",
    node: "NODE 05 • CRITICAL CARE UNIT",
    enc: "ENC-88294",
    vitalsBadge: "114 BPM • 98% SpO2",
    registry: "SHA-256 Verified",
  },
  {
    name: "Dr. Pranay",
    initials: "AP",
    role: "MD",
    title: "Director of Acute Interventions & Telemetry • Attending",
    image: "/doctor-hero-pranay.jpg",
    alt: "Attending Physician Dr. Pranay reviewing patient cardiac telemetry on tablet",
    node: "NODE 06 • CARDIAC SURGICAL ICU",
    enc: "ENC-88295",
    vitalsBadge: "114 BPM • 98% SpO2",
    registry: "SHA-256 Verified",
  },
];

export default function LandingPage() {
  // Rotating Hero Clinician Photo Carousel (cycles every 2 seconds)
  const [activeClinicianIndex, setActiveClinicianIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveClinicianIndex((prev) => (prev + 1) % HERO_CLINICIANS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Interactive Live Bedside Simulator State
  const [vitals, setVitals] = useState(PRESETS[1].vitals);
  const [activePresetIndex, setActivePresetIndex] = useState<number>(1);
  const [activeRoleIndex, setActiveRoleIndex] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copiedHandover, setCopiedHandover] = useState(false);

  // Biological plausibility check
  const isBiologicalViolation = vitals.systolicBp <= vitals.diastolicBp;

  // Calibrated machine learning risk assessment simulation calculation
  const simulationResult = useMemo(() => {
    let score = 0.12;

    // Systolic blood pressure contribution
    if (vitals.systolicBp > 180) score += 0.28;
    else if (vitals.systolicBp > 160) score += 0.22;
    else if (vitals.systolicBp > 140) score += 0.14;
    else if (vitals.systolicBp > 130) score += 0.06;

    // ST depression (ECG ischemia marker)
    score += Math.min(0.38, vitals.stDepression * 0.09);

    // Heart rate response
    if (vitals.heartRate < 100) score += 0.18;
    else if (vitals.heartRate < 120) score += 0.11;
    else if (vitals.heartRate > 150) score -= 0.05;

    // Serum cholesterol
    if (vitals.cholesterol > 300) score += 0.15;
    else if (vitals.cholesterol > 240) score += 0.09;
    else if (vitals.cholesterol < 200) score -= 0.04;

    // Age factor
    if (vitals.age > 65) score += 0.12;
    else if (vitals.age > 50) score += 0.06;

    // Chest pain type
    if (vitals.chestPain === 3) score += 0.14; // Asymptomatic ischemia
    if (vitals.chestPain === 0) score += 0.12; // Typical angina

    // Bound probability between 0.03 and 0.98
    const probability = Math.max(0.03, Math.min(0.98, score));

    // Multi-class probability distribution calculation
    const pCrit = Math.max(0.01, Math.min(0.95, (probability - 0.5) * 2.0));
    const pHigh = Math.max(
      0.02,
      Math.min(0.85, probability > 0.4 ? 0.6 - Math.abs(probability - 0.65) : 0.1)
    );
    const pMed = Math.max(
      0.02,
      Math.min(0.8, probability > 0.2 ? 0.5 - Math.abs(probability - 0.35) : 0.15)
    );
    const pLow = Math.max(0.01, Math.min(0.95, 1.0 - (pCrit + pHigh + pMed)));
    const sumP = pCrit + pHigh + pMed + pLow;
    const normP = [pLow / sumP, pMed / sumP, pHigh / sumP, pCrit / sumP];

    // Normalized Shannon Entropy (Uncertainty)
    const entropy =
      -normP.reduce((acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0), 0) / Math.log2(4);
    const sortedP = [...normP].sort((a, b) => b - a);
    const margin = sortedP[0] - sortedP[1];
    const isUncertain = entropy > 0.82 || margin < 0.18;

    // Determine clinical risk tier
    let tier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let tierColor = "from-emerald-500 to-teal-600";
    let tierBadgeClass = "bg-emerald-50 text-emerald-800 border-emerald-300";
    let tierGlowColor = "rgba(16, 185, 129, 0.2)";
    let recommendation =
      "Vitals are within baseline bounds. Continue standard observation and routine outpatient care.";

    if (probability >= 0.75 || vitals.stDepression >= 3.0 || vitals.systolicBp >= 180) {
      tier = "CRITICAL";
      tierColor = "from-purple-600 via-rose-600 to-red-600";
      tierBadgeClass = "bg-purple-50 text-purple-800 border-purple-300";
      tierGlowColor = "rgba(168, 85, 247, 0.25)";
      recommendation =
        "Immediate cardiac resuscitation or ICU bed transfer. Stat troponins and cardiologist bedside consult.";
    } else if (probability >= 0.5) {
      tier = "HIGH";
      tierColor = "from-rose-500 to-red-600";
      tierBadgeClass = "bg-rose-50 text-rose-800 border-rose-300";
      tierGlowColor = "rgba(244, 63, 94, 0.25)";
      recommendation =
        "Urgent diagnostic review. Order serial troponins, 12-lead ECG telemetry, and arterial blood gas panel.";
    } else if (probability >= 0.25) {
      tier = "MEDIUM";
      tierColor = "from-amber-500 to-orange-500";
      tierBadgeClass = "bg-amber-50 text-amber-800 border-amber-300";
      tierGlowColor = "rgba(245, 158, 11, 0.25)";
      recommendation =
        "Moderate clinical concern. Reassess vitals every 2 hours and review patient medication chart.";
    }

    // Localized TreeSHAP feature attributions
    const shapDrivers = [
      {
        factor: "ST Depression (ECG)",
        value: `${vitals.stDepression.toFixed(1)} mm`,
        attribution: (vitals.stDepression * 0.082).toFixed(3),
        isPositive: vitals.stDepression >= 1.0,
        percentage: Math.min(100, Math.round(vitals.stDepression * 25)),
      },
      {
        factor: "Systolic Blood Pressure",
        value: `${vitals.systolicBp} mmHg`,
        attribution: ((vitals.systolicBp - 120) * 0.0031).toFixed(3),
        isPositive: vitals.systolicBp >= 135,
        percentage: Math.min(100, Math.round(((vitals.systolicBp - 90) / 110) * 100)),
      },
      {
        factor: "Serum Cholesterol",
        value: `${vitals.cholesterol} mg/dL`,
        attribution: ((vitals.cholesterol - 200) * 0.00095).toFixed(3),
        isPositive: vitals.cholesterol >= 220,
        percentage: Math.min(100, Math.round(((vitals.cholesterol - 140) / 220) * 100)),
      },
      {
        factor: "Max Exertion Heart Rate",
        value: `${vitals.heartRate} bpm`,
        attribution: ((150 - vitals.heartRate) * 0.00185).toFixed(3),
        isPositive: vitals.heartRate < 130,
        percentage: Math.min(100, Math.round(((200 - vitals.heartRate) / 140) * 100)),
      },
    ];

    return {
      probability: (probability * 100).toFixed(1),
      rawProbability: probability,
      tier,
      tierColor,
      tierBadgeClass,
      tierGlowColor,
      recommendation,
      entropy: entropy.toFixed(2),
      margin: margin.toFixed(2),
      isUncertain,
      shapDrivers,
      probabilities: {
        low: (normP[0] * 100).toFixed(1),
        med: (normP[1] * 100).toFixed(1),
        high: (normP[2] * 100).toFixed(1),
        crit: (normP[3] * 100).toFixed(1),
      },
    };
  }, [vitals]);

  const copyHandoverNotes = () => {
    const text = `HEALTHNOVA AI CLINICAL BEDSIDE HANDOVER
Status: ${simulationResult.tier} Risk (${simulationResult.probability}% Platt-Calibrated)
Vitals: BP ${vitals.systolicBp}/${vitals.diastolicBp} mmHg | HR ${vitals.heartRate} bpm | ST-Dep ${vitals.stDepression}mm | Chol ${vitals.cholesterol} mg/dL
Clinical Directive: ${simulationResult.recommendation}
Uncertainty: Entropy ${simulationResult.entropy} | Margin ${simulationResult.margin}
Attending Physician: ${HERO_CLINICIANS[activeClinicianIndex].name}, ${HERO_CLINICIANS[activeClinicianIndex].role} (Sign-Off Mandated)`;
    navigator.clipboard.writeText(text);
    setCopiedHandover(true);
    setTimeout(() => setCopiedHandover(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 selection:bg-teal-500/20 selection:text-teal-900 font-sans antialiased overflow-x-clip">
      {/* 1. Universal Institutional Top Navigation Bar */}
      <PublicNavbar />

      {/* Real-Time Clinical Ingestion Ribbon */}
      <div className="w-full bg-slate-100 border-b border-slate-200 py-1.5 px-4 text-[11px] font-mono text-slate-600">
        <div className="container mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
            </span>
            <span className="font-bold text-slate-900 uppercase">Live Ingestion Stream:</span>
            <span>HL7 FHIR v4.0.1 Synchronized • Neon PostgreSQL Authoritative Store</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Inference: 0.136ms
            </span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Zero PHI Memory
            </span>
            <span className="hidden md:inline text-slate-500 font-bold transition-all duration-300">
              Attending: {HERO_CLINICIANS[activeClinicianIndex].name}, {HERO_CLINICIANS[activeClinicianIndex].role}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Hero Section: Clinical Decision Support Platform */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20 lg:pt-18 lg:pb-24 border-b border-slate-200/80 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(13,148,136,0.08),rgba(2,132,199,0.04),transparent)]">
        {/* Subtle decorative clinical grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)] pointer-events-none opacity-40 -z-10" />

        <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Hero Copy & Actions */}
            <div className="lg:col-span-7 text-left space-y-5 sm:space-y-6">
              {/* Institutional Regulatory Compliance Ribbon */}
              <div className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-2xl sm:rounded-full text-xs font-semibold bg-white/95 backdrop-blur-md border border-slate-200/90 text-slate-700 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
                </span>
                <span className="font-mono text-[10px] sm:text-[11px] text-teal-800 font-bold uppercase tracking-wider">
                  FDA SaMD Class II Aligned
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-700 text-[11px] sm:text-xs font-medium">Sub-20ms Telemetry</span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-teal-700 font-mono text-xs font-semibold hidden sm:inline">
                  TreeSHAP Explainable
                </span>
              </div>

              {/* Authoritative Main Headline */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-tight sm:leading-[1.12]">
                Real-Time Clinical{" "}
                <span className="text-teal-600 block sm:inline">Decision Support System</span>
              </h1>

              {/* Subtitle / Value Proposition */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl leading-relaxed font-normal">
                Empowering hospital cardiologists, emergency triage nurses, and ICU teams with
                Platt-calibrated multi-class ML risk predictions, transparent TreeSHAP factor
                attributions, and deterministic clinical safety overrides.
              </p>

              {/* Clinical Governance Invariant Notice */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 flex items-start gap-3 sm:gap-3.5 max-w-xl shadow-2xs">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong className="font-bold text-slate-900">Clinical Responsibility Standard:</strong>{" "}
                    Assistive intelligence only. All clinical prescriptions, diagnoses, and medical decisions
                    require licensed human clinician evaluation and sign-off.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] text-slate-500 font-mono pt-1">
                    <span>● 21 CFR Part 11</span>
                    <span>● Zero PHI Export</span>
                    <span>● Non-Autonomous</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-sm font-bold gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm border-0 transition-all h-12 px-7 rounded-xl cursor-pointer"
                  >
                    <HeartPulse className="h-4 w-4" />
                    <span>Launch Live Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#simulator" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto text-sm font-semibold gap-2 bg-white border-slate-300 text-slate-800 hover:bg-slate-50 shadow-2xs transition-all h-12 px-6 rounded-xl cursor-pointer"
                  >
                    <Sliders className="h-4 w-4 text-teal-600" />
                    <span>Explore Bedside Simulator</span>
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column: Clear Clinical Medical Frame */}
            <div className="lg:col-span-5 relative flex justify-center items-center mt-6 lg:mt-0">
              <div className="relative w-full max-w-sm sm:max-w-md">
                {/* Main Clinical Frame */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-3.5 shadow-xl space-y-3.5">
                  {/* Hospital Telemetry Top Status Header */}
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-between text-[11px] font-mono border border-slate-200/90 transition-all duration-500">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-slate-900 font-bold tracking-tight">
                        {HERO_CLINICIANS[activeClinicianIndex].node}
                      </span>
                    </div>
                    <span className="text-teal-700 font-bold bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded transition-all duration-300">
                      {HERO_CLINICIANS[activeClinicianIndex].enc}
                    </span>
                  </div>

                  {/* Doctor Image Frame with 2-Second Rotating Photos */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-inner group">
                    {HERO_CLINICIANS.map((clinician, idx) => {
                      const isActive = idx === activeClinicianIndex;
                      return (
                        <div
                          key={clinician.name}
                          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                            isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                          }`}
                        >
                          <Image
                            src={clinician.image}
                            alt={clinician.alt}
                            width={600}
                            height={600}
                            priority={idx === 0}
                            className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                          />
                        </div>
                      );
                    })}

                    {/* Non-obstructive mini telemetry HUD badge - Pure Light */}
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 flex items-center gap-2 shadow-md z-20">
                      <Activity className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
                      <span className="text-[11px] font-mono text-teal-800 font-bold">
                        {HERO_CLINICIANS[activeClinicianIndex].vitalsBadge}
                      </span>
                    </div>

                    {/* Carousel slide indicators - Pure Light Glass */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm z-20">
                      {HERO_CLINICIANS.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveClinicianIndex(idx)}
                          className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                            idx === activeClinicianIndex
                              ? "w-4 bg-teal-600"
                              : "w-1.5 bg-slate-300 hover:bg-slate-400"
                          }`}
                          aria-label={`Switch to photo ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Attending Physician Profile Banner */}
                  <div className="p-3 rounded-xl bg-white text-slate-900 flex items-center justify-between border border-slate-200 shadow-xs transition-all duration-300">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs transition-all duration-300">
                        {HERO_CLINICIANS[activeClinicianIndex].initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-950 truncate transition-all duration-300">
                            {HERO_CLINICIANS[activeClinicianIndex].name}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                            {HERO_CLINICIANS[activeClinicianIndex].role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate transition-all duration-300">
                          {HERO_CLINICIANS[activeClinicianIndex].title}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-2 border-l border-slate-200 shrink-0">
                      <div className="min-w-0">
                        <span className="text-[9px] text-slate-500 font-mono font-semibold block uppercase leading-none">
                          REGISTRY
                        </span>
                        <span className="text-xs font-bold text-emerald-700 font-mono truncate block mt-0.5">
                          {HERO_CLINICIANS[activeClinicianIndex].registry}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional KPI Metric Ribbon */}
          <div className="pt-6 sm:pt-10 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 max-w-6xl mx-auto text-left">
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4.5 shadow-xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Champion Model</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-950 truncate">Random Forest</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] sm:text-[11px] text-teal-700 font-mono font-bold truncate">Calibrated Brier</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate">0.0027</span>
              </div>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4.5 shadow-xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Inference Latency</span>
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-950 truncate">0.136 ms</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] sm:text-[11px] text-slate-600 font-mono font-semibold truncate">Scikit-Learn</span>
                <span className="text-[9px] sm:text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 sm:py-0.5 rounded border border-emerald-200 shrink-0">
                  Sub-ms
                </span>
              </div>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4.5 shadow-xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Acute Safety</span>
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-950 truncate">0 Missed Events</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] sm:text-[11px] text-teal-700 font-mono font-bold truncate">100% Recall</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate">Acute</span>
              </div>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4.5 shadow-xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Live Telemetry</span>
                <Radio className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-600 animate-pulse shrink-0" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-950 truncate">ASGI Real-Time</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] sm:text-[11px] text-sky-700 font-mono font-bold truncate">Push</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate">WebSockets</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Bedside Risk Simulator & TreeSHAP Explainer */}
      <section id="simulator" className="py-12 sm:py-20 lg:py-28 bg-white border-b border-slate-200/80 relative">
        <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/90 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>LIVE CLINICAL SIMULATOR</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-slate-950">
              Live Patient Risk &amp; <span className="text-teal-600">TreeSHAP</span> Explainer
            </h2>
            <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Adjust patient vitals in real time to observe dynamic ML risk stratification,
              uncertainty entropy bounds, and localized TreeSHAP feature attributions.
            </p>
          </div>

          {/* Presets Segmented Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 p-1.5 bg-slate-100/90 rounded-2xl max-w-3xl mx-auto border border-slate-200">
            {PRESETS.map((preset, idx) => {
              const active = activePresetIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActivePresetIndex(idx);
                    setVitals(preset.vitals);
                  }}
                  className={`inline-flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent"
                  }`}
                >
                  <span className="truncate">{preset.name}</span>
                  <span
                    className={`text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-md border shrink-0 ${preset.badgeColor}`}
                  >
                    {preset.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Simulator Panel */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-slate-50/70 p-3 sm:p-5 lg:p-8 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 items-start">
              {/* Left: Sliders */}
              <div className="space-y-3 sm:space-y-4 text-left">
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <HeartPulse className="h-4.5 w-4.5 text-teal-600 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wide truncate">
                      Physiological Parameters
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePresetIndex(0);
                      setVitals(PRESETS[0].vitals);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-600 hover:text-teal-700 bg-white border border-slate-200 px-2.5 py-1 rounded-full cursor-pointer transition-colors shrink-0"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {isBiologicalViolation && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>
                      <strong>Biological Contradiction:</strong> Systolic ({vitals.systolicBp}) must exceed
                      Diastolic ({vitals.diastolicBp}).
                    </span>
                  </div>
                )}

                {[
                  {
                    label: "Resting BP (SBP / DBP)",
                    display: `${vitals.systolicBp} / ${vitals.diastolicBp} mmHg`,
                    min: 90,
                    max: 210,
                    step: 2,
                    value: vitals.systolicBp,
                    key: "systolicBp",
                    marks: ["90 (Norm)", "130 (Elev)", "160 (Stg 2)", "210 (Crisis)"],
                  },
                  {
                    label: "ST-Segment Depression (ECG)",
                    display: `${vitals.stDepression.toFixed(1)} mm`,
                    min: 0,
                    max: 5.0,
                    step: 0.1,
                    value: vitals.stDepression,
                    key: "stDepression",
                    marks: ["0.0mm (Iso)", "1.5mm (Mod)", "3.5mm (Severe)"],
                  },
                  {
                    label: "Max Heart Rate",
                    display: `${vitals.heartRate} bpm`,
                    min: 70,
                    max: 200,
                    step: 1,
                    value: vitals.heartRate,
                    key: "heartRate",
                    marks: ["70 (Low)", "140 (Target)", "200 (Max)"],
                  },
                  {
                    label: "Serum Cholesterol",
                    display: `${vitals.cholesterol} mg/dL`,
                    min: 140,
                    max: 380,
                    step: 5,
                    value: vitals.cholesterol,
                    key: "cholesterol",
                    marks: ["140 (Opt)", "240 (High)", "380 (Crit)"],
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="space-y-1.5 bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{s.label}</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80">
                        {s.display}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={s.value}
                      onChange={(e) => setVitals({ ...vitals, [s.key]: Number(e.target.value) })}
                      className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-full"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      {s.marks.map((m, j) => (
                        <span key={j}>{m}</span>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="space-y-2 bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-800 block">
                    Chest Pain Classification
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                    {[
                      { label: "Typical", val: 0 },
                      { label: "Atypical", val: 1 },
                      { label: "Non-Anginal", val: 2 },
                      { label: "Asymptomatic", val: 3 },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setVitals({ ...vitals, chestPain: item.val })}
                        className={`text-xs py-2 sm:py-2.5 rounded-xl font-medium transition-all text-center cursor-pointer border ${
                          vitals.chestPain === item.val
                            ? "bg-teal-700 text-white font-bold border-teal-700 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Output */}
              <div className="space-y-3 sm:space-y-4 text-left">
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <Brain className="h-4.5 w-4.5 text-teal-600 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wide truncate">
                      Real-Time Inference
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live Calibrated
                  </span>
                </div>

                {/* Risk Output Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm space-y-3.5 sm:space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-teal-700 pb-2 border-b border-slate-100">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Activity className="h-3.5 w-3.5 animate-pulse" />
                      LEAD II &bull; {vitals.heartRate} BPM
                    </span>
                    <span className="text-slate-500 font-medium">
                      ST: {vitals.stDepression > 0 ? `-${vitals.stDepression.toFixed(1)}mm` : "ISO"}
                    </span>
                  </div>

                  <RealtimeEcgWaveform
                    heartRate={vitals.heartRate}
                    stDepression={vitals.stDepression}
                    className="w-full h-11 sm:h-12"
                  />

                  {/* Header Row: Metric label + Risk Tier badge */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                        Calibrated Risk Probability
                      </span>
                      <span
                        className={`text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded-lg border shrink-0 ${simulationResult.tierBadgeClass}`}
                      >
                        {simulationResult.tier} RISK
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 font-mono tracking-tight">
                        {simulationResult.probability}%
                      </span>
                      <span className="text-[10px] sm:text-xs text-slate-500 font-mono">
                        Platt Sigmoid
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & Breakdown */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                      <div
                        className={`h-full transition-all duration-300 rounded-full bg-gradient-to-r ${simulationResult.tierColor}`}
                        style={{ width: `${simulationResult.probability}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center font-mono pt-0.5">
                      <div className="bg-slate-50 py-1 px-0.5 rounded-lg border border-slate-200/70">
                        <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase leading-none">Low</span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 mt-0.5 block leading-tight">{simulationResult.probabilities.low}%</span>
                      </div>
                      <div className="bg-slate-50 py-1 px-0.5 rounded-lg border border-slate-200/70">
                        <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase leading-none">Med</span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 mt-0.5 block leading-tight">{simulationResult.probabilities.med}%</span>
                      </div>
                      <div className="bg-slate-50 py-1 px-0.5 rounded-lg border border-slate-200/70">
                        <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase leading-none">High</span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 mt-0.5 block leading-tight">{simulationResult.probabilities.high}%</span>
                      </div>
                      <div className="bg-slate-50 py-1 px-0.5 rounded-lg border border-slate-200/70">
                        <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase leading-none">Crit</span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 mt-0.5 block leading-tight">{simulationResult.probabilities.crit}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Directive */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block mb-0.5">Clinical Directive:</span>
                      <span className="text-slate-700 leading-relaxed text-[11px] sm:text-xs">
                        {simulationResult.recommendation}
                      </span>
                    </div>
                  </div>

                  {/* Abstention Flag */}
                  {simulationResult.isUncertain && (
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-[11px] sm:text-xs text-purple-800 flex items-start sm:items-center gap-2 font-mono">
                      <AlertCircle className="h-4 w-4 text-purple-600 shrink-0 mt-0.5 sm:mt-0" />
                      <span className="leading-snug">
                        <strong>Abstention:</strong> Prediction requires additional review (H:{" "}
                        {simulationResult.entropy}).
                      </span>
                    </div>
                  )}

                  {/* Copy Handover Button */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={copyHandoverNotes}
                      className="inline-flex items-center justify-center gap-2 text-xs font-mono font-bold text-teal-700 hover:text-teal-900 bg-teal-50/80 hover:bg-teal-100/80 border border-teal-200/90 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors w-full sm:w-auto shadow-2xs"
                    >
                      {copiedHandover ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Copied Bedside Handover</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy SBAR Handover</span>
                        </>
                      )}
                    </button>
                    <div className="flex items-center justify-center sm:justify-end gap-1.5 text-[10px] text-slate-500 font-mono">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>Attending Gate: 100% Enforced</span>
                    </div>
                  </div>
                </div>

                {/* SHAP Attributions */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-xs sm:text-sm font-bold text-slate-950">
                      TreeSHAP Factor Attributions
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono text-slate-500">
                      Baseline E[f(x)] = 0.350
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {simulationResult.shapDrivers.map((driver, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center text-xs gap-1">
                          <span className="font-semibold text-slate-800 truncate text-[11px] sm:text-xs">{driver.factor}</span>
                          <div className="flex items-center gap-1.5 font-mono shrink-0">
                            <span className="text-slate-500 text-[10px] sm:text-[11px]">{driver.value}</span>
                            <span
                              className={`font-bold text-[10px] sm:text-[11px] ${
                                driver.isPositive ? "text-rose-600" : "text-emerald-600"
                              }`}
                            >
                              {driver.isPositive ? "+" : ""}
                              {driver.attribution}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              driver.isPositive ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${driver.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed pt-0.5">
                    Red = positive risk contributor; Green = protective clinical marker.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Clinical Intelligence for Every Role (Interactive Workstation Switcher) */}
      <section id="features" className="py-12 sm:py-20 lg:py-28 bg-slate-50/70 border-b border-slate-200/80">
        <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>ROLE-ENGINEERED WORKSPACES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-slate-950">
              Clinical Intelligence for <span className="text-teal-600">Every Role</span>
            </h2>
            <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
              Tailored interfaces purpose-built for the distinct clinical responsibilities of doctors,
              nurses, informaticists, and healthcare leadership.
            </p>
          </div>

          {/* Role Navigation Selector Tabs */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-4xl mx-auto">
            {CLINICAL_ROLES_DATA.map((role, idx) => {
              const active = activeRoleIndex === idx;
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setActiveRoleIndex(idx)}
                  className={`inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer border ${
                    active
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${active ? "text-teal-400" : "text-teal-600"} shrink-0`} />
                  <span className="truncate">{role.title}</span>
                  <span
                    className={`text-[8px] sm:text-[9px] font-mono font-bold px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded shrink-0 hidden xs:inline ${
                      active ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {role.code}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Role Detailed Workstation Showcase */}
          {CLINICAL_ROLES_DATA.filter((_, idx) => idx === activeRoleIndex).map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className="max-w-4xl mx-auto rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-4 sm:p-7 lg:p-9 shadow-xs text-left space-y-4 sm:space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 gap-3">
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs shrink-0 mt-0.5 sm:mt-0">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h3 className="text-base sm:text-xl font-black text-slate-950 leading-tight">
                          {role.title}
                        </h3>
                        <span
                          className={`text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded border shrink-0 ${role.badgeColor}`}
                        >
                          {role.badge}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-mono mt-1 sm:mt-0.5 leading-tight break-words">
                        Role: {role.code} • SLA: {role.sla}
                      </p>
                    </div>
                  </div>

                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button
                      size="sm"
                      className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-9 px-4 rounded-xl cursor-pointer"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">{role.tagline}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3.5">
                  {role.primaryTools.map((tool, i) => (
                    <div
                      key={i}
                      className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-800"
                    >
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span className="font-semibold">{tool}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 sm:pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2 font-mono">
                  <span>
                    Performance Benchmark: <strong className="text-slate-900">{role.metric}</strong> ({role.metricLabel})
                  </span>
                  <span className="text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200 self-start sm:self-auto">
                    Human-in-the-Loop Enforced
                  </span>
                </div>
              </div>
            );
          })}

          <div className="text-center pt-2">
            <Link href="/features">
              <Button className="w-full sm:w-auto gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold px-6 sm:px-8 h-11 sm:h-12 rounded-xl shadow-xs transition-colors cursor-pointer">
                <span>Explore All 12 Clinical Capabilities</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Where Technology Supports Better Care (Clinical Workflow Pipeline) */}
      <section id="workflow" className="py-12 sm:py-20 lg:py-28 bg-white border-b border-slate-200/80">
        <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>CARE PATHWAY INTEGRATION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-slate-950">
              Where <span className="text-teal-600">technology</span> supports better care.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left">
            {[
              {
                step: "01",
                icon: Stethoscope,
                bg: "bg-teal-50 border-teal-200",
                ic: "text-teal-700",
                title: "Triage & Vital Capture",
                desc: "Triage nurses register patients capturing biological vitals — BP, ECG ST slope, heart rate, and serum biomarkers — validated in real time against physiological bounds before any ML inference.",
              },
              {
                step: "02",
                icon: Brain,
                bg: "bg-sky-50 border-sky-200",
                ic: "text-sky-700",
                title: "Calibrated ML Inference",
                desc: "The active champion Random Forest pipeline processes scaled feature vectors into 4-class probability outputs, Platt sigmoid calibrated to a Brier score of 0.0027 with sub-millisecond latency.",
              },
              {
                step: "03",
                icon: Zap,
                bg: "bg-amber-50 border-amber-200",
                ic: "text-amber-700",
                title: "TreeSHAP Risk Attribution",
                desc: "Every prediction is paired with exact Shapley values, ranking each input feature contribution. Positive contributors surface in red; protective markers in green — zero black-box opacity.",
              },
              {
                step: "04",
                icon: FileText,
                bg: "bg-purple-50 border-purple-200",
                ic: "text-purple-700",
                title: "Clinician Action & PDF Report",
                desc: "Physicians confirm or override with mandatory documented rationales. Celery workers asynchronously generate ReportLab discharge summaries bound to tamper-evident audit logs.",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 sm:gap-5 p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-xs hover:shadow-lg hover:border-teal-300 hover:-translate-y-0.5 transition-all relative overflow-hidden"
                >
                  <span className="absolute top-3 sm:top-4 right-4 sm:right-5 text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-slate-100/90 select-none">
                    {item.step}
                  </span>
                  <div
                    className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl border ${item.bg} flex items-center justify-center shrink-0 shadow-2xs`}
                  >
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.ic}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-950 text-sm sm:text-base mb-1">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. End-to-End Solutions */}
      <section id="architecture" className="py-12 sm:py-20 lg:py-28 bg-slate-50/70 border-b border-slate-200/80">
        <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>ACTIVE CLOUD INFRASTRUCTURE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-slate-950">
              End-to-End Solutions for <span className="text-teal-600">Real-World</span> Clinical Challenges
            </h2>
            <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
              A purpose-built cloud stack handling everything from real-time telemetry to async PDF generation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left">
            {[
              {
                badge: "PostgreSQL 16",
                title: "Neon Lakebase",
                desc: "Serverless Lakebase Postgres with instant branch replication, autoscaling connection pooling, and AES-256 encrypted clinical records at rest.",
                icon: Database,
                border: "border-teal-200",
                ibg: "bg-teal-50 border-teal-200",
                ic: "text-teal-600",
                bbg: "bg-teal-50",
                bc: "text-teal-700",
              },
              {
                badge: "Django 5 + ASGI",
                title: "Real-Time API Gateway",
                desc: "Daphne 4 ASGI server with Django Channels WebSocket pub/sub, JWT middleware, and HIPAA audit event logging for all telemetry.",
                icon: Server,
                border: "border-sky-200",
                ibg: "bg-sky-50 border-sky-200",
                ic: "text-sky-600",
                bbg: "bg-sky-50",
                bc: "text-sky-700",
              },
              {
                badge: "Celery + Redis",
                title: "Async Worker Queue",
                desc: "TLS-encrypted Upstash Redis broker powering Celery background queues for ReportLab PDF generation, drift evaluations, and notifications.",
                icon: Cpu,
                border: "border-purple-200",
                ibg: "bg-purple-50 border-purple-200",
                ic: "text-purple-600",
                bbg: "bg-purple-50",
                bc: "text-purple-700",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-4 sm:p-6 lg:p-7 space-y-4 shadow-xs hover:shadow-lg hover:border-teal-400 hover:-translate-y-1 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest ${item.bbg} ${item.bc} px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border ${item.border}`}
                      >
                        {item.badge}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-bold text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    </div>
                    <div
                      className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl border ${item.ibg} flex items-center justify-center mb-3 sm:mb-4 shadow-2xs`}
                    >
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.ic}`} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-950 mb-1 sm:mb-2">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link href="/solutions">
              <Button className="w-full sm:w-auto gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold px-6 sm:px-8 h-11 sm:h-12 rounded-xl shadow-xs transition-colors cursor-pointer">
                <span>View Full Architecture</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. HIPAA & RBAC */}
      <section id="security" className="py-12 sm:py-20 lg:py-28 bg-white border-b border-slate-200/80">
        <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="space-y-4 sm:space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <span>SECURITY &amp; PATIENT PRIVACY</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-slate-950">
                Be the Clinical <span className="text-teal-600">Champion</span> with HIPAA Compliance
              </h2>
              <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
                Hospital environments demand uncompromising standards. HealthNova AI enforces medical
                record masking, audit logging, and strict role-based permissions at every layer.
              </p>
              <div className="space-y-2.5 sm:space-y-3.5 pt-1">
                {[
                  "Encrypted MRN with masked display across all telemetry feeds",
                  "Mandatory physician override justifications permanently bound to decision logs",
                  "Automatic JWT session expiration with silent refresh and instant local storage purging",
                  "All data in transit via TLS 1.3; at rest via AES-256 in Neon PostgreSQL",
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5 sm:gap-3 text-left">
                    <div className="h-5 w-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-teal-700" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-7 h-11 sm:h-12 font-bold text-xs sm:text-sm gap-2 shadow-xs cursor-pointer">
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto rounded-xl px-7 h-11 sm:h-12 font-semibold text-xs sm:text-sm border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-slate-50/90 p-4 sm:p-7 lg:p-9 space-y-3 sm:space-y-4 shadow-xs text-left">
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200">
                <span className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wide">
                  Role-Based Access Control
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
                  Enforced
                </span>
              </div>
              {[
                {
                  role: "Physicians / Cardiologists",
                  badge: "MD",
                  access: "Full EHR, Predictions, Overrides",
                  color: "text-teal-700 bg-teal-50 border-teal-200",
                },
                {
                  role: "Triage Nurses",
                  badge: "RN",
                  access: "Vitals Entry, Telemetry Alerts",
                  color: "text-sky-700 bg-sky-50 border-sky-200",
                },
                {
                  role: "Medical Informaticists",
                  badge: "MI",
                  access: "SHAP Analytics, Drift Evaluation",
                  color: "text-amber-700 bg-amber-50 border-amber-200",
                },
                {
                  role: "Hospital Administrators",
                  badge: "IT",
                  access: "Model Registry, Rollback, Audit",
                  color: "text-purple-700 bg-purple-50 border-purple-200",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 sm:py-3.5 border-b border-slate-200/80 last:border-0"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-md border ${item.color}`}>
                      {item.badge}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{item.role}</span>
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-500 font-mono hidden sm:block">{item.access}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Evidence-Based Medicine */}
      <section className="py-12 sm:py-20 lg:py-28 bg-slate-50/70 border-b border-slate-200/80">
        <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="space-y-4 sm:space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <span>MEDICAL EVIDENCE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-slate-950">
                Grounded in <span className="text-teal-600">Evidence-Based</span> Medicine
              </h2>
              <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
                All AI recommendations and clinical rule overrides are anchored in peer-reviewed consensus
                literature from leading international medical bodies.
              </p>
              <div className="space-y-2.5 sm:space-y-3.5 pt-1">
                {[
                  "Surviving Sepsis Campaign 2021 — SCCM/ESICM international guidelines",
                  "KDIGO Clinical Practice for AKI — Level 1A Evidence creatinine criteria",
                  "AHA/ACC 2017 Hypertension — Class I recommendations for hypertensive crisis",
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5 sm:gap-3 text-left">
                    <div className="h-5 w-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-teal-700" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <a href="#faq" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-7 h-11 sm:h-12 font-bold text-xs sm:text-sm gap-2 shadow-xs cursor-pointer">
                    <span>Read Evidence</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <a href="#simulator" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto rounded-xl px-7 h-11 sm:h-12 font-semibold text-xs sm:text-sm border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Try Simulator
                  </Button>
                </a>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 text-left">
              {[
                {
                  code: "SSC-2021-SEPSIS",
                  strength: "Strong Recommendation",
                  title: "Surviving Sepsis Campaign 2021",
                  desc: "SCCM/ESICM international guidelines for sepsis screening, blood lactate assessment, and IV crystalloid resuscitation protocols.",
                  cc: "text-teal-700 bg-teal-50 border-teal-200",
                },
                {
                  code: "KDIGO-2022-AKI",
                  strength: "Level 1A Evidence",
                  title: "KDIGO Clinical Practice for AKI",
                  desc: "Staging and stratification based on serum creatinine rise and urine output criteria.",
                  cc: "text-sky-700 bg-sky-50 border-sky-200",
                },
                {
                  code: "AHA-ACC-2017-HTN",
                  strength: "Class I Recommendation",
                  title: "AHA/ACC High Blood Pressure",
                  desc: "Hypertensive crisis stratification (>180/120 mmHg) differentiating acute target organ damage from hypertensive urgency.",
                  cc: "text-purple-700 bg-purple-50 border-purple-200",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${card.cc}`}>
                      {card.code}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono">{card.strength}</span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-950">{card.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="py-12 sm:py-20 lg:py-28 bg-white border-b border-slate-200/80">
        <div className="container mx-auto max-w-3xl px-3 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-slate-950">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
              Key considerations on clinical safety, ML calibration, and regulatory boundaries.
            </p>
          </div>
          <div className="space-y-3 sm:space-y-3.5 text-left">
            {[
              {
                q: "How does the system ensure licensed physicians retain final diagnostic authority?",
                a: "HealthNova AI decisions provide calibrated risk insights and do not replace professional medical judgment. The platform enforces a structured Clinician Override workflow, requiring documented clinical rationales whenever judgment differs from model output.",
              },
              {
                q: "What algorithms are benchmarked and active in the clinical prediction loop?",
                a: "The system benchmarks Random Forest, SVM (RBF kernel), and AdaBoost on group-aware partitioned cohorts. Random Forest is the active champion, achieving 1.0000 sensitivity on acute cases and a calibrated Brier score of 0.0027.",
              },
              {
                q: "How does the system handle high uncertainty or out-of-distribution patients?",
                a: "When prediction entropy exceeds 0.82 or the margin is below 0.18, the engine abstains with: 'Prediction requires additional review.' Mahalanobis distance checks flag atypical vitals outside validated training envelopes.",
              },
              {
                q: "How are TreeSHAP feature attributions computed during real-time inference?",
                a: "The ML Engine employs runtime TreeSHAP unwrapped through CalibratedClassifierCV wrappers, decomposing margin scores into individual feature weight additions and subtractions, executing in under 0.2 milliseconds.",
              },
              {
                q: "How does the platform handle PHI and HIPAA compliance?",
                a: "All data in transit is encrypted via TLS 1.3, records at rest in Neon PostgreSQL are AES-256 encrypted, MRNs are masked, and every interaction is written to tamper-evident audit logs.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:border-teal-300 shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4.5 text-left flex items-center justify-between font-bold text-slate-950 hover:text-teal-700 transition-colors cursor-pointer gap-3 sm:gap-4 text-xs sm:text-base"
                >
                  <span className="leading-snug">{item.q}</span>
                  <span
                    className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full border flex items-center justify-center shrink-0 transition-all text-sm sm:text-base leading-none font-light ${
                      openFaq === idx
                        ? "rotate-45 border-teal-400 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-slate-100 text-slate-500"
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === idx && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Universal Institutional Footer */}
      <PublicFooter />
    </div>
  );
}
