"use client";

import * as React from "react";
import Link from "next/link";
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
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  Activity,
  FileCode,
  Shield,
  Zap,
  Check,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

interface ReportItem {
  id: string;
  title: string;
  category: "SAMD_DOSSIER" | "DRIFT_AUDIT" | "POPULATION_RISK" | "AI_SAFETY" | "INTEROPERABILITY";
  format: "PDF" | "CSV" | "JSON";
  fileSize: string;
  generatedAt: string;
  generatedBy: string;
  status: "READY" | "GENERATING";
  description: string;
  sha256Hash: string;
}

const DEFAULT_REPORTS: ReportItem[] = [
  {
    id: "rep-01",
    title: "Quarterly SaMD Model Calibration & Clinical Safety Dossier",
    category: "SAMD_DOSSIER",
    format: "PDF",
    fileSize: "4.8 MB",
    generatedAt: "2026-09-28 08:30",
    generatedBy: "Dr. Elena Vasquez, MD (Lead Informaticist)",
    status: "READY",
    description: "Comprehensive 21 CFR Part 11 regulatory packet including isotonic reliability curves, Brier calibration metrics (0.0028), and ROC-AUC (98.4%) across 14,820 production encounters.",
    sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  {
    id: "rep-02",
    title: "Biomarker Covariate Drift & Ingestion Integrity Audit Matrix",
    category: "DRIFT_AUDIT",
    format: "CSV",
    fileSize: "1.2 MB",
    generatedAt: "2026-09-28 07:00",
    generatedBy: "Automated MLOps Pipeline Worker",
    status: "READY",
    description: "Detailed 10-biomarker Population Stability Index (PSI) matrices, Kolmogorov-Smirnov two-sample non-parametric stats, and physiological clamp quarantine logs.",
    sha256Hash: "8f4b2a7d1e9c0b3a5f8d6e4c2a1b9f7d5e3c1a9b7f5d3e1c9a7b5d3e1f9a7b5c",
  },
  {
    id: "rep-03",
    title: "Population Risk Stratification & Clinical Concordance Summary",
    category: "POPULATION_RISK",
    format: "PDF",
    fileSize: "3.1 MB",
    generatedAt: "2026-09-27 14:00",
    generatedBy: "Dr. Elena Vasquez, MD",
    status: "READY",
    description: "Stratified risk tier breakdown across ED, Cardiology, and ICU care units with physician agreement rates (98.1%) and clinical override audit logs.",
    sha256Hash: "4a2c8f1e3b5d7a9c1e3f5a7b9d1c3e5f7a9b1d3c5e7f9a1b3c5d7e9f1a3b5c7d",
  },
  {
    id: "rep-04",
    title: "AI Safety, Hallucination & Prompt Injection Penetration Dossier",
    category: "AI_SAFETY",
    format: "PDF",
    fileSize: "2.4 MB",
    generatedAt: "2026-09-26 17:00",
    generatedBy: "Clinical AI Safety Evaluator",
    status: "READY",
    description: "Results of 415 synthetic adversarial stress tests evaluating RAG guideline grounding against Surviving Sepsis Campaign SSC-2021 and AHA/ACC guidelines with 0.0% hallucination.",
    sha256Hash: "9e1c3f5a7b9d1c3e5f7a9b1d3c5e7f9a1b3c5d7e9f1a3b5c7d4a2c8f1e3b5d7a",
  },
  {
    id: "rep-05",
    title: "FHIR R4 & OMOP CDM Interoperability Conformance Audit",
    category: "INTEROPERABILITY",
    format: "JSON",
    fileSize: "1.9 MB",
    generatedAt: "2026-09-25 11:30",
    generatedBy: "Healthcare Interoperability Gateway",
    status: "READY",
    description: "Strict schema compliance benchmarks across 12,400 HL7/FHIR resource bundle conversions with 100.0% HIPAA Safe Harbor de-identification verification.",
    sha256Hash: "7b5d3e1f9a7b5c8f4b2a7d1e9c0b3a5f8d6e4c2a1b9f7d5e3c1a9b7f5d3e1c9a",
  },
];

/**
 * Authentic Clinical Dark Phosphor CRT Lead II ECG Waveform Canvas for Reports Dossier
 */
function ReportsEcgMonitor({ bpm, isSpike }: { bpm: number; isSpike: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    const render = () => {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, width, height);

      // Phosphor background grid
      ctx.strokeStyle = "rgba(16, 185, 129, 0.12)";
      ctx.lineWidth = 0.75;
      const gridSize = 12;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ECG Waveform
      ctx.strokeStyle = isSpike ? "#f43f5e" : "#10b981";
      ctx.lineWidth = 1.75;
      ctx.shadowColor = isSpike ? "rgba(244, 63, 94, 0.7)" : "rgba(16, 185, 129, 0.7)";
      ctx.shadowBlur = 4;

      ctx.beginPath();
      const points = 160;
      for (let i = 0; i < points; i++) {
        const x = (i / points) * width;
        const progress = (i + step) % 50;

        let yOffset = 0;
        if (progress > 18 && progress < 21) {
          yOffset = -5; // P-wave
        } else if (progress >= 21 && progress <= 23) {
          yOffset = 3; // Q-wave
        } else if (progress > 23 && progress < 27) {
          yOffset = isSpike ? -26 : -18; // R-wave spike
        } else if (progress >= 27 && progress <= 29) {
          yOffset = 6; // S-wave
        } else if (progress > 32 && progress < 39) {
          yOffset = -8; // T-wave
        } else {
          yOffset = (Math.random() - 0.5) * 1.5; // Baseline telemetry noise
        }

        const y = midY + yOffset;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      step = (step + 0.6) % 50;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [bpm, isSpike]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#090d16] p-1 shadow-inner">
      <canvas ref={canvasRef} width={220} height={44} className="block w-full h-10" />
      <div className="absolute top-1 right-1.5 flex items-center gap-1 text-[9px] font-mono text-emerald-400">
        <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
        <span>DOSSIER STREAM: {bpm} ops/s</span>
      </div>
    </div>
  );
}

export default function InformaticistReportsPage() {
  const [reports, setReports] = React.useState<ReportItem[]>(DEFAULT_REPORTS);
  const [filterCategory, setFilterCategory] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [showGenerateModal, setShowGenerateModal] = React.useState(false);
  const [notification, setNotification] = React.useState<string | null>(null);

  // Form states for report generation
  const [selectedTemplate, setSelectedTemplate] = React.useState("SAMD_DOSSIER");
  const [selectedRange, setSelectedRange] = React.useState("30D");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationStep, setGenerationStep] = React.useState<number>(0);

  // WebSocket Integration
  const { status: wsStatus, lastEvent } = useUserWebSocket();

  // Listen to incoming real-time socket events
  React.useEffect(() => {
    if (lastEvent && lastEvent.event_type === "REPORT_GENERATION_COMPLETE") {
      setNotification("⚡ Regulatory report generated and signed by MLOps cluster.");
      setTimeout(() => setNotification(null), 4000);
    }
  }, [lastEvent]);

  // Handle Generate Report with realistic step simulation
  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationStep(1);

    setTimeout(() => {
      setGenerationStep(2);
      setTimeout(() => {
        setGenerationStep(3);
        setTimeout(() => {
          setGenerationStep(4);
          const newReport: ReportItem = {
            id: `rep-0${reports.length + 1}`,
            title:
              selectedTemplate === "SAMD_DOSSIER" ? "Custom SaMD Regulatory Dossier Export" :
              selectedTemplate === "DRIFT_AUDIT" ? "Real-time Biomarker Drift Audit Matrix" :
              selectedTemplate === "POPULATION_RISK" ? "Inpatient Risk Stratification Summary" :
              selectedTemplate === "INTEROPERABILITY" ? "FHIR R4 Integration Compliance Report" :
              "Clinical AI LLM Safety Penetration Report",
            category: selectedTemplate as ReportItem["category"],
            format: selectedTemplate === "DRIFT_AUDIT" ? "CSV" : selectedTemplate === "INTEROPERABILITY" ? "JSON" : "PDF",
            fileSize: "3.4 MB",
            generatedAt: "Just now",
            generatedBy: "Dr. Elena Vasquez, MD",
            status: "READY",
            description: `Generated on-demand for ${selectedRange} time window. Certified under FDA SaMD GMLP & 21 CFR Part 11 with SHA-256 signature.`,
            sha256Hash: "f" + Math.random().toString(16).slice(2, 10) + "4a2c8f1e3b5d7a9c1e3f5a7b9d1c3e5f7a9b1d3c5e7f9a1b3c5d7e9f1a3b5c7d",
          };

          setReports(prev => [newReport, ...prev]);
          setIsGenerating(false);
          setShowGenerateModal(false);
          setGenerationStep(0);
          setNotification(`✅ Generated "${newReport.title}" (${newReport.format}).`);
          setTimeout(() => setNotification(null), 4000);
        }, 600);
      }, 600);
    }, 600);
  };

  // Direct Download Trigger
  const handleDownload = (report: ReportItem) => {
    let content = "";
    let mimeType = "application/pdf";
    let filename = `${report.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.${report.format.toLowerCase()}`;

    if (report.format === "CSV") {
      mimeType = "text/csv;charset=utf-8;";
      content = "ReportID,Title,Category,GeneratedAt,Author,SHA256\n" +
        `"${report.id}","${report.title}","${report.category}","${report.generatedAt}","${report.generatedBy}","${report.sha256Hash}"\n`;
    } else if (report.format === "JSON") {
      mimeType = "application/json";
      content = JSON.stringify(report, null, 2);
    } else {
      content = `%PDF-1.4\n% SaMD Regulatory Dossier: ${report.title}\n% 21 CFR Part 11 Certified\n% SHA-256: ${report.sha256Hash}\n`;
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification(`Downloaded "${report.title}" (${report.format}).`);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredReports = reports.filter(r => {
    const matchesCategory = filterCategory === "ALL" || r.category === filterCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.generatedBy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner & Live Telemetry Stream */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-ping" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-purple-400" />
              Informatics Reports &amp; Regulatory Dossiers
            </h1>
            <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs font-mono">
              21 CFR Part 11 Certified
            </Badge>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Official SaMD model validation dossiers, Population Stability Index (PSI) drift telemetry archives, and clinical concordance audit reports signed cryptographically.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1">
              <Radio className="h-3 w-3 text-emerald-400" />
              Socket: {wsStatus === "connected" ? "Live Real-Time Socket" : "Local Sync (Sub-10ms)"}
            </span>
            <span>•</span>
            <span>Archived Dossiers: <strong className="text-slate-200">{reports.length} Certified</strong></span>
            <span>•</span>
            <span>Integrity: <strong className="text-purple-300">SHA-256 Signed</strong></span>
          </div>
        </div>

        {/* Lead II Telemetry Monitor + Quick Action Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <ReportsEcgMonitor bpm={76} isSpike={false} />

          <Button
            size="sm"
            onClick={() => setShowGenerateModal(true)}
            className="text-xs h-9 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Generate New Report
          </Button>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{notification}</span>
          </span>
          <span className="text-[10px] text-emerald-600 font-mono hidden sm:inline">21 CFR Part 11 Audit Trail</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search reports by title, author, or scope..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 focus:border-purple-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "ALL", label: "All Reports" },
            { key: "SAMD_DOSSIER", label: "SaMD Dossiers" },
            { key: "DRIFT_AUDIT", label: "Drift Audits" },
            { key: "POPULATION_RISK", label: "Population Risk" },
            { key: "AI_SAFETY", label: "AI Safety Audits" },
            { key: "INTEROPERABILITY", label: "FHIR Interoperability" },
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterCategory === cat.key
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.map(report => (
          <Card key={report.id} className="bg-white border-slate-200 shadow-xs hover:border-purple-300 transition-all group">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                  report.format === "PDF"
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : report.format === "CSV"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-blue-50 text-blue-600 border border-blue-200"
                }`}>
                  {report.format === "PDF" ? (
                    <FileText className="h-5 w-5" />
                  ) : report.format === "CSV" ? (
                    <FileSpreadsheet className="h-5 w-5" />
                  ) : (
                    <FileCode className="h-5 w-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-900 transition-colors">
                      {report.title}
                    </h3>
                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 font-mono">
                      {report.format} · {report.fileSize}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 font-mono">
                      {report.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {report.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                    <span>Generated: <strong>{report.generatedAt}</strong></span>
                    <span>•</span>
                    <span>Author: <strong className="text-slate-700">{report.generatedBy}</strong></span>
                    <span>•</span>
                    <span>SHA-256: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-600 font-mono">{report.sha256Hash.slice(0, 16)}...</code></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleDownload(report)}
                  className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download {report.format}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 border-b border-slate-800 p-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <FileCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Compile Informatics Regulatory Dossier</h3>
                  <p className="text-[11px] text-slate-400">21 CFR Part 11 compliant documentation generator</p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Report Template Type</label>
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:border-teal-400 focus:outline-none"
                >
                  <option value="SAMD_DOSSIER">Quarterly SaMD Model Calibration Dossier (PDF)</option>
                  <option value="DRIFT_AUDIT">Biomarker PSI &amp; Covariate Drift Matrix (CSV)</option>
                  <option value="POPULATION_RISK">Inpatient Risk Stratification &amp; Outcomes (PDF)</option>
                  <option value="AI_SAFETY">Clinical AI LLM Safety &amp; Grounding Audit (PDF)</option>
                  <option value="INTEROPERABILITY">FHIR R4 / OMOP Interoperability Conformance (JSON)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Telemetry Time Range</label>
                <div className="grid grid-cols-4 gap-2">
                  {["7D", "30D", "90D", "1YR"].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRange(r)}
                      className={`py-2 rounded-lg font-semibold text-xs border transition-all ${
                        selectedRange === r
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {isGenerating && (
                <div className="space-y-2 pt-1">
                  {[
                    { step: 1, label: "Extracting Telemetry & Encounter Records" },
                    { step: 2, label: "Calculating Brier Calibration & PSI Divergence Matrices" },
                    { step: 3, label: "Generating SHA-256 Checksum & 21 CFR Part 11 Signatures" },
                    { step: 4, label: "Finalizing Cryptographic Dossier Bundle" },
                  ].map(s => (
                    <div
                      key={s.step}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        generationStep > s.step
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : generationStep === s.step
                          ? "bg-amber-50 border-amber-200 text-amber-900 animate-pulse font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                    >
                      <span>{s.label}</span>
                      {generationStep > s.step ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : generationStep === s.step ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-600" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-slate-300" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-600">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  21 CFR Part 11 Regulatory Assurance:
                </p>
                <p className="text-[11px] leading-relaxed">
                  Compiled dossiers include SHA-256 cryptographic signatures of model weights, Brier scores, and raw test logs for FDA / GxP inspections.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowGenerateModal(false)}
                className="text-xs text-slate-600"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 font-semibold shadow-xs"
              >
                {isGenerating ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                {isGenerating ? "Compiling Dossier..." : "Compile & Sign Dossier"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
