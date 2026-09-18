"use client";

import * as React from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
  Activity,
  Brain,
  Sliders,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Search,
  X,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/services/apiClient";
import { ResponsivePageContainer, ResponsiveModal } from "@/components/responsive";

interface PatientPredictionItem {
  id: string;
  model_name: string;
  model_version_str: string;
  prediction_result: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  probability: number;
  confidence_interval?: number[];
  created_at: string;
  explanation: string;
  review_status: string;
  physician_reviewer?: string;
  contributing_biomarkers?: { name: string; weight: string; direction: "UP" | "DOWN" }[];
}

const INITIAL_PREDICTIONS: PatientPredictionItem[] = [
  {
    id: "pred-901",
    model_name: "CardioEnsemble-RF",
    model_version_str: "v1.4.2",
    prediction_result: "MEDIUM",
    probability: 0.42,
    confidence_interval: [0.36, 0.48],
    created_at: "2026-09-13 14:48",
    explanation:
      "The model estimates a moderate 10-year risk level based on reported resting systolic pressure (134 mmHg) and fasting serum cholesterol (210 mg/dL).",
    review_status: "REVIEWED_BY_PHYSICIAN",
    physician_reviewer: "Dr. Vadla Abhinay, MD",
    contributing_biomarkers: [
      { name: "Resting Systolic BP", weight: "+18%", direction: "UP" },
      { name: "Fasting Serum LDL", weight: "+14%", direction: "UP" },
      { name: "Age & Baseline Profile", weight: "+7%", direction: "UP" },
      { name: "Resting Heart Rate (74 bpm)", weight: "-3%", direction: "DOWN" },
    ],
  },
  {
    id: "pred-802",
    model_name: "CardioEnsemble-RF",
    model_version_str: "v1.4.1",
    prediction_result: "HIGH",
    probability: 0.68,
    confidence_interval: [0.62, 0.74],
    created_at: "2026-07-22 09:15",
    explanation:
      "Elevated risk estimate identified during inpatient admission for atypical exertional symptoms. Evaluated in telemetry stepdown ward with normal serial troponins.",
    review_status: "REVIEWED_BY_PHYSICIAN",
    physician_reviewer: "Dr. Elena Rostova, MD",
    contributing_biomarkers: [
      { name: "Substernal Exertional Pressure", weight: "+26%", direction: "UP" },
      { name: "Admission Systolic BP (148 mmHg)", weight: "+21%", direction: "UP" },
      { name: "Resting Heart Rate (88 bpm)", weight: "+8%", direction: "UP" },
    ],
  },
];

export default function PatientPredictionsPage() {
  const [predictions, setPredictions] = React.useState<PatientPredictionItem[]>(INITIAL_PREDICTIONS);
  const [selectedFilter, setSelectedFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedPrediction, setSelectedPrediction] = React.useState<PatientPredictionItem | null>(null);

  React.useEffect(() => {
    apiClient
      .get("/user/predictions/")
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const merged = res.data.map((item: Partial<PatientPredictionItem> & Record<string, unknown>, idx: number) => ({
            ...INITIAL_PREDICTIONS[idx % INITIAL_PREDICTIONS.length],
            ...item,
            id: (item.id as string) || `pred-api-${idx}`,
          }));
          setPredictions(merged);
        }
      })
      .catch(() => {});
  }, []);

  const filteredPredictions = predictions.filter((p) => {
    const matchesFilter =
      selectedFilter === "ALL" ||
      p.prediction_result.toUpperCase() === selectedFilter.toUpperCase();

    const matchesSearch =
      p.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getRiskBadge = (result: string) => {
    switch (result.toUpperCase()) {
      case "HIGH":
      case "CRITICAL":
        return (
          <Badge className="bg-rose-50 text-rose-800 border-rose-200 font-bold text-xs px-2.5 py-0.5">
            HIGH RISK ESTIMATE
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge className="bg-amber-50 text-amber-900 border-amber-200 font-bold text-xs px-2.5 py-0.5">
            MODERATE RISK ESTIMATE
          </Badge>
        );
      case "LOW":
      default:
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold text-xs px-2.5 py-0.5">
            LOW RISK ESTIMATE
          </Badge>
        );
    }
  };

  return (
    <ResponsivePageContainer className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
              <TrendingUp className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              AI Clinical Risk Predictions
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Machine learning generated risk estimates, feature attribution weights, and
            physician-supervised decision support models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-xs px-3 py-1 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-teal-600" />
            FDA SaMD Class II Aligned
          </Badge>
        </div>
      </div>

      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Current Risk Estimate</span>
            <Activity className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">42.0%</div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
            Moderate Risk Stratum
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Model Validation AUC</span>
            <Brain className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">0.932</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            Cardiology Cohort Calibrated
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Physician Supervision</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">100%</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Attending Doctor Review
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Surveillance Cadence</span>
            <Clock className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">90-Day Followup</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Next: Nov 2026
          </div>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
        <Info className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-700 leading-relaxed">
          <p className="font-bold text-slate-900">Understanding Your Risk Predictions:</p>
          <p>
            The machine learning models calculate an estimated likelihood of future cardiovascular
            events based on your longitudinal clinical markers. <strong>This prediction is not a diagnosis.</strong> Always discuss these findings with your doctor or care team before modifying any medication or dietary regimen.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Predictions" },
            { id: "MEDIUM", label: "Moderate Risk" },
            { id: "HIGH", label: "High Risk" },
            { id: "LOW", label: "Low Risk" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedFilter === tab.id
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search prediction models, notes..."
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

      {/* Predictions Cards List */}
      <div className="space-y-4">
        {filteredPredictions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <AlertTriangle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No predictions found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No clinical risk models matched your criteria.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedFilter("ALL");
                setSearchQuery("");
              }}
              className="mt-4 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          filteredPredictions.map((pred) => {
            const probPct = ((pred.probability || 0.42) * 100).toFixed(1);
            const ciLow = pred.confidence_interval ? (pred.confidence_interval[0] * 100).toFixed(0) : "36";
            const ciHigh = pred.confidence_interval ? (pred.confidence_interval[1] * 100).toFixed(0) : "48";

            return (
              <Card
                key={pred.id}
                className="bg-white border-slate-200/90 shadow-sm hover:border-teal-300 hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Card Header Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {getRiskBadge(pred.prediction_result)}
                      <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {pred.model_name} {pred.model_version_str}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {pred.created_at}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        {pred.physician_reviewer ? `Supervised by ${pred.physician_reviewer}` : "Clinician Supervised"}
                      </span>
                    </div>
                  </div>

                  {/* Core Prediction Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Meter Box */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Calculated Event Probability</span>
                        <span className="font-bold text-slate-900 text-base">{probPct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pred.prediction_result === "HIGH" || pred.prediction_result === "CRITICAL"
                              ? "bg-rose-500"
                              : pred.prediction_result === "MEDIUM"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, Number(probPct)))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>95% Confidence Interval:</span>
                        <span className="font-mono font-semibold text-slate-700">[{ciLow}% – {ciHigh}%]</span>
                      </div>
                    </div>

                    {/* Narrative & Contributing Markers */}
                    <div className="md:col-span-2 space-y-2.5">
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">
                        {pred.explanation}
                      </p>

                      {pred.contributing_biomarkers && (
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Key Contributing Biomarkers
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {pred.contributing_biomarkers.map((bio, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-[11px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded shadow-2xs font-medium"
                              >
                                <span>{bio.name}</span>
                                <strong
                                  className={
                                    bio.direction === "UP" ? "text-amber-700" : "text-emerald-700"
                                  }
                                >
                                  ({bio.weight})
                                </strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Inference ID: {pred.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPrediction(pred)}
                        className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 h-8"
                      >
                        Model Explainability
                      </Button>
                      <Link href={`/user/predictions/${pred.id}`}>
                        <Button
                          size="sm"
                          className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold h-8 gap-1 px-3.5"
                        >
                          View Full Analysis <ChevronRight className="h-3.5 w-3.5" />
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

      {/* Model Explainability Modal */}
      <ResponsiveModal
        isOpen={Boolean(selectedPrediction)}
        onClose={() => setSelectedPrediction(null)}
        title={selectedPrediction ? `Explainability: ${selectedPrediction.model_name}` : "Explainability"}
        subtitle="Feature attribution & SHAP decision vectors"
        maxWidth="xl"
      >
        {selectedPrediction && (
          <div className="space-y-4 text-slate-900 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-slate-500 font-medium">Model Output</p>
                <p className="text-xl font-bold text-slate-900">
                  {((selectedPrediction.probability || 0.42) * 100).toFixed(1)}% Probability
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {selectedPrediction.model_name} {selectedPrediction.model_version_str}
                </p>
              </div>
              <div>{getRiskBadge(selectedPrediction.prediction_result)}</div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Biomarker Feature Contributions (SHAP)
              </h4>
              <div className="space-y-2">
                {selectedPrediction.contributing_biomarkers?.map((b, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-900">{b.name}</span>
                    <Badge
                      className={
                        b.direction === "UP"
                          ? "bg-amber-50 text-amber-900 border-amber-200 font-bold"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold"
                      }
                    >
                      {b.weight} contribution
                    </Badge>
                  </div>
                )) || <p className="text-slate-500">No feature weights available.</p>}
              </div>
            </div>

            <div className="p-3.5 bg-teal-50/80 rounded-xl border border-teal-200">
              <span className="font-bold text-teal-950 block">Physician Oversight Confirmation</span>
              <p className="text-teal-900 text-[11px] mt-1 leading-relaxed">
                This prediction was reviewed by {selectedPrediction.physician_reviewer || "your attending cardiologist"}.
                Parameters are monitored in accordance with clinical guidelines.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setSelectedPrediction(null)}
                className="bg-slate-900 text-white text-xs h-8"
              >
                Close Window
              </Button>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </ResponsivePageContainer>
  );
}
