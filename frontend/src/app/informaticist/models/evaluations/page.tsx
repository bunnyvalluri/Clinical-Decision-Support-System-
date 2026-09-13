"use client";

import { useClinicalStore } from "@/features/clinical/clinicalStore";
import { BarChart3, ChevronRight, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function ModelEvaluationsPage() {
  const { modelEvaluations } = useClinicalStore();
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Model Evaluations</h1>
      <div className="space-y-3">
        {modelEvaluations && modelEvaluations.length > 0 ? (
          modelEvaluations.map((ev: any, i: number) => (
            <Link key={ev.id ?? i} href={`/informaticist/models/evaluations/${ev.id ?? i}`} className="block">
              <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{ev.model_name || `Evaluation ${i + 1}`}</p>
                  <p className="text-xs text-slate-500">
                    AUC: {ev.roc_auc ? (ev.roc_auc * 100).toFixed(1) + "%" : "—"} ·
                    F1: {ev.f1_score ? (ev.f1_score * 100).toFixed(1) + "%" : "—"} ·
                    {ev.evaluation_date ? new Date(ev.evaluation_date).toLocaleDateString() : ""}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </Link>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No evaluations available.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
