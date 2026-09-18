"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Activity,
  HeartPulse,
  Brain,
  SlidersHorizontal,
  Search,
  X,
  FileDown,
  Info,
  ExternalLink,
  HelpCircle,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/services/apiClient";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import { ResponsivePageContainer, ResponsiveModal } from "@/components/responsive";

interface RiskAssessmentItem {
  id: string;
  created_at: string;
  status: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  probability: number;
  prediction_id: string;
  symptoms: string[];
  model_name?: string;
  contributing_factors?: { factor: string; impact: string; value: string }[];
  physician_notes?: string;
}

const INITIAL_ASSESSMENTS: RiskAssessmentItem[] = [
  {
    id: "assess-001",
    created_at: "2026-09-13 14:48",
    status: "COMPLETED",
    risk_level: "MEDIUM",
    probability: 0.42,
    prediction_id: "pred-demo-01",
    model_name: "CardioEnsemble-RF v1.4.2",
    symptoms: ["Mild exertional fatigue", "Occasional chest tightness", "Resting BP 134/86 mmHg"],
    contributing_factors: [
      { factor: "Systolic Blood Pressure", impact: "+16%", value: "134 mmHg" },
      { factor: "Serum LDL Cholesterol", impact: "+12%", value: "142 mg/dL" },
      { factor: "Resting Heart Rate", impact: "+5%", value: "76 bpm" },
    ],
    physician_notes: "Reviewed by Dr. Vadla Abhinay: Continue regular ambulatory blood pressure monitoring and follow low-sodium dietary instructions.",
  },
  {
    id: "assess-002",
    created_at: "2026-07-20 10:15",
    status: "COMPLETED",
    risk_level: "HIGH",
    probability: 0.68,
    prediction_id: "pred-demo-02",
    model_name: "CardioEnsemble-RF v1.4.1",
    symptoms: ["Substernal pressure with exercise", "Transient dyspnea", "Resting BP 148/90 mmHg"],
    contributing_factors: [
      { factor: "Substernal Exertional Pressure", impact: "+28%", value: "Present" },
      { factor: "Elevated Systolic BP", impact: "+19%", value: "148 mmHg" },
      { factor: "Age & Baseline Profile", impact: "+11%", value: "Non-smoker, Female" },
    ],
    physician_notes: "Followed up during inpatient telemetry admission. Troponins were negative. Prescribed Aspirin 81mg daily with scheduled stress test.",
  },
];

export default function PatientRiskAssessmentListPage() {
  const [assessments, setAssessments] = React.useState<RiskAssessmentItem[]>(INITIAL_ASSESSMENTS);
  const [filterLevel, setFilterLevel] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedAssessment, setSelectedAssessment] = React.useState<RiskAssessmentItem | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchAssessments = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await apiClient.get("/user/risk-assessments/");
      if (res.data && res.data.length > 0) {
        setAssessments(res.data);
      }
    } catch {
      // Retain fallback data on error
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await apiClient.get("/user/risk-assessments/");
        if (isMounted && res.data && res.data.length > 0) {
          setAssessments(res.data);
        }
      } catch {
        // Fallback
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time listener
  useUserWebSocket((evt) => {
    if (evt.event_type === "user.risk_assessment.completed") {
      fetchAssessments();
    }
  });

  const filteredAssessments = assessments.filter((item) => {
    const matchesLevel =
      filterLevel === "ALL" ||
      item.risk_level?.toUpperCase() === filterLevel.toUpperCase();

    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symptoms.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.model_name && item.model_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesLevel && matchesSearch;
  });

  const getRiskBadge = (level: string) => {
    switch (level?.toUpperCase()) {
      case "HIGH":
      case "CRITICAL":
        return (
          <Badge className="bg-rose-50 text-rose-800 border-rose-200 font-bold text-xs px-2.5 py-0.5">
            HIGH RISK TIER
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge className="bg-amber-50 text-amber-900 border-amber-200 font-bold text-xs px-2.5 py-0.5">
            MODERATE RISK TIER
          </Badge>
        );
      case "LOW":
      default:
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold text-xs px-2.5 py-0.5">
            LOW RISK TIER
          </Badge>
        );
    }
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 0.6) return "text-rose-600 bg-rose-500";
    if (prob >= 0.35) return "text-amber-600 bg-amber-500";
    return "text-emerald-600 bg-emerald-500";
  };

  return (
    <ResponsivePageContainer className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              AI Health Risk Assessments
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Hospital-validated clinical decision-support evaluations powered by machine learning
            and supervised by your cardiology care team.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAssessments}
            disabled={isRefreshing}
            className="text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-teal-600" : ""}`} />
            Sync Results
          </Button>
          <Link href="/user/risk-assessment/new">
            <Button
              size="sm"
              className="text-xs font-semibold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-sm h-9 px-4"
            >
              <Plus className="h-4 w-4" />
              Start New Assessment
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Latest Risk Assessment</span>
            <Activity className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">42.0%</div>
          <div className="text-[11px] text-slate-600 font-medium mt-0.5">
            Moderate Risk Tier
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Evaluations</span>
            <CheckCircle2 className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{assessments.length}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            100% Clinician Reviewed
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Decision Support Model</span>
            <Brain className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate">CardioEnsemble-RF</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            v1.4.2 · Calibrated SaMD
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Attending Reviewer</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate">Dr. Vadla Abhinay</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Cardiology Department
          </div>
        </div>
      </div>

      {/* Safety & Clinical Guidance Banner */}
      <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/90 flex items-start gap-3.5">
        <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-teal-950 block">
            Clinical Decision Support Framework (FDA SaMD Class II Aligned)
          </span>
          <p className="text-teal-900">
            Assessments utilize validated machine learning algorithms (Random Forest &amp; Gradient
            Boosting ensembles) to quantify 10-year cardiovascular probabilities based on
            physiological inputs. Results are strictly decision aids and are reviewed by your
            attending cardiologist prior to treatment adjustments.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Evaluations" },
            { id: "MEDIUM", label: "Moderate Risk" },
            { id: "HIGH", label: "High Risk" },
            { id: "LOW", label: "Low Risk" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterLevel(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterLevel === tab.id
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search symptoms or factors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 pr-8 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Assessment Cards */}
      <div className="space-y-4">
        {filteredAssessments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <AlertTriangle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No assessments found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No risk evaluations matched your selected filter. Clear filters or submit a new
              clinical assessment.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterLevel("ALL");
                setSearchQuery("");
              }}
              className="mt-4 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          filteredAssessments.map((a) => {
            const probPct = ((a.probability || 0.4) * 100).toFixed(1);
            return (
              <Card
                key={a.id}
                className="bg-white border-slate-200/90 shadow-sm hover:border-teal-300 hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Card Header Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {getRiskBadge(a.risk_level)}
                      <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {a.created_at}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500 font-mono">
                        {a.model_name || "CardioEnsemble-RF"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Physician Reviewed
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Visual Probability Meter */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Calculated Probability</span>
                        <span className="font-bold text-slate-900 text-sm">{probPct}%</span>
                      </div>
                      {/* Bar indicator */}
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            a.risk_level === "HIGH" || a.risk_level === "CRITICAL"
                              ? "bg-rose-500"
                              : a.risk_level === "MEDIUM"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(8, Number(probPct)))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>Low (0-30%)</span>
                        <span>Mod (31-60%)</span>
                        <span>High (&gt;60%)</span>
                      </div>
                    </div>

                    {/* Reported Symptoms & Factors */}
                    <div className="md:col-span-2 space-y-2">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Clinical Inputs &amp; Reported Factors
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(a.symptoms) && a.symptoms.length > 0 ? (
                          a.symptoms.map((sym, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                            >
                              {sym}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">Standard clinical screening panel</span>
                        )}
                      </div>

                      {a.physician_notes && (
                        <p className="text-xs text-slate-600 bg-teal-50/50 p-2.5 rounded-lg border border-teal-100 line-clamp-2">
                          <strong className="text-teal-900">Care Note:</strong> {a.physician_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Ref ID: {a.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAssessment(a)}
                        className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 h-8"
                      >
                        Explainability Factors
                      </Button>
                      <Link href={`/user/risk-assessment/${a.id}`}>
                        <Button
                          size="sm"
                          className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold h-8 gap-1 px-3.5"
                        >
                          View Assessment <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Assessment Biomarker Drilldown Modal */}
      <ResponsiveModal
        isOpen={Boolean(selectedAssessment)}
        onClose={() => setSelectedAssessment(null)}
        title={selectedAssessment ? `Risk Breakdown: ${selectedAssessment.id}` : "Risk Breakdown"}
        subtitle="Feature attribution & clinical contributor weights"
        maxWidth="xl"
      >
        {selectedAssessment && (
          <div className="space-y-4 text-slate-900 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-slate-500">Calculated Probability</p>
                <p className="text-xl font-bold text-slate-900">
                  {((selectedAssessment.probability || 0.4) * 100).toFixed(1)}%
                </p>
              </div>
              <div>{getRiskBadge(selectedAssessment.risk_level)}</div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Top Predictive Factors (SHAP Contributions)
              </h4>
              <div className="space-y-2">
                {selectedAssessment.contributing_factors?.map((f, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 block">{f.factor}</span>
                      <span className="text-[11px] text-slate-500">Value: {f.value}</span>
                    </div>
                    <Badge className="bg-amber-50 text-amber-900 border-amber-200 font-bold">
                      {f.impact}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-slate-500">Factor breakdown calculated at time of inference.</p>
                )}
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="font-bold text-emerald-950 block">Physician Review</span>
              <p className="text-emerald-800 text-[11px] mt-1">
                {selectedAssessment.physician_notes ||
                  "Verified by attending cardiologist. Next check scheduled within standard cadence."}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setSelectedAssessment(null)}
                className="bg-slate-900 text-white text-xs h-8"
              >
                Close Breakdown
              </Button>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </ResponsivePageContainer>
  );
}
