"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, HeartPulse, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function ReviewDetailPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const router = useRouter();
  const { predictions } = useClinicalStore();
  const [decision, setDecision] = React.useState<"APPROVED" | "REJECTED" | null>(null);
  const [note, setNote] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const pred = predictions.find((p) => String(p.id) === reviewId);

  if (!pred) {
    return (
      <div className="p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
          <p className="text-slate-500">Review not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/doctor/reviews")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reviews
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!decision) return;
    setSubmitted(true);
  };

  const riskColor =
    pred.risk_level === "HIGH"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : pred.risk_level === "MEDIUM"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.push("/doctor/reviews")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        All Reviews
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <HeartPulse className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">{pred.patient_name}</h1>
                <p className="text-sm text-slate-500">MRN: {pred.patient_mrn}</p>
              </div>
            </div>
            <Badge className={`border ${riskColor}`}>{pred.risk_level} RISK</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Risk Probability</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{(pred.probability * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Model</p>
              <p className="font-semibold text-slate-800 mt-1">{pred.model_version}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!submitted ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Physician Review Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <button
                onClick={() => setDecision("APPROVED")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                  decision === "APPROVED"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 text-slate-600 hover:border-emerald-400"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve Prediction
              </button>
              <button
                onClick={() => setDecision("REJECTED")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                  decision === "REJECTED"
                    ? "border-rose-600 bg-rose-600 text-white"
                    : "border-slate-200 text-slate-600 hover:border-rose-400"
                }`}
              >
                <XCircle className="h-4 w-4" />
                Reject / Revise
              </button>
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add clinical notes or justification (required for rejection)…"
              rows={4}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />

            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Your review will be logged with your credentials and timestamp for clinical audit purposes.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!decision}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Submit Review
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="py-10 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="font-semibold text-emerald-800">Review Submitted</p>
            <p className="text-sm text-emerald-600">
              Decision: <strong>{decision}</strong> — logged with your credentials.
            </p>
            <Button variant="outline" onClick={() => router.push("/doctor/reviews")} className="mt-2">
              Return to Reviews
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
