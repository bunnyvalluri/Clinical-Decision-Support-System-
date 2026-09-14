"use client";

import * as React from "react";
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ReportItem {
  id: string;
  title: string;
  category: "SAMD_DOSSIER" | "DRIFT_AUDIT" | "POPULATION_RISK" | "AI_SAFETY";
  format: "PDF" | "CSV" | "JSON";
  fileSize: string;
  generatedAt: string;
  generatedBy: string;
  status: "READY" | "GENERATING";
  description: string;
}

const DEFAULT_REPORTS: ReportItem[] = [
  {
    id: "rep-01",
    title: "Quarterly SaMD Model Calibration & Clinical Safety Dossier",
    category: "SAMD_DOSSIER",
    format: "PDF",
    fileSize: "4.8 MB",
    generatedAt: "2026-09-14 08:30",
    generatedBy: "Alex Rivera, MSc (Lead Informaticist)",
    status: "READY",
    description: "Comprehensive 21 CFR Part 11 regulatory packet including isotonic reliability curves, Brier calibration metrics, and sensitivity thresholds across 14,820 inferences.",
  },
  {
    id: "rep-02",
    title: "Biomarker Covariate Drift & Ingestion Integrity Audit",
    category: "DRIFT_AUDIT",
    format: "CSV",
    fileSize: "1.2 MB",
    generatedAt: "2026-09-13 23:59",
    generatedBy: "Automated MLOps Pipeline Worker",
    status: "READY",
    description: "Detailed 8-biomarker Population Stability Index (PSI) matrices, Kolmogorov-Smirnov two-sample tests, and physiological outlier clamp logs.",
  },
  {
    id: "rep-03",
    title: "Population Risk Stratification & Clinical Concordance Report",
    category: "POPULATION_RISK",
    format: "PDF",
    fileSize: "3.1 MB",
    generatedAt: "2026-09-12 14:00",
    generatedBy: "Alex Rivera, MSc",
    status: "READY",
    description: "Stratified risk distribution across ED, Cardiology Inpatient, and ICU care units with physician agreement rates and override rationale logs.",
  },
  {
    id: "rep-04",
    title: "AI Safety, Hallucination & Prompt Injection Penetration Dossier",
    category: "AI_SAFETY",
    format: "PDF",
    fileSize: "2.4 MB",
    generatedAt: "2026-09-11 17:00",
    generatedBy: "Clinical AI Safety Evaluator",
    status: "READY",
    description: "Results of 200 synthetic adversarial stress tests evaluating RAG guideline grounding against Surviving Sepsis Campaign SSC-2021 and AHA/ACC guidelines.",
  },
];

export default function InformaticistReportsPage() {
  const [reports, setReports] = React.useState<ReportItem[]>(DEFAULT_REPORTS);
  const [filterCategory, setFilterCategory] = React.useState<string>("ALL");
  const [showGenerateModal, setShowGenerateModal] = React.useState(false);
  const [notification, setNotification] = React.useState<string | null>(null);

  // Form states for report generation
  const [selectedTemplate, setSelectedTemplate] = React.useState("SAMD_DOSSIER");
  const [selectedRange, setSelectedRange] = React.useState("30D");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowGenerateModal(false);
      const newReport: ReportItem = {
        id: `rep-0${reports.length + 1}`,
        title:
          selectedTemplate === "SAMD_DOSSIER" ? "Custom SaMD Regulatory Dossier Export" :
          selectedTemplate === "DRIFT_AUDIT" ? "Real-time Biomarker Drift Audit" :
          selectedTemplate === "POPULATION_RISK" ? "Inpatient Risk Stratification Summary" :
          "Clinical AI LLM Safety Penetration Report",
        category: selectedTemplate as ReportItem["category"],
        format: selectedTemplate === "DRIFT_AUDIT" ? "CSV" : "PDF",
        fileSize: "2.8 MB",
        generatedAt: "Just now",
        generatedBy: "Alex Rivera, MSc",
        status: "READY",
        description: `Generated on-demand for ${selectedRange} time window. Certified under 21 CFR Part 11.`,
      };
      setReports([newReport, ...reports]);
      setNotification(`Report "${newReport.title}" generated successfully.`);
      setTimeout(() => setNotification(null), 4000);
    }, 900);
  };

  const filteredReports = reports.filter(r =>
    filterCategory === "ALL" ? true : r.category === filterCategory
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Informatics Reports &amp; Regulatory Dossiers</h1>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
              21 CFR Part 11 Certified
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official SaMD model validation dossiers, drift telemetry archives, and clinical concordance audit reports.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowGenerateModal(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 shadow-2xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Generate New Report
        </Button>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {notification}
          </span>
          <span className="text-[10px] text-emerald-600 font-mono">Download Link Active</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: "ALL", label: "All Reports" },
          { key: "SAMD_DOSSIER", label: "SaMD Dossiers" },
          { key: "DRIFT_AUDIT", label: "Drift Audits" },
          { key: "POPULATION_RISK", label: "Population Risk" },
          { key: "AI_SAFETY", label: "AI Safety Audits" },
        ].map(cat => (
          <button
            key={cat.key}
            onClick={() => setFilterCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filterCategory === cat.key
                ? "bg-teal-600 text-white font-semibold shadow-2xs border-teal-600"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.map(report => (
          <Card key={report.id} className="bg-white border-slate-200 shadow-xs hover:border-amber-400 transition-all">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                  report.format === "PDF" ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                }`}>
                  {report.format === "PDF" ? <FileText className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm">{report.title}</h3>
                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">
                      {report.format} · {report.fileSize}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {report.description}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Generated: {report.generatedAt} · Author: <strong className="text-slate-700">{report.generatedBy}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNotification(`Downloading ${report.title} (${report.format})...`);
                    setTimeout(() => setNotification(null), 3000);
                  }}
                  className="text-xs h-8 border-slate-200 hover:border-slate-400"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in">
            <div className="relative bg-gradient-to-r from-slate-50 via-teal-50/40 to-slate-50 border-b border-slate-200 p-5 flex items-center justify-between text-slate-900">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-sky-500" />
              <div>
                <h3 className="text-base font-bold text-slate-950">Generate Informatics Report</h3>
                <p className="text-xs text-slate-500">Compile formal SaMD or MLOps audit documentation.</p>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="h-8 w-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer shadow-2xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Report Template</label>
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="SAMD_DOSSIER">Quarterly SaMD Model Calibration Dossier (PDF)</option>
                  <option value="DRIFT_AUDIT">Biomarker PSI &amp; Covariate Drift Matrix (CSV)</option>
                  <option value="POPULATION_RISK">Inpatient Risk Stratification &amp; Outcomes (PDF)</option>
                  <option value="AI_SAFETY">Clinical AI LLM Safety &amp; Grounding Audit (PDF)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Time Range</label>
                <div className="grid grid-cols-4 gap-2">
                  {["7D", "30D", "90D", "1YR"].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRange(r)}
                      className={`py-2 rounded-lg font-semibold text-xs border transition-all ${
                        selectedRange === r ? "bg-teal-600 text-white border-teal-600 shadow-2xs" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-600">
                <p className="font-bold text-slate-900">21 CFR Part 11 Compliance Notice:</p>
                <p>
                  Compiled dossiers include SHA-256 cryptographic signatures of model weights, Brier scores, and raw test logs for FDA / GxP inspections.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowGenerateModal(false)} className="text-xs h-8">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 font-semibold shadow-2xs"
              >
                {isGenerating ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                {isGenerating ? "Compiling Dossier..." : "Compile & Download"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
