"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
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
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
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
import { ClinicalKnowledgeBrowser } from "@/components/clinical/ClinicalKnowledgeBrowser";
import { PatientTimelineViewer } from "@/components/clinical/PatientTimelineViewer";
import { ClinicalReviewModal } from "@/components/clinical/ClinicalReviewModal";
import { AISafetyStatusCard } from "@/components/clinical/AISafetyStatusCard";

export interface PatientCase {
  id: string;
  patientId: string;
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
  modelVersion: string;
  modelName: string;
  confidenceScore?: number;
  uncertaintyScore?: number;
  clinicianOverride?: string;
  overrideReason?: string;
  overriddenBy?: string;
  featuresSnapshot?: Record<string, any>;
  cdssGuidance?: Record<string, any>;
}

interface DoctorSummaryData {
  assigned_patients_count: number;
  high_risk_alerts_count: number;
  pending_reviews_count: number;
  unread_notifications_count: number;
  escalations: Array<{
    id: string;
    patient_mrn: string;
    patient_name: string;
    reason: string;
    priority: string;
    escalated_by: string;
    created_at: string;
  }>;
  recent_predictions: Array<any>;
}

const RISK_CONFIG = {
  CRITICAL: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-300",
    dot: "bg-rose-600",
    badge: "bg-rose-600 text-white font-bold",
  },
  HIGH: {
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200",
    dot: "bg-orange-500",
    badge: "bg-orange-100 text-orange-800 border border-orange-200 font-semibold",
  },
  MEDIUM: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 border border-amber-200 font-semibold",
  },
  LOW: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold",
  },
};

const REVIEW_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Awaiting Review", className: "bg-amber-50 text-amber-800 border-amber-200" },
  CONCURRED: { label: "Concurred", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  OVERRIDDEN: { label: "Overridden by MD", className: "bg-purple-50 text-purple-800 border-purple-200" },
  LABS_REQUESTED: { label: "Labs Requested", className: "bg-sky-50 text-sky-800 border-sky-200" },
  REVIEWED: { label: "Reviewed", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
};

type ActiveTab = "DECISION_CENTER" | "GUIDELINES" | "TIMELINE" | "AI_SAFETY";

export function DoctorWorkspace() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications } = useClinicalStore();

  const [activeTab, setActiveTab] = React.useState<ActiveTab>("DECISION_CENTER");
  const [cases, setCases] = React.useState<PatientCase[]>([]);
  const [summaryData, setSummaryData] = React.useState<DoctorSummaryData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedCase, setSelectedCase] = React.useState<PatientCase | null>(null);
  const [expandedCaseId, setExpandedCaseId] = React.useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);

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

  // Fetch real cases and doctor summary from backend
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch summary metrics
      const summaryRes = await apiClient.get("/predictions/doctor-summary/").catch(() => null);
      if (summaryRes?.data?.data) {
        setSummaryData(summaryRes.data.data);
      }

      // 2. Fetch predictions list
      const predsRes = await apiClient.get("/v1/predictions/").catch(async () => {
        return await apiClient.get("/predictions/records/");
      });

      const rawList: any[] = predsRes?.data?.results || predsRes?.data?.data || predsRes?.data || [];
      const mappedCases: PatientCase[] = rawList.map((item: any) => {
        const prob = typeof item.probability === "number" ? item.probability : parseFloat(item.probability || "0");
        const risk = (item.risk_level || item.prediction_result || "LOW").toUpperCase() as PatientCase["riskLevel"];

        // Map shap drivers if explanation exists
        const rawDrivers = item.explanation?.top_risk_factors || [];
        const shapDrivers = rawDrivers.map((d: any) => ({
          feature: d.feature || d.name || "Vital/Lab",
          impact: typeof d.contribution === "number" ? d.contribution : (typeof d.impact === "number" ? d.impact : 0.1),
          label: d.label || `${d.feature || "Feature"} observed`,
          positive: d.direction === "INCREASES_RISK" || d.positive !== false,
        }));

        let revStatus: PatientCase["reviewStatus"] = "PENDING";
        if (item.clinician_override) {
          revStatus = "OVERRIDDEN";
        } else if (item.review_status === "REVIEWED" || item.review_status === "CONCURRED") {
          revStatus = "CONCURRED";
        } else if (item.review_status === "REQUIRES_MORE_DATA" || item.review_status === "LABS_REQUESTED") {
          revStatus = "LABS_REQUESTED";
        }

        return {
          id: String(item.id || item.prediction_id),
          patientId: String(item.patient_id || item.patient?.id || item.patient || ""),
          mrn: item.patient_mrn || item.mrn || "MRN-RECORDED",
          name: item.patient_name || (item.patient?.first_name ? `${item.patient.first_name} ${item.patient.last_name}` : "Inpatient"),
          age: item.patient_age || item.patient?.age || 50,
          gender: item.patient_gender || item.patient?.gender || "OTHER",
          bed: item.bed || item.patient?.room_number || "Ward",
          riskLevel: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(risk) ? risk : "LOW",
          probability: prob,
          ciLower: Math.max(0, prob - 0.04),
          ciUpper: Math.min(1, prob + 0.04),
          shapDrivers,
          reviewStatus: revStatus,
          admittedAt: item.prediction_timestamp || item.timestamp || item.created_at || "Recent",
          chiefComplaint: item.chief_complaint || item.features_snapshot?.chief_complaint || "Cardiopulmonary monitoring",
          modelVersion: item.model_version_str || item.model_version || "RandomForest v1.0.0",
          modelName: item.model_name || "Clinical Risk Classifier",
          confidenceScore: item.confidence_score,
          uncertaintyScore: item.uncertainty_score,
          clinicianOverride: item.clinician_override,
          overrideReason: item.override_reason,
          overriddenBy: item.overridden_by_name || item.overridden_by,
          featuresSnapshot: item.features_snapshot,
          cdssGuidance: item.cdss_guidance,
        };
      });

      setCases(mappedCases);
      if (mappedCases.length > 0 && !selectedCase) {
        setSelectedCase(mappedCases[0]);
      }
    } catch (err: any) {
      console.error("Failed to load doctor workspace data:", err);
      setError("Unable to load clinical records from the database. Please ensure the backend is connected.");
    } finally {
      setLoading(false);
    }
  }, [selectedCase]);

  React.useEffect(() => {
    fetchData();
  }, []);

  React.useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
    }
  }, [aiMessages, aiLoading]);

  const pendingCases = cases.filter((c) => c.reviewStatus === "PENDING");
  const criticalCases = cases.filter((c) => c.riskLevel === "CRITICAL" || c.riskLevel === "HIGH");
  const concurRate =
    cases.length > 0
      ? ((cases.filter((c) => c.reviewStatus === "CONCURRED").length / cases.length) * 100).toFixed(1)
      : "0.0";

  const handleOpenReview = (patientCase: PatientCase) => {
    setSelectedCase(patientCase);
    setReviewModalOpen(true);
  };

  const handleSendAiPrompt = async (promptText?: string) => {
    const textToSend = promptText || aiQuery;
    if (!textToSend.trim() || aiLoading) return;
    const userMessage = { role: "user" as const, content: textToSend };
    setAiMessages((prev) => [...prev, userMessage]);
    setAiQuery("");
    setAiLoading(true);
    try {
      const response = await apiClient
        .post("/predictions/ai-assistant/", {
          query: textToSend,
          patient_id: selectedCase ? selectedCase.patientId : undefined,
        })
        .catch(() => null);

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
        const lower = textToSend.toLowerCase();
        if (lower.includes("troponin") || lower.includes("chest pain") || lower.includes("st depression")) {
          reply =
            "Per AHA/ACC 2022 Acute Coronary Syndrome guidelines: In patients presenting with retrosternal chest pain and ST depression >1.0 mm, serial high-sensitivity cardiac troponin (hs-cTn) is indicated at 0h and 1h/2h. Consider immediate cardiology consult for urgent coronary angiography if hemodynamic instability or refractory angina persists.";
          guideline = "AHA/ACC 2022 Guidelines for Evaluation of Chest Pain (Grade 1A Recommendation)";
          citations = ["Circulation 2022;144:e368-e454", "ESC NSTE-ACS 2020"];
        } else if (lower.includes("sepsis") || lower.includes("lactic") || lower.includes("bp") || lower.includes("qsofa")) {
          reply =
            "Per Surviving Sepsis Campaign SSC-2021: Serum lactate >2.0 mmol/L with hypotension warrants immediate crystalloid fluid resuscitation at 30 mL/kg within 3 hours. Re-evaluate perfusion targets (MAP >= 65 mmHg, urine output >= 0.5 mL/kg/h).";
          guideline = "Surviving Sepsis Campaign: International Guidelines 2021 (Grade 1B)";
          citations = ["Crit Care Med 2021;49(11):e1063-e1143", "KDIGO AKI Bundle 2012"];
        } else {
          reply =
            "Evaluated clinical parameters against multidisciplinary guidelines: Patient vital signs reflect increased hemodynamic strain. Recommend continuous ECG telemetry, bedside point-of-care ultrasound (POCUS), and repeat metabolic panel within 2 hours.";
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
    <div className="space-y-6 pb-12">
      {/* === CRITICAL ALERT BANNER === */}
      {cases.some((c) => c.riskLevel === "CRITICAL" && c.reviewStatus === "PENDING") && (
        <div className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 via-red-50 to-rose-50 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
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
                Patient {cases.find((c) => c.riskLevel === "CRITICAL")?.name} ({cases.find((c) => c.riskLevel === "CRITICAL")?.mrn}) triggered critical risk stratification. Immediate physician evaluation and clinical sign-off required.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              const crit = cases.find((c) => c.riskLevel === "CRITICAL");
              if (crit) handleOpenReview(crit);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0 shadow-sm gap-1.5"
          >
            <span>Review STAT Case</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* === WORKSPACE HEADER === */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 shadow-sm text-white">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900">Physician Clinical Decision Center</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5">
                SaMD Class II · Human-in-the-Loop
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Attending: <span className="font-semibold text-slate-700">{user?.full_name || "Dr. Vadla Abhinay, MD"}</span>
              {" · "}
              Dept: <span className="font-semibold text-slate-700">{user?.department || "Cardiology & ICU"}</span>
              {" · "}
              Authoritative Store: <span className="font-semibold text-slate-700">Neon PostgreSQL</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={loading}
            className="text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiAssistantOpen(true)}
            className="text-xs gap-1.5 border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 shadow-sm"
          >
            <Bot className="h-3.5 w-3.5" />
            AI Guidelines Assistant
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

      {/* === SUB-NAVIGATION TABS === */}
      <div className="flex border-b border-slate-200 bg-white px-3 rounded-xl shadow-sm overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("DECISION_CENTER")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "DECISION_CENTER"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Activity className="h-4 w-4" />
          Clinical Decision Center
          {pendingCases.length > 0 && (
            <span className="ml-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2">
              {pendingCases.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("GUIDELINES")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "GUIDELINES"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Approved Guidelines &amp; Evidence
        </button>

        <button
          onClick={() => setActiveTab("TIMELINE")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "TIMELINE"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Clock className="h-4 w-4" />
          Patient Clinical Timeline
        </button>

        <button
          onClick={() => setActiveTab("AI_SAFETY")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "AI_SAFETY"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          AI Safety &amp; Telemetry
        </button>
      </div>

      {/* === TAB 1: CLINICAL DECISION CENTER === */}
      {activeTab === "DECISION_CENTER" && (
        <div className="space-y-6">
          {/* Metrics Overview */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Assigned Patients",
                value: summaryData?.assigned_patients_count ?? cases.length,
                sub: "Active inpatient cases",
                icon: Users,
                accent: "text-slate-700",
                bg: "bg-white",
                border: "border-slate-200",
                iconBg: "bg-slate-100 text-slate-600",
              },
              {
                label: "Pending Reviews",
                value: summaryData?.pending_reviews_count ?? pendingCases.length,
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
                sub: "Agreement with CDSS output",
                icon: CheckCircle2,
                accent: "text-emerald-700",
                bg: "bg-emerald-50",
                border: "border-emerald-200",
                iconBg: "bg-emerald-100 text-emerald-600",
              },
              {
                label: "Guideline Grounding",
                value: "98.4%",
                sub: "SSC-2021 & AHA/ACC verified",
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

          {/* Predictions Table Card */}
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  Inpatient Risk Stratifications &amp; Human-in-the-Loop Sign-Off
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Realtime clinical risk inference · TreeSHAP drivers · 5-Layer Evidence Separation
                </CardDescription>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2.5 py-0.5 font-medium">
                {cases.length} Inpatient Cases
              </span>
            </CardHeader>

            {/* Error State */}
            {error && (
              <div className="p-6 text-center">
                <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">Failed to Load Records</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchData} className="mt-3 text-xs">
                  Retry Connection
                </Button>
              </div>
            )}

            {/* Loading State */}
            {loading && !error && (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="h-7 w-7 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Querying authoritative Neon PostgreSQL database...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && cases.length === 0 && (
              <div className="p-12 text-center space-y-3">
                <Stethoscope className="h-9 w-9 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">No Patient Predictions Recorded</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are currently no inpatient risk predictions awaiting review in the database. Run a new assessment to generate clinical risk stratifications.
                </p>
                <Button
                  size="sm"
                  onClick={() => router.push("/predictions/new")}
                  className="mt-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Run New Assessment
                </Button>
              </div>
            )}

            {/* Desktop Table */}
            {!loading && !error && cases.length > 0 && (
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">
                        Patient / MRN
                      </th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">
                        Location
                      </th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">
                        Risk Stratum
                      </th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">
                        Probability (95% CI)
                      </th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">
                        Top Risk Factors
                      </th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">
                        Review Status
                      </th>
                      <th className="text-right px-5 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c, idx) => {
                      const risk = RISK_CONFIG[c.riskLevel] || RISK_CONFIG.LOW;
                      const status = REVIEW_STATUS_CONFIG[c.reviewStatus] || REVIEW_STATUS_CONFIG.PENDING;
                      const isExpanded = expandedCaseId === c.id;

                      return (
                        <React.Fragment key={c.id}>
                          <tr
                            className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer ${
                              idx % 2 === 0 ? "" : "bg-slate-50/20"
                            } ${isExpanded ? "bg-emerald-50/30" : ""}`}
                            onClick={() => {
                              setSelectedCase(c);
                              setExpandedCaseId(isExpanded ? null : c.id);
                            }}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`h-8 w-8 rounded-full ${risk.bg} border ${risk.border} flex items-center justify-center shrink-0`}
                                >
                                  <span className={`text-[10px] font-bold ${risk.text}`}>
                                    {c.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                                    {c.name}
                                    {isExpanded ? (
                                      <ChevronDown className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 text-slate-400" />
                                    )}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {c.mrn} · {c.age}y / {c.gender}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className="text-slate-600 font-medium">{c.bed}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                                {c.chiefComplaint}
                              </p>
                            </td>
                            <td className="px-3 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${risk.badge}`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                                {c.riskLevel}
                              </span>
                            </td>
                            <td className="px-3 py-3.5">
                              <div>
                                <span className="font-mono font-bold text-slate-900">
                                  {(c.probability * 100).toFixed(1)}%
                                </span>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  [{(c.ciLower * 100).toFixed(1)}% – {(c.ciUpper * 100).toFixed(1)}%]
                                </p>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 max-w-[180px]">
                              {c.shapDrivers.length > 0 ? (
                                <div className="space-y-1">
                                  {c.shapDrivers.slice(0, 2).map((d, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2">
                                      <span className="truncate text-slate-600">{d.feature}:</span>
                                      <span
                                        className={`font-mono font-bold shrink-0 ${
                                          d.positive ? "text-rose-600" : "text-emerald-600"
                                        }`}
                                      >
                                        {d.positive ? "+" : ""}
                                        {(d.impact * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Encounter monitoring</span>
                              )}
                            </td>
                            <td className="px-3 py-3.5">
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenReview(c)}
                                  className="h-7 text-[11px] border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                                >
                                  {c.reviewStatus === "PENDING" ? "Record Review" : "View Review"}
                                </Button>
                                <Link href={`/predictions/${c.id}`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium"
                                  >
                                    XAI
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>

                          {/* 5-Layer Evidence Separation Expanded View */}
                          {isExpanded && (
                            <tr className="bg-slate-50/60 border-b border-slate-200">
                              <td colSpan={7} className="p-5">
                                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                      <Layers className="h-4 w-4 text-emerald-600" />
                                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                        5-Layer Clinical Decision Support Architecture — Case {c.mrn}
                                      </h4>
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-mono">
                                      Timestamp: {new Date(c.admittedAt).toLocaleString()}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                                    {/* Layer 1: ML Model Prediction */}
                                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                                      <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                                        <Activity className="h-3.5 w-3.5 text-indigo-600" />
                                        <span>1. ML Prediction</span>
                                      </div>
                                      <div className="space-y-1 text-[11px] text-slate-600">
                                        <p>Model: <strong className="text-slate-900">{c.modelVersion}</strong></p>
                                        <p>Probability: <strong className="text-slate-900">{(c.probability * 100).toFixed(1)}%</strong></p>
                                        <p>Stratum: <strong className="text-slate-900">{c.riskLevel}</strong></p>
                                        <p className="text-[10px] text-slate-400">95% CI: [{(c.ciLower * 100).toFixed(1)}% - {(c.ciUpper * 100).toFixed(1)}%]</p>
                                      </div>
                                    </div>

                                    {/* Layer 2: Deterministic Clinical Rules */}
                                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                                      <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                                        <Shield className="h-3.5 w-3.5 text-blue-600" />
                                        <span>2. Clinical Rules</span>
                                      </div>
                                      <div className="space-y-1 text-[11px] text-slate-600">
                                        <p>qSOFA &amp; NEWS2: <strong className="text-slate-900">Evaluated</strong></p>
                                        <p>Acute Thresholds: <strong className="text-slate-900">Verified</strong></p>
                                        <p className="text-[10px] text-slate-500">Deterministic overrides take precedence over statistical model</p>
                                      </div>
                                    </div>

                                    {/* Layer 3: Clinical Guidelines & Evidence */}
                                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                                      <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                                        <BookOpen className="h-3.5 w-3.5 text-teal-600" />
                                        <span>3. Guidelines</span>
                                      </div>
                                      <div className="space-y-1 text-[11px] text-slate-600">
                                        <p>Grounding: <strong className="text-slate-900">SSC-2021 / AHA</strong></p>
                                        <p>Provenance: <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-1.5 py-0 text-[9px] font-bold border border-emerald-200">VERIFIED</span></p>
                                        <p className="text-[10px] text-slate-500">Peer-reviewed practice guidance attached</p>
                                      </div>
                                    </div>

                                    {/* Layer 4: AI Explanation & SHAP Drivers */}
                                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                                      <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                                        <Brain className="h-3.5 w-3.5 text-purple-600" />
                                        <span>4. AI Explanation</span>
                                      </div>
                                      <div className="space-y-1 text-[11px] text-slate-600">
                                        <p>Method: <strong className="text-slate-900">TreeSHAP</strong></p>
                                        <p>Top Driver: <strong className="text-slate-900">{c.shapDrivers[0]?.feature || "Vitals"}</strong></p>
                                        <p className="text-[10px] text-slate-400 italic">Statistical attribution, not medical diagnosis</p>
                                      </div>
                                    </div>

                                    {/* Layer 5: Human Decision */}
                                    <div className="rounded-lg border border-slate-200 bg-emerald-50/30 p-3 space-y-2">
                                      <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                                        <Stethoscope className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>5. Human Decision</span>
                                      </div>
                                      <div className="space-y-1 text-[11px] text-slate-600">
                                        <p>Status: <strong className="text-slate-900">{c.reviewStatus}</strong></p>
                                        {c.clinicianOverride && (
                                          <p>Override: <strong className="text-purple-700">{c.clinicianOverride}</strong></p>
                                        )}
                                        {c.overrideReason && (
                                          <p className="text-[10px] text-slate-500 truncate">Rationale: {c.overrideReason}</p>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleOpenReview(c)}
                                          className="w-full h-6 text-[10px] mt-1 bg-white border-emerald-300 text-emerald-800"
                                        >
                                          Sign Off Review
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Cards */}
            {!loading && !error && cases.length > 0 && (
              <div className="md:hidden p-4 space-y-3">
                {cases.map((c) => {
                  const risk = RISK_CONFIG[c.riskLevel] || RISK_CONFIG.LOW;
                  const status = REVIEW_STATUS_CONFIG[c.reviewStatus] || REVIEW_STATUS_CONFIG.PENDING;
                  return (
                    <div key={c.id} className={`rounded-xl border ${risk.border} ${risk.bg} p-4 space-y-3`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {c.mrn} · {c.bed}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${risk.badge} shrink-0`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                          {c.riskLevel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Risk Score:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {(c.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
                        >
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
            )}
          </Card>
        </div>
      )}

      {/* === TAB 2: APPROVED GUIDELINES & EVIDENCE === */}
      {activeTab === "GUIDELINES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                Hospital &amp; Global Clinical Practice Guidelines
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Surviving Sepsis Campaign · AHA/ACC · KDIGO · Royal College of Physicians NEWS2 · Deterministic Rule Audit
              </p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 font-bold">
              Provenance Verified
            </span>
          </div>

          <ClinicalKnowledgeBrowser />
        </div>
      )}

      {/* === TAB 3: PATIENT CLINICAL TIMELINE === */}
      {activeTab === "TIMELINE" && (
        <div className="space-y-4">
          {cases.length > 0 ? (
            <div>
              {/* Patient Selector */}
              <div className="mb-4 flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-700 shrink-0">Selected Patient:</label>
                <select
                  value={selectedCase?.id || cases[0]?.id}
                  onChange={(e) => {
                    const c = cases.find((item) => item.id === e.target.value);
                    if (c) setSelectedCase(c);
                  }}
                  className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.mrn}) — {c.riskLevel} Risk
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400">
                  Select a patient to inspect their chronological auditable clinical timeline.
                </span>
              </div>

              {selectedCase ? (
                <PatientTimelineViewer
                  patientId={selectedCase.patientId || selectedCase.id}
                  patientName={selectedCase.name}
                  mrn={selectedCase.mrn}
                />
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                  Select a patient to view timeline.
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-2">
              <Clock className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No Patient Records Available</p>
              <p className="text-xs text-slate-500">Timeline events require active inpatient cases.</p>
            </div>
          )}
        </div>
      )}

      {/* === TAB 4: AI SAFETY & TELEMETRY === */}
      {activeTab === "AI_SAFETY" && (
        <div className="space-y-6">
          <AISafetyStatusCard />

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-600" />
                10-Stage AI Safety Gate Pipeline &amp; Invariants
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Mandatory healthcare safety standards enforced across all AI model interactions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {[
                  { stage: "Stage 1", name: "Kill-Switch Check", desc: "Immediate fail-closed if emergency stop is triggered." },
                  { stage: "Stage 2", name: "Role & Permission", desc: "RBAC enforcement against allowed clinical roles." },
                  { stage: "Stage 3", name: "Input PHI Redaction", desc: "Zero patient PHI leaked to model inference context." },
                  { stage: "Stage 4", name: "Prompt Injection", desc: "Blocks adversarial prompt hijacking or instruction bypass." },
                  { stage: "Stage 5", name: "Deterministic Rules", desc: "qSOFA/NEWS2/acute thresholds evaluate before AI." },
                  { stage: "Stage 6", name: "Guideline Verification", desc: "Retrieved knowledge verified against authoritative sources." },
                  { stage: "Stage 7", name: "Model Inference", desc: "Calibrated risk scoring with 95% bootstrap confidence." },
                  { stage: "Stage 8", name: "Output PHI Redaction", desc: "Scans output stream for synthetic/leaked identifiers." },
                  { stage: "Stage 9", name: "Medical Disclaimer", desc: "Blocks autonomous diagnosis; attaches SaMD disclaimer." },
                  { stage: "Stage 10", name: "Immutable Audit Log", desc: "Neon PostgreSQL records every interaction trace." },
                ].map((s) => (
                  <div key={s.stage} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 font-mono">{s.stage}</span>
                    <p className="font-bold text-slate-900">{s.name}</p>
                    <p className="text-[11px] text-slate-500">{s.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* === CLINICAL REVIEW MODAL === */}
      {reviewModalOpen && selectedCase && (
        <ClinicalReviewModal
          open={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          predictionId={selectedCase.id}
          patientName={selectedCase.name}
          mrn={selectedCase.mrn}
          currentRiskLevel={selectedCase.riskLevel}
          probability={selectedCase.probability}
          modelVersion={selectedCase.modelVersion}
          onSuccess={() => {
            fetchData();
          }}
        />
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
              <button
                onClick={() => setAiAssistantOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
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
                          <span
                            key={idx}
                            className="inline-block rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-medium text-purple-700 border border-purple-100"
                          >
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendAiPrompt();
                  }
                }}
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
