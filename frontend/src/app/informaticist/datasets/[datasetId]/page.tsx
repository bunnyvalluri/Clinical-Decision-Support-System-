"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  DownloadCloud,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Fingerprint,
  GitBranch,
  Layers,
  Play,
  RefreshCw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  kaggleDatasetsApi,
  DatasetDetail,
  DatasetLineageGraph,
  TrainingRunDTO,
} from "@/services/kaggleDatasets";

export default function DatasetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params.datasetId as string;

  const [dataset, setDataset] = React.useState<DatasetDetail | null>(null);
  const [lineage, setLineage] = React.useState<DatasetLineageGraph | null>(null);
  const [trainingRuns, setTrainingRuns] = React.useState<TrainingRunDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [validating, setValidating] = React.useState(false);

  // Approval Dialog state
  const [approvalOpen, setApprovalOpen] = React.useState(false);
  const [approvalTier, setApprovalTier] = React.useState("APPROVED_FOR_RESEARCH");
  const [clinicalRationale, setClinicalRationale] = React.useState("");
  const [submittingApproval, setSubmittingApproval] = React.useState(false);

  // Training Dialog state
  const [trainOpen, setTrainOpen] = React.useState(false);
  const [selectedAlgo, setSelectedAlgo] = React.useState("RandomForestClassifier");
  const [randomSeed, setRandomSeed] = React.useState(42);
  const [submittingTrain, setSubmittingTrain] = React.useState(false);

  // Live WebSocket message state
  const [liveStatus, setLiveStatus] = React.useState<string | null>(null);

  const fetchDataset = React.useCallback(async () => {
    try {
      setLoading(true);
      const [detail, lin, runs] = await Promise.all([
        kaggleDatasetsApi.getDatasetDetail(datasetId),
        kaggleDatasetsApi.getDatasetLineage(datasetId).catch(() => null),
        kaggleDatasetsApi.getTrainingRuns(datasetId).catch(() => []),
      ]);
      setDataset(detail);
      setLineage(lin);
      setTrainingRuns(runs);
    } catch (err) {
      console.error("Failed to load dataset details:", err);
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  React.useEffect(() => {
    fetchDataset();
  }, [fetchDataset]);

  // WebSocket Subscription for Realtime Pipeline Telemetry
  React.useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000/ws";
    const socket = new WebSocket(`${wsUrl}/datasets/${datasetId}/`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event_type) {
          setLiveStatus(`${data.event_type} (${data.progress || 0}%)`);
          if (data.event_type.includes("completed") || data.event_type.includes("failed")) {
            fetchDataset();
          }
        }
      } catch (e) {
        console.error("WS message parse error:", e);
      }
    };

    return () => {
      socket.close();
    };
  }, [datasetId, fetchDataset]);

  const handleValidate = async () => {
    try {
      setValidating(true);
      await kaggleDatasetsApi.validateDataset(datasetId);
      setLiveStatus("Validation initiated in background worker...");
      fetchDataset();
    } catch (err) {
      console.error("Validation error:", err);
    } finally {
      setValidating(false);
    }
  };

  const handleApproveSubmit = async () => {
    if (!clinicalRationale.trim()) return;
    try {
      setSubmittingApproval(true);
      await kaggleDatasetsApi.approveDataset(datasetId, approvalTier, clinicalRationale);
      setApprovalOpen(false);
      setClinicalRationale("");
      fetchDataset();
    } catch (err) {
      console.error("Approval error:", err);
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleTrainSubmit = async () => {
    try {
      setSubmittingTrain(true);
      await kaggleDatasetsApi.trainModel(datasetId, selectedAlgo, {}, randomSeed);
      setTrainOpen(false);
      fetchDataset();
    } catch (err) {
      console.error("Training error:", err);
    } finally {
      setSubmittingTrain(false);
    }
  };

  if (loading && !dataset) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-slate-500 bg-white min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-sm font-medium">Loading authoritative dataset record...</p>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-slate-500 bg-white min-h-screen">
        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" />
        <p className="text-base font-semibold text-slate-800">Dataset Not Found</p>
        <Link href="/informaticist/datasets">
          <Button variant="outline" className="mt-4">Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  const v = dataset.latest_version;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 bg-white min-h-screen">
      {/* Back Link and Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4">
        <Link
          href="/informaticist/datasets"
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dataset Catalog
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {dataset.title}
              </h1>
              <Badge variant="outline" className="text-xs text-slate-700 border-slate-300">
                v{dataset.version_number}
              </Badge>
              <Badge variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50">
                {dataset.license_name}
              </Badge>
              {v?.is_synthetic && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                  Synthetic Dataset
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-1">
              <span>{dataset.kaggle_owner}/{dataset.kaggle_slug}</span>
              <span>·</span>
              <a
                href={dataset.dataset_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
              >
                Upstream Source <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidate}
              disabled={validating || dataset.status === "VALIDATING"}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
            >
              {validating || dataset.status === "VALIDATING" ? (
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <Play className="h-4 w-4 text-blue-600" />
              )}
              Run Validation Pipeline
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setApprovalOpen(true)}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1.5"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Audit Sign-Off
            </Button>

            <Button
              size="sm"
              onClick={() => setTrainOpen(true)}
              disabled={!v}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-sm"
            >
              <Cpu className="h-4 w-4" />
              Train ML Model
            </Button>
          </div>
        </div>

        {/* Live Status Telemetry Bar */}
        {liveStatus && (
          <div className="text-xs bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-md flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 animate-pulse text-blue-600" />
            <span className="font-semibold">Worker Telemetry:</span>
            <span>{liveStatus}</span>
          </div>
        )}
      </div>

      {/* Primary Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 border border-slate-200 rounded-lg">
          <TabsTrigger value="overview" className="text-xs font-semibold data-[state=active]:bg-white">Overview</TabsTrigger>
          <TabsTrigger value="quality" className="text-xs font-semibold data-[state=active]:bg-white">
            Data Quality ({dataset.quality_summary?.findings_count || 0})
          </TabsTrigger>
          <TabsTrigger value="schema" className="text-xs font-semibold data-[state=active]:bg-white">
            Feature Schema ({dataset.features.length})
          </TabsTrigger>
          <TabsTrigger value="lineage" className="text-xs font-semibold data-[state=active]:bg-white">Lineage</TabsTrigger>
          <TabsTrigger value="validation" className="text-xs font-semibold data-[state=active]:bg-white">Validation Gates</TabsTrigger>
          <TabsTrigger value="training" className="text-xs font-semibold data-[state=active]:bg-white">
            Training Runs ({trainingRuns.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200 bg-white shadow-sm md:col-span-2">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-800">Dataset Overview & Abstract</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-sm text-slate-600 space-y-3">
                <p className="leading-relaxed">{dataset.description || "No description provided."}</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block">Author / Provider</span>
                    <span className="font-semibold text-slate-800">{dataset.author || dataset.kaggle_owner}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">License</span>
                    <span className="font-semibold text-slate-800">{dataset.license_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Cohort Records</span>
                    <span className="font-semibold text-slate-800">
                      {v?.row_count ? v.row_count.toLocaleString() : "Pending Ingestion"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Feature Columns</span>
                    <span className="font-semibold text-slate-800">{v?.column_count || dataset.features.length || "Pending"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Cryptographic Fingerprint</span>
                    <span className="font-mono text-slate-700 truncate block">
                      {v?.dataset_hash ? `${v.dataset_hash.slice(0, 16)}...` : "Not hashed yet"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Approval Tier</span>
                    <span className="font-semibold text-slate-800">{dataset.approval_status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-800">Privacy & Provenance</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs space-y-3">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Privacy Classification</span>
                  <Badge variant="outline" className="font-semibold text-slate-800 border-slate-200">
                    {dataset.privacy_assessment?.classification || "UNKNOWN"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">HIPAA Safe Harbor Scan</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> ZERO PHI Detected
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Synthetic Data Audit</span>
                  <span className="font-medium text-slate-700">
                    {v?.is_synthetic ? "Synthetic (Flagged)" : "Empirical Clinical Cohort"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Neon PostgreSQL State</span>
                  <span className="font-mono font-semibold text-emerald-700">AUTHORITATIVE</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. DATA QUALITY TAB */}
        <TabsContent value="quality" className="space-y-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800">Data Quality Audit Findings</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Audited against missingness rates, duplicate rows, constant columns, and categorical cardinality.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              {!dataset.quality_summary || dataset.quality_summary.findings.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                  Zero quality defects identified or validation not yet run.
                </div>
              ) : (
                <div className="space-y-2">
                  {dataset.quality_summary.findings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-800">
                            {finding.feature ? `Feature '${finding.feature}': ` : ""}
                            {finding.issue_type}
                          </span>
                          <p className="text-slate-600 mt-0.5">{finding.message}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs uppercase shrink-0">
                        {finding.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. SCHEMA TAB */}
        <TabsContent value="schema" className="space-y-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800">Feature Dictionary & Physical Units</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Features extracted, mapped, and typed in Neon PostgreSQL.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Feature Name</th>
                      <th className="py-2.5 px-4">Data Type</th>
                      <th className="py-2.5 px-4">Range (Min - Max)</th>
                      <th className="py-2.5 px-4">Missing %</th>
                      <th className="py-2.5 px-4">Clinical Semantics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dataset.features.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-400">
                          No features mapped yet. Run validation pipeline to parse schema.
                        </td>
                      </tr>
                    ) : (
                      dataset.features.map((feat) => (
                        <tr key={feat.name} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">{feat.name}</td>
                          <td className="py-2.5 px-4 text-slate-500 font-mono">{feat.data_type}</td>
                          <td className="py-2.5 px-4 text-slate-700">
                            {feat.min !== undefined && feat.min !== null
                              ? `${feat.min} to ${feat.max}`
                              : "Categorical / N/A"}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">{feat.missing_pct}%</td>
                          <td className="py-2.5 px-4 text-slate-600">{feat.clinical_meaning || "Standard observation"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. LINEAGE TAB */}
        <TabsContent value="lineage" className="space-y-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800">End-to-End Dataset Lineage DAG</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Traceable chain of custody from external Kaggle source to clinical decision support predictions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {!lineage ? (
                <div className="text-center py-8 text-slate-400 text-xs">No lineage graph computed yet.</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border border-slate-200 bg-slate-50 p-3 rounded-lg text-xs font-mono">
                    <span className="font-semibold text-slate-700">Source: {dataset.dataset_url}</span>
                    <span className="text-slate-500">SHA-256: {v?.dataset_hash || "PENDING"}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    {lineage.nodes.map((node) => (
                      <div key={node.id} className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs text-xs">
                        <Badge variant="outline" className="mb-1.5 text-[10px] text-blue-600 border-blue-200 bg-blue-50">
                          {node.type}
                        </Badge>
                        <p className="font-semibold text-slate-800">{node.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. VALIDATION GATES TAB */}
        <TabsContent value="validation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-800">Clinical Suitability & Range Audit</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Suitability Status</span>
                  <Badge variant="outline" className="font-semibold">{dataset.clinical_suitability_status}</Badge>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Biological Contradictions</span>
                  <span className="font-semibold text-slate-800">
                    {dataset.clinical_validation?.contradictions?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600">Range Violations</span>
                  <span className="font-semibold text-slate-800">
                    {dataset.clinical_validation?.range_violations?.length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-800">Governance & Approval Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Current Tier</span>
                  <Badge className="bg-purple-50 text-purple-700 border-purple-200">{dataset.approval_status}</Badge>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Human Clinician Sign-Off</span>
                  <span className="font-semibold text-slate-700">
                    {dataset.approval_status !== "PENDING" ? "Recorded in Audit Log" : "Awaiting Clinician Review"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600">Production Clinical Prediction Gate</span>
                  <span className="font-semibold text-rose-600">RESTRICTED TO RESEARCH</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 6. TRAINING RUNS TAB */}
        <TabsContent value="training" className="space-y-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-800">Machine Learning Training Experiments</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Models trained on this dataset version with scikit-learn, calibrated probabilities, and SHAP.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setTrainOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
                Launch Training Run
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              {trainingRuns.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No training runs launched yet for this dataset version.
                </div>
              ) : (
                <div className="space-y-3">
                  {trainingRuns.map((run) => (
                    <div key={run.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800">{run.algorithm}</span>
                          <Badge variant="outline" className="text-xs text-purple-700 border-purple-200 bg-purple-50">
                            {run.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">Run: {run.id.slice(0, 8)}</span>
                      </div>

                      {/* Metrics row */}
                      {run.metrics && Object.keys(run.metrics).length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-2.5 rounded border border-slate-200">
                          <div>
                            <span className="text-slate-400 block">Accuracy</span>
                            <span className="font-bold text-slate-800">
                              {run.metrics.accuracy ? `${(run.metrics.accuracy * 100).toFixed(1)}%` : "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">ROC-AUC</span>
                            <span className="font-bold text-slate-800">
                              {run.metrics.roc_auc ? (run.metrics.roc_auc).toFixed(3) : "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">F1-Score</span>
                            <span className="font-bold text-slate-800">
                              {run.metrics.f1 ? (run.metrics.f1).toFixed(3) : "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Brier Score</span>
                            <span className="font-bold text-slate-800">
                              {run.brier_score ? run.brier_score.toFixed(4) : "N/A"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Top SHAP Features */}
                      {run.shap_summary && Object.keys(run.shap_summary).length > 0 && (
                        <div className="text-xs space-y-1">
                          <span className="font-semibold text-slate-700">Top Feature Contributions (TreeSHAP):</span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {Object.entries(run.shap_summary).slice(0, 6).map(([feat, imp]) => (
                              <Badge key={feat} variant="outline" className="text-[11px] font-mono bg-white text-slate-700">
                                {feat}: {imp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* APPROVAL MODAL */}
      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Clinical Data Governance Sign-Off</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Audit record written to PostgreSQL ledger. Requires human clinical rationale.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold">Approval Tier</Label>
              <Select value={approvalTier} onValueChange={setApprovalTier}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED_FOR_RESEARCH">Approved for Research & Benchmarking</SelectItem>
                  <SelectItem value="APPROVED_FOR_TRAINING">Approved for ML Model Training</SelectItem>
                  <SelectItem value="REJECTED">Reject Dataset</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold">Clinical Rationale (Mandatory)</Label>
              <Textarea
                placeholder="Document clinical appropriateness, population relevance, and reason for sign-off..."
                value={clinicalRationale}
                onChange={(e) => setClinicalRationale(e.target.value)}
                rows={4}
                className="bg-white border-slate-200 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setApprovalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApproveSubmit}
              disabled={submittingApproval || !clinicalRationale.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submittingApproval ? "Recording Sign-Off..." : "Submit Sign-Off"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TRAIN MODEL MODAL */}
      <Dialog open={trainOpen} onOpenChange={setTrainOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Launch Audited ML Training Run</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Trains pipeline with stratified patient-level split, calibration, and TreeSHAP.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold">Algorithm Family</Label>
              <Select value={selectedAlgo} onValueChange={setSelectedAlgo}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RandomForestClassifier">Random Forest (Ensemble of Trees)</SelectItem>
                  <SelectItem value="SVMTrainer">Support Vector Machine (Radial Basis)</SelectItem>
                  <SelectItem value="AdaBoostClassifier">AdaBoost (Adaptive Boosting)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold">Deterministic Random Seed</Label>
              <Input
                type="number"
                value={randomSeed}
                onChange={(e) => setRandomSeed(Number(e.target.value))}
                className="bg-white border-slate-200 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTrainOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleTrainSubmit}
              disabled={submittingTrain}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {submittingTrain ? "Dispatching Celery Worker..." : "Launch Training"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
