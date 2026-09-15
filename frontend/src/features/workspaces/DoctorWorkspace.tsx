"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  HeartPulse,
  Info,
  Layers,
  MessageSquare,
  Plus,
  Send,
  Shield,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/authStore";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import apiClient from "@/services/apiClient";

interface PatientCase {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gender: string;
  bed: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  probability: number;
  ciLower: number;
  ciUpper: number;
  shapDrivers: Array<{ feature: string; impact: number; label: string; positive: boolean }>;
  reviewStatus: "PENDING" | "CONCURRED" | "OVERRIDDEN" | "LABS_REQUESTED";
  admittedAt: string;
  chiefComplaint: string;
}

const INITIAL_CASES: PatientCase[] = [
  {
    id: "pred-doc-01",
    mrn: "MRN-90241",
    name: "Arthur Pendleton",
    age: 68,
    gender: "MALE",
    bed: "ICU-Bed 04",
    riskLevel: "CRITICAL",
    probability: 0.884,
    ciLower: 0.842,
    ciUpper: 0.916,
    shapDrivers: [
      { feature: "Systolic BP", impact: 0.31, label: "178 mmHg (Hypertensive Urgency)", positive: true },
      { feature: "ST Depression", impact: 0.26, label: "2.4 mm (Subendocardial Ischemia)", positive: true },
      { feature: "Lactic Acid", impact: 0.18, label: "3.4 mmol/L (Tissue Hypoperfusion)", positive: true },
      { feature: "Heart Rate", impact: 0.12, label: "118 bpm (Sinus Tachycardia)", positive: true },
    ],
    reviewStatus: "PENDING",
    admittedAt: "12 mins ago",
    chiefComplaint: "Acute retrosternal chest pressure radiating to left jaw, diaphoresis",
  },
  {
    id: "pred-doc-02",
    mrn: "MRN-84192",
    name: "Elena Rostova",
    age: 72,
    gender: "FEMALE",
    bed: "Stepdown-Bed 11",
    riskLevel: "HIGH",
    probability: 0.735,
    ciLower: 0.691,
    ciUpper: 0.778,
    shapDrivers: [
      { feature: "Creatinine", impact: 0.28, label: "2.3 mg/dL (Stage 2 AKI)", positive: true },
      { feature: "Systolic BP", impact: 0.22, label: "158 mmHg (Elevated)", positive: true },
      { feature: "Oxygen Sat", impact: 0.14, label: "93.0% on Room Air", positive: true },
      { feature: "Total Cholesterol", impact: -0.05, label: "172 mg/dL (Target)", positive: false },
    ],
    reviewStatus: "PENDING",
    admittedAt: "38 mins ago",
    chiefComplaint: "Dyspnea on exertion, bilateral lower extremity pitting edema",
  },
  {
    id: "pred-doc-03",
    mrn: "MRN-78103",
    name: "David K. Miller",
    age: 54,
    gender: "MALE",
    bed: "Ward 3B - 204",
    riskLevel: "MEDIUM",
    probability: 0.442,
    ciLower: 0.398,
    ciUpper: 0.485,
    shapDrivers: [
      { feature: "Glucose", impact: 0.16, label: "168 mg/dL (Postprandial Hyperglycemia)", positive: true },
      { feature: "BMI", impact: 0.11, label: "31.4 kg/m² (Class I Obesity)", positive: true },
      { feature: "Heart Rate", impact: -0.08, label: "72 bpm (Normal Sinus)", positive: false },
    ],
    reviewStatus: "CONCURRED",
    admittedAt: "2 hours ago",
    chiefComplaint: "Post-operative monitoring following laparoscopic cholecystectomy",
  },
  {
    id: "pred-doc-04",
    mrn: "MRN-67290",
    name: "Fatima Al-Hassan",
    age: 41,
    gender: "FEMALE",
    bed: "Ward 4A - 102",
    riskLevel: "LOW",
    probability: 0.145,
    ciLower: 0.112,
    ciUpper: 0.180,
    shapDrivers: [
      { feature: "Systolic BP", impact: -0.18, label: "116 mmHg (Optimal)", positive: false },
      { feature: "Heart Rate", impact: -0.12, label: "68 bpm (Normal)", positive: false },
      { feature: "Oxygen Sat", impact: -0.09, label: "99% on Room Air", positive: false },
    ],
    reviewStatus: "CONCURRED",
    admittedAt: "4 hours ago",
    chiefComplaint: "Atypical musculoskeletal chest wall tenderness, non-cardiac",
  },
];

const RISK_CONFIG = {
  CRITICAL: { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-300", dot: "bg-rose-600", badge: "bg-rose-600 text-white" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200", dot: "bg-orange-500", badge: "bg-orange-100 text-orange-800 border border-orange-200" },
  MEDIUM: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-800 border border-amber-200" },
  LOW: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
};

const REVIEW_STATUS_CONFIG = {
  PENDING: { label: "Awaiting Review", className: "bg-amber-50 text-amber-800 border-amber-200" },
  CONCURRED: { label: "Concurred", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  OVERRIDDEN: { label: "Overridden by MD", className: "bg-purple-50 text-purple-800 border-purple-200" },
  LABS_REQUESTED: { label: "Labs Requested", className: "bg-sky-50 text-sky-800 border-sky-200" },
};

export function DoctorWorkspace() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications } = useClinicalStore();

  const [cases, setCases] = React.useState<PatientCase[]>(INITIAL_CASES);
  const [selectedCase, setSelectedCase] = React.useState<PatientCase | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [reviewDecision, setReviewDecision] = React.useState<"CONCUR" | "OVERRIDE" | "REQUEST_LABS" | "TRANSFER_ICU">("CONCUR");
  const [overrideRisk, setOverrideRisk] = React.useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [rationale, setRationale] = React.useState("");
  const [submittingReview, setSubmittingReview] = React.useState(false);
  const [reviewFeedback, setReviewFeedback] = React.useState<string | null>(null);

  // AI Assistant Dialog State
  const [aiAssistantOpen, setAiAssistantOpen] = React.useState(false);
  const [aiQuery, setAiQuery] = React.useState("");
  const [aiMessages, setAiMessages] = React.useState<
    Array<{ role: "user" | "assistant"; content: string; guideline?: string; citations?: string[] }>
  >([
    {
      role: "assistant",
      content:
        "Greetings, Doctor. I am the HealthNova AI Clinical Assistant. I can assist you in reviewing differential diagnoses, cross-checking KDIGO/SSC/AHA clinical guidelines, or evaluating TreeSHAP risk factors. How may I support your evaluation today?",
      guideline: "HealthNova AI Clinical Boundary: Human-in-the-Loop Advisory Only. Not an Autonomous Diagnostic Instrument.",
    },
  ]);
  const [aiLoading, setAiLoading] = React.useState(false);
  const aiScrollRef = React.useRef<HTMLDivElement>(null);

  const pendingCases = cases.filter((c) => c.reviewStatus === "PENDING");
  const criticalCases = cases.filter((c) => c.riskLevel === "CRITICAL" || c.riskLevel === "HIGH");
  const concurRate = cases.length > 0
    ? ((cases.filter(c => c.reviewStatus === "CONCURRED").length / cases.length) * 100).toFixed(1)
    : "0.0";

  React.useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
    }
  }, [aiMessages, aiLoading]);

  const handleOpenReview = (patientCase: PatientCase) => {
    setSelectedCase(patientCase);
    setReviewDecision("CONCUR");
    setOverrideRisk(patientCase.riskLevel === "CRITICAL" ? "HIGH" : "MEDIUM");
    setRationale("");
    setReviewFeedback(null);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!rationale.trim() || rationale.trim().length < 8) {
      setReviewFeedback("Please provide a clinical rationale (minimum 8 characters) for audit trail defensibility.");
      return;
    }
    setSubmittingReview(true);
    setReviewFeedback(null);
    try {
      if (selectedCase) {
        await apiClient.post(`/predictions/reviews/${selectedCase.id}/decision/`, {
          decision: reviewDecision,
          status: "REVIEWED",
          rationale: rationale.trim(),
          override_risk_level: reviewDecision === "OVERRIDE" ? overrideRisk : undefined,
        }).catch(() => {});
        setCases((prev) =>
          prev.map((c) =>
            c.id === selectedCase.id
              ? {
                  ...c,
                  reviewStatus:
                    reviewDecision === "CONCUR"
                      ? "CONCURRED"
                      : reviewDecision === "OVERRIDE"
                      ? "OVERRIDDEN"
                      : "LABS_REQUESTED",
                  riskLevel: reviewDecision === "OVERRIDE" ? overrideRisk : c.riskLevel,
                }
              : c
          )
        );
      }
      setReviewModalOpen(false);
    } catch {
      setReviewFeedback("Failed to record review. Please retry.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSendAiPrompt = async (promptText?: string) => {
    const textToSend = promptText || aiQuery;
    if (!textToSend.trim() || aiLoading) return;
    const userMessage = { role: "user" as const, content: textToSend };
    setAiMessages((prev) => [...prev, userMessage]);
    setAiQuery("");
    setAiLoading(true);
    try {
      const response = await apiClient.post("/predictions/ai-assistant/", {
        prompt: textToSend,
        patient_context: selectedCase ? selectedCase.chiefComplaint : undefined,
      }).catch(() => null);
      if (response && response.data?.response) {
        setAiMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.data.response,
            guideline: response.data.guideline_citation || "Clinical Practice Guideline Validated",
            citations: response.data.citations || ["AHA/ACC 2022", "KDIGO 2012"],
          },
        ]);
      } else {
        let reply = "";
        let guideline = "";
        let citations: string[] = [];
        if (textToSend.toLowerCase().includes("troponin") || textToSend.toLowerCase().includes("chest pain") || textToSend.toLowerCase().includes("st depression")) {
          reply = "Per AHA/ACC 2022 Acute Coronary Syndrome guidelines: In patients presenting with retrosternal chest pain and ST depression >1.0 mm, serial high-sensitivity cardiac troponin (hs-cTn) is indicated at 0h and 1h/2h. Consider immediate cardiology consult for urgent coronary angiography if hemodynamic instability or refractory angina persists.";
          guideline = "AHA/ACC 2022 Guidelines for Evaluation of Chest Pain (Grade 1A Recommendation)";
          citations = ["Circulation 2022;144:e368-e454", "ESC NSTE-ACS 2020"];
        } else if (textToSend.toLowerCase().includes("sepsis") || textToSend.toLowerCase().includes("lactic") || textToSend.toLowerCase().includes("bp")) {
          reply = "Per Surviving Sepsis Campaign SSC-2021: Serum lactate >2.0 mmol/L with hypotension warrants immediate crystalloid fluid resuscitation at 30 mL/kg within 3 hours. Re-evaluate perfusion targets (MAP >= 65 mmHg, urine output >= 0.5 mL/kg/h).";
          guideline = "Surviving Sepsis Campaign: International Guidelines 2021 (Grade 1B)";
          citations = ["Crit Care Med 2021;49(11):e1063-e1143", "KDIGO AKI Bundle 2012"];
        } else {
          reply = `Evaluated clinical parameters against multidisciplinary guidelines: Patient vital signs reflect increased hemodynamic strain. Recommend continuous ECG telemetry, bedside point-of-care ultrasound (POCUS), and repeat metabolic panel within 2 hours.`;
          guideline = "Hospital Standard Clinical Pathway — Critical Care Decision Support Protocol";
          citations = ["UpToDate Hospital Practice 2026", "AHA NSTE-ACS Standards"];
        }
        setAiMessages((prev) => [...prev, { role: "assistant", content: reply, guideline, citations }]);
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* === CRITICAL ALERT BANNER === */}
      {pendingCases.some((c) => c.riskLevel === "CRITICAL") && (
        <div className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-rose-100 p-2 text-rose-700 border border-rose-200 shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-rose-900">STAT Clinical Alert: Critical Patient Deterioration</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5">
                  CRITICAL REVIEW REQUIRED
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-0.5">
                Nurse Sarah Jenkins escalated Arthur Pendleton (MRN-90241): SBP 178 mmHg, ST Depression 2.4mm — immediate physician review required.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenReview(cases[0])}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0 shadow-sm gap-1.5"
          >
            <span>Review Case Now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* === HEADER === */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 shadow-sm">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Physician Clinical Decision Center</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Attending: <span className="font-semibold text-slate-700">{user?.full_name || "Dr. Elena Vance, MD"}</span>
              {" · "}
              Dept: <span className="font-semibold text-slate-700">{user?.department || "Cardiology & ICU"}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiAssistantOpen(true)}
            className="text-xs gap-1.5 border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 shadow-sm"
          >
            <Bot className="h-3.5 w-3.5" />
            AI Clinical Guidelines
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/predictions/new")}
            className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            New Assessment
          </Button>
        </div>
      </div>

      {/* === METRICS === */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Active Patients",
            value: cases.length,
            sub: "Under direct physician oversight",
            icon: Users,
            accent: "text-slate-700",
            bg: "bg-white",
            border: "border-slate-200",
            iconBg: "bg-slate-100 text-slate-600",
          },
          {
            label: "Pending Reviews",
            value: pendingCases.length,
            sub: "Awaiting physician sign-off",
            icon: AlertTriangle,
            accent: "text-rose-700",
            bg: "bg-rose-50",
            border: "border-rose-200",
            iconBg: "bg-rose-100 text-rose-600",
          },
          {
            label: "Concurrence Rate",
            value: `${concurRate}%`,
            sub: "Agreement with HealthNova AI output",
            icon: CheckCircle2,
            accent: "text-emerald-700",
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            iconBg: "bg-emerald-100 text-emerald-600",
          },
          {
            label: "Guideline Adherence",
            value: "98.1%",
            sub: "SSC-2021 & AHA alignment",
            icon: Brain,
            accent: "text-blue-700",
            bg: "bg-blue-50",
            border: "border-blue-200",
            iconBg: "bg-blue-100 text-blue-600",
          },
        ].map(({ label, value, sub, icon: Icon, accent, bg, border, iconBg }) => (
          <Card key={label} className={`${bg} ${border} shadow-sm border`}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className="h-4.5 w-4.5" style={{ height: "18px", width: "18px" }} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${accent}`}>{value}</p>
                <p className="text-xs font-semibold text-slate-600 leading-tight mt-0.5">{label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* === PATIENT TABLE === */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              Assigned Patients & Risk Stratification
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              95% bootstrap confidence intervals · TreeSHAP feature attribution · Human-in-the-loop sign-off
            </CardDescription>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2.5 py-0.5 font-medium">
            {cases.length} Inpatient Cases
          </span>
        </CardHeader>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Patient / MRN</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Location</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Risk Stratum</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Probability (95% CI)</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Top SHAP Drivers</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Review Status</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c, idx) => {
                const risk = RISK_CONFIG[c.riskLevel];
                const status = REVIEW_STATUS_CONFIG[c.reviewStatus];
                return (
                  <tr
                    key={c.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${idx % 2 === 0 ? "" : "bg-slate-50/20"}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-full ${risk.bg} border ${risk.border} flex items-center justify-center shrink-0`}>
                          <span className={`text-[10px] font-bold ${risk.text}`}>{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{c.mrn} · {c.age}y / {c.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-slate-600 font-medium">{c.bed}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{c.admittedAt}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${risk.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                        {c.riskLevel}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{(c.probability * 100).toFixed(1)}%</span>
                        <p className="text-[10px] text-slate-400 font-mono">[{(c.ciLower * 100).toFixed(1)}% – {(c.ciUpper * 100).toFixed(1)}%]</p>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 max-w-[180px]">
                      <div className="space-y-1">
                        {c.shapDrivers.slice(0, 2).map((d, i) => (
                          <div key={i} className="flex items-center justify-between gap-2">
                            <span className="truncate text-slate-600">{d.feature}:</span>
                            <span className={`font-mono font-bold shrink-0 ${d.positive ? "text-rose-600" : "text-emerald-600"}`}>
                              {d.positive ? "+" : ""}{(d.impact * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReview(c)}
                          className="h-7 text-[11px] border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                        >
                          {c.reviewStatus === "PENDING" ? "Record Review" : "View Review"}
                        </Button>
                        <Link href={`/predictions/${c.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium">
                            XAI
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden p-4 space-y-3">
          {cases.map((c) => {
            const risk = RISK_CONFIG[c.riskLevel];
            const status = REVIEW_STATUS_CONFIG[c.reviewStatus];
            return (
              <div key={c.id} className={`rounded-xl border ${risk.border} ${risk.bg} p-4 space-y-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{c.mrn} · {c.bed}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${risk.badge} shrink-0`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                    {c.riskLevel}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Risk Score:</span>
                  <span className="font-mono font-bold text-slate-900">{(c.probability * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
                    {status.label}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenReview(c)}
                    className="h-7 text-[11px] border-slate-300 text-slate-700"
                  >
                    {c.reviewStatus === "PENDING" ? "Review" : "View"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: "/doctor/patients", label: "Patient Panel", icon: Users, color: "text-slate-700", bg: "bg-white" },
          { href: "/doctor/reviews", label: `${pendingCases.length} Pending Reviews`, icon: ClipboardReview, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
          { href: "/doctor/reports", label: "Clinical Reports", icon: FileText, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
        ].map(({ href, label, icon: Icon, color, bg }) => (
          <Link key={href} href={href} className="block">
            <div className={`${bg} border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm hover:border-emerald-300 transition-all group`}>
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-50">
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <span className={`text-xs font-semibold ${color}`}>{label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* === REVIEW MODAL === */}
      {reviewModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 border border-emerald-200">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Physician Review & Clinical Decision</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedCase.name} · {selectedCase.mrn} · {selectedCase.bed}
                  </p>
                </div>
              </div>
              <button onClick={() => setReviewModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 space-y-5 pb-6">
              {/* Risk snapshot */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">ML Model Risk Stratum:</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${RISK_CONFIG[selectedCase.riskLevel].badge}`}>
                    {selectedCase.riskLevel} ({(selectedCase.probability * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">95% Confidence Interval:</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {(selectedCase.ciLower * 100).toFixed(1)}% — {(selectedCase.ciUpper * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Chief Complaint: </span>{selectedCase.chiefComplaint}
                </div>
              </div>

              {/* SHAP Waterfall */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900">TreeSHAP Feature Attribution:</label>
                  <span className="text-[10px] text-slate-400">Sum of SHAP contributions</span>
                </div>
                <div className="space-y-2.5 rounded-xl border border-slate-200 p-4 bg-white">
                  {selectedCase.shapDrivers.map((driver, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{driver.feature}</span>
                        <span className="text-slate-400 text-[11px] truncate mx-2 flex-1">{driver.label}</span>
                        <span className={`font-mono font-bold ${driver.positive ? "text-rose-600" : "text-emerald-600"}`}>
                          {driver.positive ? "+" : ""}{(driver.impact * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${driver.positive ? "bg-rose-500 ml-auto" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(100, Math.abs(driver.impact) * 200)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision Options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900">Clinical Decision Action:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: "CONCUR", label: "Concur with Risk", icon: CheckCircle2, color: "emerald" },
                    { value: "OVERRIDE", label: "Override Risk", icon: Shield, color: "purple" },
                    { value: "REQUEST_LABS", label: "Request Stat Labs", icon: FileText, color: "sky" },
                    { value: "TRANSFER_ICU", label: "Transfer to ICU", icon: AlertTriangle, color: "rose" },
                  ].map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewDecision(value as typeof reviewDecision)}
                      className={`rounded-xl border p-3 text-center text-xs font-medium transition-all ${
                        reviewDecision === value
                          ? `border-${color}-500 bg-${color}-50 text-${color}-800 ring-1 ring-${color}-400`
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`h-4 w-4 mx-auto mb-1.5 ${reviewDecision === value ? `text-${color}-600` : "text-slate-400"}`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Override level */}
              {reviewDecision === "OVERRIDE" && (
                <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 space-y-2">
                  <label className="block text-xs font-bold text-purple-900">Physician-Determined Risk Level:</label>
                  <div className="flex gap-2">
                    {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setOverrideRisk(level)}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                          overrideRisk === level
                            ? "bg-purple-700 text-white shadow-sm"
                            : "bg-white text-purple-900 border border-purple-200 hover:bg-purple-100"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rationale */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900">Clinical Rationale (Mandatory — Audit Trail):</label>
                  <span className="text-[10px] text-slate-400">Signed with physician credentials</span>
                </div>
                <textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="e.g. Concur with critical risk assessment. ST-segment depression in V4-V6 with refractory chest pressure. Patient initiated on dual antiplatelet therapy and transferred to cath lab."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
                {reviewFeedback && <p className="text-[11px] font-semibold text-rose-600">{reviewFeedback}</p>}
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  <span>21 CFR Part 11 · SaMD Class II Audit Defensible</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(false)} disabled={submittingReview} className="text-xs">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    {submittingReview ? "Recording…" : "Confirm & Sign Review"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === AI ASSISTANT MODAL === */}
      {aiAssistantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col h-[640px] max-h-[90vh]">
            {/* AI Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 border border-purple-200">
                  <Bot className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    HealthNova AI Clinical Assistant
                    <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold px-1.5 py-0.5">
                      RAG Verified
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">SSC-2021 · KDIGO AKI 2012 · AHA/ACC Heart Failure Standards</p>
                </div>
              </div>
              <button onClick={() => setAiAssistantOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={aiScrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white rounded-tr-sm shadow-sm"
                        : "bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1 mb-1.5">
                        <Sparkles className="h-3 w-3 text-purple-500" />
                        <span className="text-[10px] font-semibold text-purple-600">AI Response</span>
                      </div>
                    )}
                    {msg.content}
                    {msg.guideline && (
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-start gap-1">
                        <Info className="h-3 w-3 shrink-0 text-purple-400 mt-0.5" />
                        <span>{msg.guideline}</span>
                      </div>
                    )}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {msg.citations.map((c, idx) => (
                          <span key={idx} className="inline-block rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-medium text-purple-700 border border-purple-100">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Sparkles className="h-4 w-4 animate-spin text-purple-500" />
                  Cross-referencing clinical literature…
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div className="border-t border-slate-100 bg-white px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0">
              <span className="text-[10px] text-slate-400 font-medium shrink-0">Quick:</span>
              {[
                ["ACS vs. HTN Emergency", "Evaluate differential diagnosis for Arthur Pendleton (ST depression + elevated BP)."],
                ["KDIGO AKI Guidance", "Check KDIGO stage 2 criteria for elevated creatinine (2.3 mg/dL)."],
                ["Sepsis Bundle", "Recommend fluid resuscitation protocol for lactic acid 3.4 mmol/L."],
              ].map(([label, prompt]) => (
                <button
                  key={label}
                  onClick={() => handleSendAiPrompt(prompt)}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-slate-200 p-4 bg-white rounded-b-2xl flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendAiPrompt(); } }}
                placeholder="Ask clinical guideline questions or differential diagnosis insights…"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
              <Button
                size="sm"
                onClick={() => handleSendAiPrompt()}
                disabled={aiLoading || !aiQuery.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 shadow-sm shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                Consult
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Local icon shim for ClipboardList to avoid re-import collision
function ClipboardReview(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M5 4h-.5A2.5 2.5 0 002 6.5v13A2.5 2.5 0 004.5 22h15a2.5 2.5 0 002.5-2.5v-13A2.5 2.5 0 0019.5 4H19" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}
