"use client";

import * as React from "react";
import Link from "next/link";
import { Brain, ChevronRight, CheckCircle2, Clock, Archive, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function InformaticistModelsPage() {
  const { mlModels } = useClinicalStore();

  const statusColor = (status: string) =>
    status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status === "VALIDATED" ? "bg-blue-50 text-blue-700 border-blue-200"
    : status === "ARCHIVED" ? "bg-slate-100 text-slate-600 border-slate-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Model Registry</h1>
        <div className="flex gap-2">
          <Link href="/informaticist/models/registry">
            <button className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-purple-400 hover:text-purple-700 transition-all bg-white">
              Registry
            </button>
          </Link>
          <Link href="/informaticist/models/evaluations">
            <button className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-purple-400 hover:text-purple-700 transition-all bg-white">
              Evaluations
            </button>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {mlModels && mlModels.length > 0 ? (
          mlModels.map((model: any) => (
            <Link key={model.id} href={`/informaticist/models/${model.id}`} className="block">
              <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{model.name || model.model_name}</p>
                  <p className="text-xs text-slate-500">v{model.version} · {model.model_type || "Classification"}</p>
                </div>
                <Badge className={`border text-xs ${statusColor(model.status)}`}>{model.status}</Badge>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </Link>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <Brain className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-slate-500">No models registered yet.</p>
              <p className="text-xs text-slate-400">Models will appear here once deployed to the ML registry.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
