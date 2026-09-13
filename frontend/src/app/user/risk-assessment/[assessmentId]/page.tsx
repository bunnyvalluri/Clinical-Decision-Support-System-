"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params?.assessmentId as string;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/user/risk-assessment")} className="text-xs gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Assessments
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Assessment Evaluated
              </Badge>
              <span className="text-xs font-mono text-slate-400">ID: {assessmentId}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Cardiovascular Risk Assessment Summary
            </h1>
          </div>

          <Link href="/user/predictions">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 shadow-sm">
              <span>View Full Prediction</span> <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400">Estimated Risk Level:</span>
            <p className="text-base font-bold text-amber-600 mt-0.5">MODERATE</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400">Model Probability:</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">42.0 %</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400">Attending Review:</span>
            <p className="text-base font-bold text-emerald-600 mt-0.5">Verified</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400">Algorithm:</span>
            <p className="text-xs font-bold text-slate-700 mt-1">CardioEnsemble-RF</p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Reported Physiological Inputs</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">Resting SBP:</span> <strong className="text-slate-800">136 mmHg</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">Serum Cholesterol:</span> <strong className="text-slate-800">210 mg/dl</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">Max Heart Rate:</span> <strong className="text-slate-800">142 bpm</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">Exertional Angina:</span> <strong className="text-slate-800">No</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">ST Depression:</span> <strong className="text-slate-800">0.8 mm</strong>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            This estimate was produced for clinical decision support. If you experience sudden chest discomfort or shortness of breath, contact your physician immediately.
          </span>
        </div>
      </div>
    </div>
  );
}
