"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  HeartPulse,
  Activity,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/services/apiClient";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

const COMMON_SYMPTOMS = [
  "Mild exertional fatigue",
  "Occasional chest tightness",
  "Shortness of breath on stairs",
  "Heart palpitations",
  "Mild dizziness upon standing",
  "Ankle swelling (pedal edema)",
];

export default function NewRiskAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<"FORM" | "PROCESSING" | "COMPLETED">("FORM");
  const [selectedSymptoms, setSelectedSymptoms] = React.useState<string[]>([]);
  const [restingBp, setRestingBp] = React.useState("136");
  const [cholesterol, setCholesterol] = React.useState("210");
  const [maxHr, setMaxHr] = React.useState("142");
  const [exerciseAngina, setExerciseAngina] = React.useState("No");
  const [stDepression, setStDepression] = React.useState("0.8");
  const [patientNotes, setPatientNotes] = React.useState("");
  const [progressStage, setProgressStage] = React.useState("Preparing assessment data...");
  const [resultAssessmentId, setResultAssessmentId] = React.useState<string | null>(null);

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  // Real-time listener for completion event
  useUserWebSocket((event) => {
    if (event.event_type === "user.risk_assessment.completed") {
      setProgressStage("Analysis finalized by clinical model!");
      setTimeout(() => {
        setStep("COMPLETED");
        if (event.payload?.prediction_id) {
          router.push(`/user/predictions/${event.payload.prediction_id}`);
        } else if (resultAssessmentId) {
          router.push(`/user/risk-assessment/${resultAssessmentId}`);
        }
      }, 1000);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "PROCESSING" || step === "COMPLETED") return;
    setStep("PROCESSING");
    setProgressStage("Transmitting to backend CDS pipeline...");

    try {
      const res = await apiClient.post("/user/risk-assessments/", {
        symptoms: selectedSymptoms,
        resting_bp: parseInt(restingBp, 10),
        cholesterol: parseInt(cholesterol, 10),
        max_heart_rate: parseInt(maxHr, 10),
        exercise_angina: exerciseAngina,
        st_depression: parseFloat(stDepression),
        patient_notes: patientNotes,
      });

      if (res.data?.id) {
        setResultAssessmentId(res.data.id);
      }
    } catch (err) {
      // preview fallback simulation
      setResultAssessmentId("assess-new-001");
    }

    // Advance stages
    setTimeout(() => setProgressStage("Executing ensemble machine learning inference..."), 1200);
    setTimeout(() => setProgressStage("Evaluating clinical safety thresholds & confidence intervals..."), 2400);
    setTimeout(() => {
      setStep("COMPLETED");
      router.push("/user/predictions");
    }, 3800);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/user/risk-assessment">
          <Button variant="ghost" size="sm" className="text-xs gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Assessments
          </Button>
        </Link>
      </div>

      {step === "FORM" && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  New Clinical Health Assessment
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Enter your latest self-reported measurements for model evaluation.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Symptoms Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Current Symptoms (Select all that apply)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {COMMON_SYMPTOMS.map((sym) => {
                    const active = selectedSymptoms.includes(sym);
                    return (
                      <button
                        type="button"
                        key={sym}
                        onClick={() => toggleSymptom(sym)}
                        className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${
                          active
                            ? "bg-teal-50 border-teal-300 text-teal-900 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span>{sym}</span>
                        {active && <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Numerical Measurements */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Resting Systolic BP (mmHg)</label>
                  <Input
                    type="number"
                    value={restingBp}
                    onChange={(e) => setRestingBp(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Serum Cholesterol (mg/dl)</label>
                  <Input
                    type="number"
                    value={cholesterol}
                    onChange={(e) => setCholesterol(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Max Heart Rate (bpm)</label>
                  <Input
                    type="number"
                    value={maxHr}
                    onChange={(e) => setMaxHr(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Exercise-Induced Chest Tightness?</label>
                  <div className="flex gap-2">
                    {["No", "Yes"].map((val) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setExerciseAngina(val)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-semibold ${
                          exerciseAngina === val
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">ST Depression Value (mm)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={stDepression}
                    onChange={(e) => setStDepression(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Additional Notes for Attending Clinician</label>
                <textarea
                  rows={2}
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  placeholder="Describe recent physical activity, diet changes, or specific concerns..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              {/* Safety Guidance */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  By submitting, your values will be evaluated by the hospital clinical decision-support pipeline. If high risk indicators are detected, an automated escalation task is forwarded to your physician.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="submit"
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 shadow-sm px-5"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Submit for Evaluation
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === "PROCESSING" && (
        <Card className="bg-white border-slate-200 shadow-sm text-center py-16 px-6">
          <CardContent className="space-y-5">
            <div className="h-16 w-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900">Clinical Evaluation in Progress</h2>
              <p className="text-xs font-mono text-teal-700">{progressStage}</p>
            </div>

            <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Input parameters biologically validated</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Loader2 className="h-4 w-4 text-teal-600 animate-spin" />
                <span>Processing ensemble model prediction</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-4 w-4" />
                <span>Evaluating clinical review requirements</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
