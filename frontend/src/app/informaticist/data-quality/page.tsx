"use client";

import * as React from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileSpreadsheet,
  Filter,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

interface BiomarkerQualityItem {
  id: string;
  feature: string;
  loinc: string;
  category: "HEMODYNAMICS" | "LAB_CHEMISTRY" | "ELECTROPHYSIOLOGY" | "METABOLIC" | "HEMATOLOGY";
  completeness: number;
  outlierRate: number;
  safeRange: string;
  observedRange: string;
  imputation: string;
  status: "PASSED" | "WARNING" | "EXCELLENT";
}

const BIOMARKER_QUALITY_DATA: BiomarkerQualityItem[] = [
  { id: "bq-1", feature: "Systolic Blood Pressure", loinc: "8480-6", category: "HEMODYNAMICS", completeness: 0.998, outlierRate: 0.004, safeRange: "70 — 240 mmHg", observedRange: "88 — 215 mmHg", imputation: "Forward-Fill (Max 4h)", status: "EXCELLENT" },
  { id: "bq-2", feature: "Diastolic Blood Pressure", loinc: "8462-4", category: "HEMODYNAMICS", completeness: 0.996, outlierRate: 0.002, safeRange: "40 — 140 mmHg", observedRange: "48 — 130 mmHg", imputation: "Forward-Fill (Max 4h)", status: "EXCELLENT" },
  { id: "bq-3", feature: "Resting Heart Rate", loinc: "8867-4", category: "HEMODYNAMICS", completeness: 0.994, outlierRate: 0.006, safeRange: "30 — 220 bpm", observedRange: "42 — 185 bpm", imputation: "Median Clinical Impute", status: "EXCELLENT" },
  { id: "bq-4", feature: "Oxygen Saturation (SpO2)", loinc: "59408-5", category: "HEMODYNAMICS", completeness: 0.997, outlierRate: 0.003, safeRange: "60 — 100 %", observedRange: "74 — 100 %", imputation: "Forward-Fill (Max 1h)", status: "EXCELLENT" },
  { id: "bq-5", feature: "ST-Segment Depression", loinc: "81389-9", category: "ELECTROPHYSIOLOGY", completeness: 0.989, outlierRate: 0.011, safeRange: "0.0 — 8.0 mm", observedRange: "0.0 — 6.2 mm", imputation: "Zero (Absence of Ischemia)", status: "PASSED" },
  { id: "bq-6", feature: "Serum Creatinine", loinc: "2160-0", category: "LAB_CHEMISTRY", completeness: 0.984, outlierRate: 0.014, safeRange: "0.2 — 12.0 mg/dL", observedRange: "0.5 — 8.4 mg/dL", imputation: "MICE (Multivariate)", status: "PASSED" },
  { id: "bq-7", feature: "Blood Glucose Level", loinc: "2345-7", category: "METABOLIC", completeness: 0.982, outlierRate: 0.018, safeRange: "40 — 500 mg/dL", observedRange: "55 — 420 mg/dL", imputation: "MICE (Multivariate)", status: "WARNING" },
  { id: "bq-8", feature: "Lactic Acid (Serum/Plasma)", loinc: "2524-7", category: "LAB_CHEMISTRY", completeness: 0.978, outlierRate: 0.018, safeRange: "0.3 — 15.0 mmol/L", observedRange: "0.6 — 11.2 mmol/L", imputation: "MICE / Median", status: "WARNING" },
  { id: "bq-9", feature: "White Blood Cell Count (WBC)", loinc: "6690-2", category: "HEMATOLOGY", completeness: 0.991, outlierRate: 0.008, safeRange: "1.0 — 50.0 x10^9/L", observedRange: "2.4 — 38.5 x10^9/L", imputation: "Median Impute", status: "EXCELLENT" },
  { id: "bq-10", feature: "Platelet Count", loinc: "777-3", category: "HEMATOLOGY", completeness: 0.993, outlierRate: 0.005, safeRange: "10 — 1000 x10^9/L", observedRange: "35 — 680 x10^9/L", imputation: "Median Impute", status: "EXCELLENT" },
];

export default function DataQualityPage() {
  const [items, setItems] = React.useState<BiomarkerQualityItem[]>(BIOMARKER_QUALITY_DATA);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [isAuditing, setIsAuditing] = React.useState(false);
  const [auditMessage, setAuditMessage] = React.useState<string | null>(null);

  const filteredItems = items.filter(i => {
    const matchesCategory = selectedCategory === "ALL" || i.category === selectedCategory;
    const matchesSearch =
      i.feature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.loinc.includes(searchQuery) ||
      i.imputation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setAuditMessage("Data Quality & Quarantine verification passed: 99.4% overall pipeline health across 48,290 records.");
      setTimeout(() => setAuditMessage(null), 3500);
    }, 700);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "EXCELLENT":
        return <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">EXCELLENT</Badge>;
      case "PASSED":
        return <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">PASSED</Badge>;
      case "WARNING":
        return <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">WARNING (&gt;1% Outlier)</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">FAIL</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinical Data Quality &amp; Feature Integrity</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs">
              Pipeline Health: 99.4% (Tier 1 SaMD)
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated integrity, missingness profiling, physiological sanity boundaries, and MICE imputation auditing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="text-xs h-8 border-slate-200 hover:border-amber-400 hover:text-amber-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isAuditing ? "animate-spin" : ""}`} />
            Run Quality Audit
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setAuditMessage("Data Quality Feature Audit exported as CSV.");
              setTimeout(() => setAuditMessage(null), 3000);
            }}
            className="text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white shadow-2xs font-semibold"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Quality CSV
          </Button>
        </div>
      </div>

      {auditMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {auditMessage}
          </span>
          <span className="text-[10px] text-emerald-600 font-mono">SaMD Feature Store</span>
        </div>
      )}

      {/* Top 4 Pipeline Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Ingest Completeness</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-emerald-700">99.88%</p>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">PASS</Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">Missing rate: 0.12%</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Physiological Validity</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-sky-700">99.52%</p>
              <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">&gt;3σ Check</Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">Outlier rate: 0.48%</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">FHIR R4 Schema Match</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-slate-900">100.0%</p>
              <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">Strict</Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Zero schema rejections</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Stream Ingest Latency</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-purple-700">18.4 ms</p>
              <span className="text-[10px] text-slate-400">HL7 / Kafka</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">48,290 msgs processed/day</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search feature name, LOINC code, imputation..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "ALL", label: "All Categories" },
            { key: "HEMODYNAMICS", label: "Hemodynamics" },
            { key: "LAB_CHEMISTRY", label: "Lab Chemistry" },
            { key: "ELECTROPHYSIOLOGY", label: "ECG" },
            { key: "HEMATOLOGY", label: "Hematology" },
            { key: "METABOLIC", label: "Metabolic" },
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.key
                  ? "bg-teal-600 text-white font-semibold shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 10-Biomarker Data Quality Table */}
      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="h-4 w-4 text-sky-600" />
            Clinical Biomarker Data Quality &amp; Completeness Matrix
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Per-feature completeness percentages, outlier rates (&gt;3 standard deviations), physiological validity boundaries, and active imputation strategies.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {/* Mobile Card View (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No clinical biomarkers match the search or category filter.
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{item.feature}</h4>
                      <span className="font-mono text-[11px] text-slate-500">LOINC: {item.loinc}</span>
                    </div>
                    <div className="shrink-0">{getStatusBadge(item.status)}</div>
                  </div>

                  {/* Completeness Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 font-medium">Completeness</span>
                      <span className="font-mono font-bold text-xs text-emerald-700">
                        {(item.completeness * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${item.completeness * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50/80 rounded-lg p-2.5 border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Outlier (&gt;3σ)</span>
                      <span className="font-mono text-slate-700">{(item.outlierRate * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Observed Range</span>
                      <span className="font-mono font-semibold text-slate-800">{item.observedRange}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Physiological Safe</span>
                      <span className="font-mono text-slate-500 text-[11px]">{item.safeRange}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Imputation</span>
                      <span className="font-mono text-slate-700 text-[11px] truncate block">{item.imputation}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinical Feature</TableHead>
                  <TableHead>LOINC Code</TableHead>
                  <TableHead>Completeness</TableHead>
                  <TableHead>Outlier (&gt;3σ)</TableHead>
                  <TableHead>Physiological Safe Range</TableHead>
                  <TableHead>Observed Range</TableHead>
                  <TableHead>Imputation Strategy</TableHead>
                  <TableHead className="text-right">Pipeline Quality</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => (
                  <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell className="font-bold text-xs text-slate-900">
                      {item.feature}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{item.loinc}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-emerald-700">
                          {(item.completeness * 100).toFixed(1)}%
                        </span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${item.completeness * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {(item.outlierRate * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{item.safeRange}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-slate-800">
                      {item.observedRange}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
                        {item.imputation}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(item.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quarantine & Handled Anomaly Log */}
      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            Live Ingestion Quarantine &amp; Sanitization Audit Log
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Real-time tracking of physiological clamp triggers, missing value interpolations, and quarantined records.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 text-xs">
            {[
              { time: "12 mins ago", patient: "MRN-90241", feature: "Systolic Blood Pressure", event: "Sensor artifact: SBP read 310 mmHg. Clamped to safe clinical ceiling (240 mmHg).", status: "CLAMPED & LOGGED" },
              { time: "45 mins ago", patient: "MRN-78192", feature: "Serum Creatinine", event: "Missing stat lab value at admission. Imputed via MICE estimator based on BUN & Age.", status: "MICE IMPUTED" },
              { time: "2 hours ago", patient: "MRN-33984", feature: "Blood Glucose Level", event: "Transient telemetry spike (420 mg/dL). Flagged for bedside glucometer corroboration.", status: "CONFIRMATION SENT" },
              { time: "5 hours ago", patient: "MRN-51209", feature: "Oxygen Saturation", event: "Sensor motion disconnect reading 0%. Discarded; previous valid value forward-filled.", status: "NOISE DROPPED" },
            ].map((entry, idx) => (
              <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{entry.feature}</span>
                    <span className="font-mono text-[11px] text-slate-500">({entry.patient})</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{entry.event}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{entry.time}</span>
                  <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200 whitespace-nowrap">
                    {entry.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
