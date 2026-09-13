"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Cpu,
  Filter,
  HeartPulse,
  History,
  Plus,
  Radio,
  Search,
  Sparkles,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/emptyState";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function PredictionHistoryPage() {
  const router = useRouter();
  const { predictions } = useClinicalStore();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [riskFilter, setRiskFilter] = React.useState("ALL");
  const [modelFilter, setModelFilter] = React.useState("ALL");

  const filteredPredictions = predictions.filter((p) => {
    const matchesSearch =
      p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient_mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = riskFilter === "ALL" || p.risk_level === riskFilter;
    const matchesModel = modelFilter === "ALL" || p.model_name.includes(modelFilter);

    return matchesSearch && matchesRisk && matchesModel;
  });

  return (
    <Shell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <History className="h-6 w-6 text-emerald-600" />
              Clinical Prediction Audit Log
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Historical ledger of ML risk predictions, confidence bounds, and physician override trails.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-mono bg-white border-slate-200 text-slate-700 shadow-sm">
              <Radio className="h-3 w-3 mr-1.5 text-emerald-600 animate-pulse" />
              Live Feed Connected
            </Badge>
            <Link href="/predictions/new">
              <Button variant="default" size="sm" className="text-xs gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" />
                New Prediction
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by MRN, patient name, prediction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Risk:</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Cpu className="h-3.5 w-3.5 text-slate-400" />
              <span>Model:</span>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Algorithms</option>
                <option value="RF">Random Forest</option>
                <option value="AdaBoost">AdaBoost</option>
                <option value="SVM">SVM</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-0">
            {filteredPredictions.length === 0 ? (
              <EmptyState
                icon={<HeartPulse className="h-8 w-8 text-slate-400" />}
                title="No prediction records match"
                description="Adjust search filters or run a new risk evaluation."
                actionLabel="Reset Search"
                onAction={() => {
                  setSearchTerm("");
                  setRiskFilter("ALL");
                  setModelFilter("ALL");
                }}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Patient / MRN</TableHead>
                    <TableHead>Assessed Risk</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>95% CI</TableHead>
                    <TableHead>Model Engine</TableHead>
                    <TableHead>Physician Override</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPredictions.map((pred) => (
                    <TableRow key={pred.id}>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {pred.timestamp}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">
                          {pred.patient_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {pred.patient_mrn}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pred.risk_level === "CRITICAL"
                              ? "critical"
                              : pred.risk_level === "HIGH"
                              ? "high"
                              : pred.risk_level === "MEDIUM"
                              ? "medium"
                              : "low"
                          }
                        >
                          {pred.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-800">
                        {(pred.probability * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        [{(pred.confidence_interval[0] * 100).toFixed(0)}% - {(pred.confidence_interval[1] * 100).toFixed(0)}%]
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">
                        {pred.model_name} <span className="text-slate-400 font-mono">{pred.model_version}</span>
                      </TableCell>
                      <TableCell>
                        {pred.physician_override ? (
                          <Badge variant="warning" className="text-[10px]">
                            Overridden to {pred.physician_override.new_risk_level}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Unmodified</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/predictions/${pred.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-slate-200 hover:bg-slate-50 text-emerald-700 font-semibold"
                          >
                            <Sparkles className="h-3 w-3 mr-1 text-emerald-600" />
                            Explain XAI
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
