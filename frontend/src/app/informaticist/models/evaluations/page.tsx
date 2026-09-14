"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Brain, CheckCircle2, ChevronRight, Download, RefreshCw, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const EVALUATIONS_LIST = [
  { id: "ev-1", model: "RandomForestClassifier v1.0.0", dataset: "Prompt 18 Empirical Test Suite", n: 2500, rocAuc: 0.985, prAuc: 0.981, brier: 0.0027, ece: 0.012, latency: "0.136 ms", date: "2026-09-14 06:00", status: "PRODUCTION ACTIVE" },
  { id: "ev-2", model: "XGBoost-SepsisEarly v1.2.0", dataset: "Shadow Telemetry Batch #841", n: 1200, rocAuc: 0.972, prAuc: 0.965, brier: 0.0185, ece: 0.019, latency: "0.218 ms", date: "2026-09-13 18:30", status: "VALIDATED CANDIDATE" },
  { id: "ev-3", model: "SupportVectorMachine v0.9.4", dataset: "Cardiology Inpatient Validation", n: 1500, rocAuc: 0.957, prAuc: 0.950, brier: 0.0485, ece: 0.034, latency: "0.449 ms", date: "2026-09-12 12:15", status: "VALIDATED CANDIDATE" },
  { id: "ev-4", model: "AdaBoostClassifier v0.8.2", dataset: "Emergency Triage Stress Suite", n: 800, rocAuc: 0.949, prAuc: 0.939, brier: 0.0934, ece: 0.061, latency: "4.103 ms", date: "2026-09-11 09:00", status: "CANDIDATE" },
  { id: "ev-5", model: "LogisticRegressionBaseline v0.5.1", dataset: "Historical 2024 Retrospective", n: 2000, rocAuc: 0.892, prAuc: 0.874, brier: 0.1140, ece: 0.082, latency: "0.042 ms", date: "2026-09-10 14:20", status: "ARCHIVED" },
];

export default function ModelEvaluationsPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/informaticist/models">
              <button className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Model Evaluations Benchmark</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Empirical evaluation sweeps, discriminative calibration indices, and latency benchmarks.
          </p>
        </div>

        <Link href="/informaticist/models">
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 shadow-2xs font-semibold">
            Back to Registry
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {EVALUATIONS_LIST.map(ev => (
          <Card key={ev.id} className="bg-white border-slate-200 shadow-xs hover:border-amber-300 transition-all">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{ev.model}</h3>
                  <p className="text-xs text-slate-500">
                    {ev.dataset} (N={ev.n.toLocaleString()}) · {ev.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 justify-between md:justify-end flex-wrap text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans uppercase">ROC-AUC</span>
                  <span className="font-bold text-emerald-700">{(ev.rocAuc * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans uppercase">PR-AUC</span>
                  <span className="font-semibold text-slate-800">{(ev.prAuc * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans uppercase">Brier</span>
                  <span className="font-semibold text-slate-800">{ev.brier.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans uppercase">Latency</span>
                  <span className="font-semibold text-purple-700">{ev.latency}</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200 font-sans">
                  {ev.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
