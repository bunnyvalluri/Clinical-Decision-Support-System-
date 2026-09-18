"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { RiskAssessmentForm } from "@/components/risk/RiskAssessmentForm";
import { RiskResultCard } from "@/components/risk/RiskResultCard";
import { RiskTimeline } from "@/components/risk/RiskTimeline";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, ArrowLeft, PlusCircle, History, RefreshCw, AlertCircle } from "lucide-react";
import {
  PatientRiskSummary,
  RiskLevel,
  RiskPrediction,
  riskApi,
} from "@/services/risk/riskApi";

export default function DoctorPatientPredictionsPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();

  const [activeTab, setActiveTab] = React.useState<string>("assess");
  const [riskSummary, setRiskSummary] = React.useState<PatientRiskSummary | null>(null);
  const [selectedPrediction, setSelectedPrediction] = React.useState<RiskPrediction | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setError(null);
    try {
      const summary = await riskApi.getPatientRisk(patientId);
      setRiskSummary(summary);
      if (summary.latest_risk) {
        setSelectedPrediction(summary.latest_risk);
      }
    } catch (err: any) {
      console.error("Failed to load patient risk:", err);
      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to load patient risk record from database."
      );
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle new prediction completed
  const handlePredictionComplete = (newPrediction: RiskPrediction) => {
    setSelectedPrediction(newPrediction);
    setActiveTab("result");
    loadData(); // refresh trajectory
  };

  // Handle physician clinical review / override
  const handleRecordReview = async (predId: string, override: RiskLevel, rationale: string) => {
    const updated = await riskApi.recordReview(predId, {
      clinician_override: override,
      override_reason: rationale,
    });
    setSelectedPrediction(updated);
    loadData();
  };

  // Select item from timeline
  const handleSelectFromTimeline = async (id: string) => {
    try {
      const detail = await riskApi.getPrediction(id);
      setSelectedPrediction(detail);
      setActiveTab("result");
    } catch (err) {
      console.error("Failed to load prediction detail:", err);
    }
  };

  return (
    <DoctorLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Top Breadcrumb & Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/doctor/patients/${patientId}`)}
              className="gap-1 text-xs text-slate-700 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Patient Chart
            </Button>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium">Risk Level Assessment & CDSS</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="h-8 text-xs gap-1.5 border-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-6 w-6 text-sky-700" />
              Patient Risk Level Prediction & Clinical Decision Support
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Patient MRN: <strong className="text-slate-900 font-mono">{riskSummary?.patient_mrn || patientId}</strong> —
              Authoritative Source: <strong className="text-slate-800">Neon PostgreSQL</strong>
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-100 p-1 border border-slate-200">
            <TabsTrigger value="assess" className="text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
              <PlusCircle className="w-3.5 h-3.5" />
              New Risk Assessment
            </TabsTrigger>
            <TabsTrigger value="result" className="text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
              <Activity className="w-3.5 h-3.5" />
              Risk Assessment & CDSS Result
            </TabsTrigger>
            <TabsTrigger value="trajectory" className="text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
              <History className="w-3.5 h-3.5" />
              Sequential Trajectory ({riskSummary?.total_predictions || 0})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: New Assessment Form */}
          <TabsContent value="assess" className="space-y-4">
            <RiskAssessmentForm
              patientId={patientId}
              onPredictionComplete={handlePredictionComplete}
              disabled={isLoading}
            />
          </TabsContent>

          {/* TAB 2: Latest / Selected Result */}
          <TabsContent value="result" className="space-y-4">
            {selectedPrediction ? (
              <RiskResultCard
                prediction={selectedPrediction}
                patientName={`Patient MRN: ${riskSummary?.patient_mrn || patientId}`}
                onRecordReview={handleRecordReview}
              />
            ) : (
              <div className="p-8 text-center rounded-xl border border-slate-200 bg-white space-y-3">
                <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-800">No Risk Assessment Selected</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Execute a new clinical assessment or select a historical prediction from the timeline to inspect full TreeSHAP explainability and CDSS guidance.
                </p>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("assess")}
                  className="text-xs bg-sky-700 hover:bg-sky-800 text-white"
                >
                  Start Assessment
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: Longitudinal Risk Trajectory */}
          <TabsContent value="trajectory" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <RiskTimeline
                  items={riskSummary?.risk_trajectory || []}
                  selectedId={selectedPrediction?.id}
                  onSelectPrediction={handleSelectFromTimeline}
                />
              </div>
              <div className="md:col-span-2">
                {selectedPrediction ? (
                  <RiskResultCard
                    prediction={selectedPrediction}
                    patientName={`Patient MRN: ${riskSummary?.patient_mrn || patientId}`}
                    onRecordReview={handleRecordReview}
                  />
                ) : (
                  <div className="p-8 text-center rounded-xl border border-slate-200 bg-white text-xs text-slate-500">
                    Select a historical assessment on the left to review inference attributions.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DoctorLayout>
  );
}
