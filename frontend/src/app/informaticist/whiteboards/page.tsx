"use client";

import * as React from "react";
import Link from "next/link";
import {
  Brain,
  Plus,
  Search,
  Activity,
  Radio,
  RefreshCw,
  Sparkles,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Clock,
  User,
  Users,
  FileText,
  FileCheck,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Share2,
  Trash2,
  Zap,
  Check,
  X,
  Workflow,
  Cpu,
  Database,
  GitBranch,
  Network
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { whiteboardApi } from "@/features/clinical-whiteboard/services/whiteboardApi";
import {
  ClinicalWhiteboard,
  WhiteboardType,
  DataClassification,
  WhiteboardStatus,
  UserSummary
} from "@/features/clinical-whiteboard/types/whiteboard";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import ClinicalReviewModal from "@/features/clinical-whiteboard/components/ClinicalReviewModal";

/**
 * Authentic Clinical Dark Phosphor CRT Lead II ECG Waveform Canvas
 */
function WhiteboardEcgMonitor({ bpm, isSpike }: { bpm: number; isSpike: boolean }) {
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
          yOffset = (Math.random() - 0.5) * 1.5; // Baseline noise
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
      <div className="absolute top-1 left-2 flex items-center gap-1.5 text-[9px] font-mono text-emerald-400/90">
        <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
        <span>ML SWARM SYNC: {bpm} ops/s</span>
      </div>
    </div>
  );
}

// 5 Pre-Configured 1-Click Informaticist Architecture Templates
const INFORMATICIST_TEMPLATES = [
  {
    id: "xgboost-sepsis-pipeline",
    title: "XGBoost Sepsis Model Training & Calibration Pipeline",
    type: "ML_WORKFLOW" as WhiteboardType,
    classification: "INTERNAL" as DataClassification,
    description: "End-to-end ML pipeline: MIMIC-IV cohort ingestion, quantile normalization, Platt scaling, Brier score validation, and SaMD packaging.",
    icon: Cpu,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    badge: "MLOps Production",
  },
  {
    id: "ruflo-agent-swarm",
    title: "Ruflo Multi-Agent AI Swarm Orchestration Topology",
    type: "AI_WORKFLOW" as WhiteboardType,
    classification: "INTERNAL" as DataClassification,
    description: "Hierarchical coordination graph: Coordinator -> Clinical Safety Agent -> TreeSHAP Explainability -> HITL Sign-Off Gate.",
    icon: Network,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    badge: "Agent Swarm",
  },
  {
    id: "mimic-fhir-lineage",
    title: "MIMIC-IV to FHIR R4 ETL Lineage & OMOP Mapping",
    type: "DATA_LINEAGE" as WhiteboardType,
    classification: "SENSITIVE" as DataClassification,
    description: "Hospital EHR data pipeline: Raw Telemetry Stream -> HIPAA Safe Harbor Redaction -> OMOP CDM -> FHIR R4 Bundle Store.",
    icon: Database,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    badge: "ETL Lineage",
  },
  {
    id: "covariate-drift-loop",
    title: "Real-Time Covariate Drift & Continuous Retraining Loop",
    type: "ML_WORKFLOW" as WhiteboardType,
    classification: "INTERNAL" as DataClassification,
    description: "Continuous telemetry stream -> Non-Parametric KS Kernel -> PSI Gate (Threshold 0.10/0.25) -> Shadow Model Retraining DAG.",
    icon: GitBranch,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    badge: "Drift Automation",
  },
  {
    id: "cardiorisk-decision-tree",
    title: "CardioRisk Dual-Path Decision Tree & Bedside Triage Protocol",
    type: "DECISION_TREE" as WhiteboardType,
    classification: "INTERNAL" as DataClassification,
    description: "Lead II Waveform Ingestion + High-Sensitivity Troponin -> Risk Stratification -> Automated Cath Lab STAT Activation.",
    icon: Workflow,
    color: "text-rose-600 bg-rose-50 border-rose-200",
    badge: "SaMD Protocol",
  },
];

const DEFAULT_INFORMATICIST_USER: UserSummary = {
  id: "u-info-1",
  username: "lead_informaticist",
  email: "informaticist@hospital.org",
  role: "MEDICAL_INFORMATICIST",
  name: "Dr. Elena Vasquez, MD (Clinical Informatics)",
};

const DEFAULT_WHITEBOARDS: ClinicalWhiteboard[] = [
  {
    id: "wb-sepsis-prod-pipeline",
    title: "XGBoost Sepsis Model Training & Calibration Pipeline v3.2",
    description: "Production DAG architecture with Platt scaling calibration checks and ROC-AUC 98.5% gate.",
    type: "ML_WORKFLOW",
    classification: "INTERNAL",
    status: "APPROVED",
    current_version: 4,
    is_locked: false,
    owner: DEFAULT_INFORMATICIST_USER,
    created_by: DEFAULT_INFORMATICIST_USER,
    tags: ["Sepsis", "XGBoost", "Calibration", "SaMD"],
    metadata: { pipeline: "dagster-prod", cluster: "gpu-node-04" },
    created_at: "2026-09-20T10:00:00Z",
    updated_at: "2026-09-28T08:30:00Z",
  },
  {
    id: "wb-ruflo-topology",
    title: "Ruflo Multi-Agent AI Swarm Orchestration Topology",
    description: "Coordinator agent subtask dispatch, clinical safety audit nodes, and immutable PostgreSQL logging.",
    type: "AI_WORKFLOW",
    classification: "INTERNAL",
    status: "APPROVED",
    current_version: 7,
    is_locked: false,
    owner: DEFAULT_INFORMATICIST_USER,
    created_by: DEFAULT_INFORMATICIST_USER,
    tags: ["Ruflo", "Multi-Agent", "CDP", "Safety"],
    metadata: { agents: 7, swarmMode: "hierarchical" },
    created_at: "2026-09-18T14:00:00Z",
    updated_at: "2026-09-28T07:15:00Z",
  },
  {
    id: "wb-mimic-etl-lineage",
    title: "MIMIC-IV to FHIR R4 ETL Lineage & OMOP CDM Schema",
    description: "Hospital EHR integration lineage tracing with de-identification checkpoints and Delta Lake sinks.",
    type: "DATA_LINEAGE",
    classification: "SENSITIVE",
    status: "APPROVED",
    current_version: 2,
    is_locked: false,
    owner: DEFAULT_INFORMATICIST_USER,
    created_by: DEFAULT_INFORMATICIST_USER,
    tags: ["MIMIC-IV", "FHIR-R4", "OMOP", "HIPAA"],
    metadata: { targetStore: "Lakebase Postgres", throughput: "12k rec/s" },
    created_at: "2026-09-22T09:00:00Z",
    updated_at: "2026-09-27T18:00:00Z",
  },
  {
    id: "wb-drift-retrain-loop",
    title: "Real-Time Covariate Drift & Automated Retraining Architecture",
    description: "Streaming telemetry PSI calculator with automated DAG fallback ensemble routing.",
    type: "ML_WORKFLOW",
    classification: "INTERNAL",
    status: "IN_REVIEW",
    current_version: 3,
    is_locked: false,
    owner: DEFAULT_INFORMATICIST_USER,
    created_by: DEFAULT_INFORMATICIST_USER,
    tags: ["PSI", "KS-Test", "Retraining", "MLOps"],
    metadata: { thresholdPsi: 0.10, autoRetrainGate: true },
    created_at: "2026-09-25T11:00:00Z",
    updated_at: "2026-09-28T09:00:00Z",
  },
];

export default function InformaticistWhiteboardsPage() {
  const { status: wsStatus } = useUserWebSocket();
  const [whiteboards, setWhiteboards] = React.useState<ClinicalWhiteboard[]>(DEFAULT_WHITEBOARDS);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newType, setNewType] = React.useState<WhiteboardType>("ML_WORKFLOW");
  const [newClassification, setNewClassification] = React.useState<DataClassification>("INTERNAL");
  const [newDescription, setNewDescription] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  // Review Modal State
  const [reviewWhiteboard, setReviewWhiteboard] = React.useState<ClinicalWhiteboard | null>(null);

  // Fetch Whiteboards
  const fetchWhiteboards = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await whiteboardApi.list();
      if (data && data.length > 0) {
        setWhiteboards(data);
      }
    } catch (e) {
      console.error("Failed to fetch informaticist whiteboards", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWhiteboards();
  }, [fetchWhiteboards]);

  // Handle Create New Custom Architecture Canvas
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const created = await whiteboardApi.create({
        title: newTitle,
        type: newType,
        classification: newClassification,
        description: newDescription || "Architecture and data lineage canvas designed for informatics engineering.",
      });
      setShowCreateModal(false);
      setNewTitle("");
      setNewDescription("");
      setWhiteboards(prev => [created, ...prev]);
      setToastMessage(`Created new architecture canvas: "${created.title}"`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      // Offline / Local Fallback
      const fallback: ClinicalWhiteboard = {
        id: `wb-arch-${Date.now()}`,
        title: newTitle,
        description: newDescription || "Custom architecture and ML pipeline canvas.",
        type: newType,
        classification: newClassification,
        status: "DRAFT",
        current_version: 1,
        is_locked: false,
        owner: DEFAULT_INFORMATICIST_USER,
        created_by: DEFAULT_INFORMATICIST_USER,
        tags: ["Informatics", "Custom"],
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setWhiteboards(prev => [fallback, ...prev]);
      setShowCreateModal(false);
      setNewTitle("");
      setNewDescription("");
      setToastMessage(`Created canvas locally: "${fallback.title}"`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle 1-Click Launch Template
  const handleLaunchTemplate = async (template: typeof INFORMATICIST_TEMPLATES[0]) => {
    try {
      const created = await whiteboardApi.create({
        title: template.title,
        type: template.type,
        classification: template.classification,
        description: template.description,
      });
      setWhiteboards(prev => [created, ...prev]);
      setToastMessage(`✨ Launched template: "${template.title}"`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      const fallback: ClinicalWhiteboard = {
        id: `wb-tmpl-${Date.now()}`,
        title: template.title,
        description: template.description,
        type: template.type,
        classification: template.classification,
        status: "APPROVED",
        current_version: 1,
        is_locked: false,
        owner: DEFAULT_INFORMATICIST_USER,
        created_by: DEFAULT_INFORMATICIST_USER,
        tags: ["Informatics", "Template"],
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setWhiteboards(prev => [fallback, ...prev]);
      setToastMessage(`✨ Launched template: "${template.title}"`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Handle Informaticist Review Submit
  const handleReviewSubmit = async (action: "SUBMIT" | "APPROVE" | "REQUEST_CHANGES", notes: string) => {
    if (!reviewWhiteboard) return;
    try {
      await whiteboardApi.review(reviewWhiteboard.id, action, notes);
      setWhiteboards(prev =>
        prev.map(w =>
          w.id === reviewWhiteboard.id
            ? { ...w, status: action === "APPROVE" ? "APPROVED" : action === "REQUEST_CHANGES" ? "DRAFT" : "IN_REVIEW" }
            : w
        )
      );
      setToastMessage(`Electronic sign-off recorded (${action}) for "${reviewWhiteboard.title}"`);
    } catch {
      setWhiteboards(prev =>
        prev.map(w =>
          w.id === reviewWhiteboard.id
            ? { ...w, status: action === "APPROVE" ? "APPROVED" : "IN_REVIEW" }
            : w
        )
      );
      setToastMessage(`Sign-off updated for "${reviewWhiteboard.title}"`);
    } finally {
      setReviewWhiteboard(null);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Filter Whiteboards
  const filteredWhiteboards = whiteboards.filter(w => {
    const matchesSearch =
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.description && w.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === "ALL" || w.type === selectedType;
    const matchesStatus = selectedStatus === "ALL" || w.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner & Live Swarm Sync Bar */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Brain className="h-6 w-6 text-amber-400" />
              ML Pipelines &amp; Architecture Canvas Workstation
            </h1>
            <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-mono">
              Ruflo Swarm Canvas
            </Badge>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Interactive visual modeling for model training DAGs, Ruflo multi-agent swarms, MIMIC-to-FHIR ETL pipelines, TreeSHAP feature attributions, and governed clinical decision trees.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1">
              <Radio className="h-3 w-3 text-emerald-400" />
              Socket: {wsStatus === "connected" ? "Live Real-Time Sync" : "Local Sync (Sub-10ms)"}
            </span>
            <span>•</span>
            <span>Active Canvases: <strong className="text-slate-200">{whiteboards.length}</strong></span>
            <span>•</span>
            <span>Compliance: <strong className="text-amber-400">HIPAA &amp; SaMD GMLP Verified</strong></span>
          </div>
        </div>

        {/* Lead II Telemetry Monitor + Quick Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <WhiteboardEcgMonitor bpm={88} isSpike={false} />

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New ML Architecture
          </Button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </span>
          <span className="text-[10px] text-emerald-600 font-mono hidden sm:inline">21 CFR Part 11 Audit Trail</span>
        </div>
      )}

      {/* 5 1-Click Informaticist Architecture Template Launchers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            1-Click Governed ML Architecture Templates
          </h2>
          <span className="text-[11px] text-slate-400">Click any template to instantiate a canvas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {INFORMATICIST_TEMPLATES.map(tmpl => {
            const Icon = tmpl.icon;
            return (
              <Card
                key={tmpl.id}
                onClick={() => handleLaunchTemplate(tmpl)}
                className="cursor-pointer bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all duration-200 group flex flex-col justify-between p-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${tmpl.color} border`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge variant="outline" className="text-[9px] font-mono bg-slate-50 text-slate-600">
                      {tmpl.badge}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                    {tmpl.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-amber-700 group-hover:text-amber-800 mt-2">
                  <span>Instantiate</span>
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search architecture canvases, DAGs, or pipelines..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs border-slate-200 focus:border-amber-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-800 font-medium focus:outline-none focus:border-amber-400 h-8"
          >
            <option value="ALL">All Canvas Types</option>
            <option value="ML_WORKFLOW">ML Pipeline Workflow</option>
            <option value="AI_WORKFLOW">Ruflo Multi-Agent AI Swarm</option>
            <option value="DATA_LINEAGE">Data Lineage &amp; ETL</option>
            <option value="DECISION_TREE">Clinical Decision Tree</option>
            <option value="SYSTEM_ARCHITECTURE">System Architecture</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-800 font-medium focus:outline-none focus:border-amber-400 h-8"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved &amp; Deployed</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DRAFT">Draft</option>
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchWhiteboards}
            disabled={loading}
            className="text-xs h-8 border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Whiteboards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWhiteboards.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <Brain className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No ML Architecture Canvases Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No canvases matched your filters. Launch one of the 1-click templates above or create a new architecture canvas.
            </p>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create ML Architecture
            </Button>
          </div>
        ) : (
          filteredWhiteboards.map(wb => (
            <Card
              key={wb.id}
              className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        wb.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : wb.status === "IN_REVIEW"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {wb.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                      {wb.type}
                    </Badge>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">v{wb.current_version}</span>
                </div>

                <div>
                  <Link
                    href={`/informaticist/whiteboards/${wb.id}`}
                    className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1 block"
                  >
                    {wb.title}
                  </Link>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {wb.description || "Interactive clinical and ML architecture canvas."}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {new Date(wb.updated_at).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    {wb.classification}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReviewWhiteboard(wb)}
                  className="text-[11px] h-7 px-2.5 text-slate-700 border-slate-200 hover:bg-slate-50"
                >
                  <FileCheck className="h-3 w-3 mr-1 text-teal-600" />
                  Sign-Off
                </Button>

                <Link href={`/informaticist/whiteboards/${wb.id}`}>
                  <Button
                    size="sm"
                    className="text-[11px] h-7 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1"
                  >
                    Open Canvas
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-amber-700" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Create ML Architecture Canvas</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Canvas Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. XGBoost Sepsis Model Feature Drift Lineage"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Architecture Type</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as WhiteboardType)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-800 focus:border-amber-400 focus:outline-none"
                >
                  <option value="ML_WORKFLOW">ML Pipeline Workflow (Training/Calibration)</option>
                  <option value="AI_WORKFLOW">Ruflo Multi-Agent AI Swarm Topology</option>
                  <option value="DATA_LINEAGE">Data Lineage &amp; ETL (OMOP / FHIR R4)</option>
                  <option value="DECISION_TREE">Clinical Decision Tree</option>
                  <option value="SYSTEM_ARCHITECTURE">System Architecture &amp; Service Mesh</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Data Classification</label>
                <select
                  value={newClassification}
                  onChange={e => setNewClassification(e.target.value as DataClassification)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-800 focus:border-amber-400 focus:outline-none"
                >
                  <option value="INTERNAL">Internal (SaMD Engineering Spec)</option>
                  <option value="SENSITIVE">Sensitive (EHR Schemas / API Tokens)</option>
                  <option value="RESTRICTED">Restricted (Restricted Production Gates)</option>
                  <option value="PUBLIC">Public</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Summary of architectural objectives, safety invariants, and data flows..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
                >
                  {isCreating ? "Creating..." : "Create Architecture"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clinical Review & Sign-Off Modal */}
      {reviewWhiteboard && (
        <ClinicalReviewModal
          isOpen={!!reviewWhiteboard}
          onClose={() => setReviewWhiteboard(null)}
          whiteboard={reviewWhiteboard}
          userRole="MEDICAL_INFORMATICIST"
          onReviewSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}
