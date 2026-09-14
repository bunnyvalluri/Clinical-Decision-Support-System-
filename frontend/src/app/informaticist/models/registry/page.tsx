"use client";

import * as React from "react";
import Link from "next/link";
import { Brain, CheckCircle2, Clock, Archive, AlertTriangle, ArrowLeft, ShieldCheck, Layers, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const REGISTRY_STAGES = [
  { stage: "Candidate", count: 3, color: "text-sky-700", bg: "bg-sky-50 border-sky-200", desc: "Automated unit evaluation & 5-fold cross-validation passed." },
  { stage: "Validated", count: 1, color: "text-blue-700", bg: "bg-blue-50 border-blue-200", desc: "Passed discriminative, calibration & drift test thresholds." },
  { stage: "Approved", count: 1, color: "text-purple-700", bg: "bg-purple-50 border-purple-200", desc: "Signed off by Lead Informaticist & Clinical Safety Board." },
  { stage: "Active Champion", count: 1, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", desc: "Serving live production predictions in EHR workflow." },
  { stage: "Archived", count: 1, color: "text-slate-600", bg: "bg-slate-50 border-slate-200", desc: "Retired from production; historical weights locked." },
  { stage: "Quarantined", count: 0, color: "text-rose-700", bg: "bg-rose-50 border-rose-200", desc: "Halted due to data quality or concept drift triggers." },
];

export default function ModelRegistryPage() {
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
            <h1 className="text-2xl font-bold text-slate-900">Model Registry — Lifecycle Governance</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standardized SaMD lifecycle progression and cryptographic release gates.
          </p>
        </div>

        <Link href="/informaticist/models">
          <Button size="sm" className="bg-slate-900 text-white text-xs h-8">
            View All Registered Models
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {REGISTRY_STAGES.map(({ stage, count, color, bg, desc }) => (
          <Card key={stage} className={`border ${bg} shadow-xs`}>
            <CardContent className="p-4 text-center space-y-1">
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs font-semibold text-slate-800">{stage}</p>
              <p className="text-[10px] text-slate-500 leading-tight pt-1">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Promotion Criteria (SaMD Class II)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs text-slate-600 space-y-2.5">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <p className="font-semibold text-slate-900">1. Discriminative Performance Floor</p>
              <p className="text-slate-500">ROC-AUC &gt;= 0.950 and PR-AUC &gt;= 0.930 on 2,500 held-out cases.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <p className="font-semibold text-slate-900">2. Calibration &amp; Brier Score Bound</p>
              <p className="text-slate-500">Brier score &lt; 0.050 and ECE &lt; 0.030 across 10 deciles.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <p className="font-semibold text-slate-900">3. Population Stability Index (PSI)</p>
              <p className="text-slate-500">PSI &lt; 0.10 against baseline training feature distributions.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-600" />
              Active Registry Versions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs space-y-3">
            {[
              { name: "RandomForestClassifier v1.0.0", status: "CHAMPION ACTIVE", tag: "Production", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              { name: "XGBoost-SepsisEarly v1.2.0", status: "SHADOW CANDIDATE", tag: "Candidate", badge: "bg-sky-50 text-sky-700 border-sky-200" },
              { name: "SupportVectorMachine v0.9.4", status: "VALIDATED", tag: "Candidate", badge: "bg-blue-50 text-blue-700 border-blue-200" },
              { name: "AdaBoostClassifier v0.8.2", status: "BENCHMARKED", tag: "Candidate", badge: "bg-amber-50 text-amber-700 border-amber-200" },
            ].map(m => (
              <div key={m.name} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                <div>
                  <p className="font-semibold text-slate-900">{m.name}</p>
                  <p className="text-[11px] text-slate-500">{m.status}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${m.badge}`}>{m.tag}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
