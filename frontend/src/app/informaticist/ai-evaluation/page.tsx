"use client";

import { Sparkles, BarChart3, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function AIEvaluationPage() {
  const { llmEvaluations } = useClinicalStore();
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">AI Evaluation</h1>
      {llmEvaluations && llmEvaluations.length > 0 ? (
        <div className="space-y-3">
          {llmEvaluations.map((ev: any, i: number) => (
            <Card key={ev.id ?? i}>
              <CardContent className="p-4">
                <div className="flex justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{ev.evaluation_type || `LLM Evaluation ${i + 1}`}</p>
                    <p className="text-xs text-slate-500">{ev.model_name} · {ev.evaluation_date ? new Date(ev.evaluation_date).toLocaleDateString() : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Overall Score</p>
                    <p className="font-bold text-purple-700">{ev.overall_score ? (ev.overall_score * 100).toFixed(1) + "%" : "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Sparkles className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-slate-500">No AI evaluation data available yet.</p>
            <p className="text-xs text-slate-400">Evaluations are run after each LLM interaction batch.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
