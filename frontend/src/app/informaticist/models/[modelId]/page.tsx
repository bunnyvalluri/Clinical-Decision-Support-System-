"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Brain, CheckCircle2, Cpu, Download, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ModelDetailPage() {
  const params = useParams();
  const modelId = (params?.modelId as string) || "mod-01";

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/informaticist/models">
            <button className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">RandomForestClassifier v1.0.0</h1>
            <p className="text-xs text-slate-500">Registry ID: {modelId} · Primary Active Champion</p>
          </div>
        </div>

        <Link href="/informaticist/models">
          <Button size="sm" className="bg-slate-900 text-white text-xs h-8">
            Back to Registry
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-slate-400 uppercase font-semibold">ROC-AUC</p>
            <p className="text-2xl font-bold text-emerald-700 font-mono mt-1">98.5%</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-slate-400 uppercase font-semibold">PR-AUC</p>
            <p className="text-2xl font-bold text-slate-900 font-mono mt-1">98.1%</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-slate-400 uppercase font-semibold">Brier Score</p>
            <p className="text-2xl font-bold text-slate-900 font-mono mt-1">0.0027</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-slate-400 uppercase font-semibold">Inference Latency</p>
            <p className="text-2xl font-bold text-purple-700 font-mono mt-1">0.136 ms</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Model Specification &amp; Lineage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-600">
          <p>• <strong>Architecture:</strong> Ensemble of 150 Calibrated Decision Trees (Isotonic Probability Calibration)</p>
          <p>• <strong>Framework:</strong> scikit-learn 1.4.1 compiled to ONNX Runtime v1.17</p>
          <p>• <strong>Target Clinical Task:</strong> Inpatient Sepsis &amp; Acute Hemodynamic Decompensation (ICD-10 A41.9, R57.2)</p>
          <p>• <strong>Training Cohort:</strong> Multicenter Inpatient Telemetry &amp; EHR Cohort (N=48,200 records)</p>
          <p>• <strong>Lead Informaticist Sign-Off:</strong> Alex Rivera, MSc (2026-09-12 04:00 UTC, Cryptographic SHA-256 Validated)</p>
        </CardContent>
      </Card>
    </div>
  );
}
