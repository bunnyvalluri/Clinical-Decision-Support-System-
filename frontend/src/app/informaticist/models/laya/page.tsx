"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Cpu,
  ExternalLink,
  Layers,
  Play,
  RefreshCw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Terminal,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import apiClient from "@/services/apiClient";

interface CapabilityResponse {
  provider: string;
  available: boolean;
  health: string;
  platform_supported: boolean;
  os?: string;
  arch?: string;
  python_version?: string;
  mlx_available?: boolean;
  gpu_metal_available?: boolean;
  model_loaded?: boolean;
  checkpoint_verified?: boolean;
  details?: string;
  runtime_mode?: string;
}

interface DecisionSchema {
  id: string;
  name: string;
  version: string;
  decision_type: string;
  instructions: string;
  allowed_options: string[];
  status: string;
  robustness_status: string;
  robustness_score: number | null;
  created_at: string;
}

export default function LayaModelRegistryPage() {
  const [capabilities, setCapabilities] = React.useState<CapabilityResponse | null>(null);
  const [schemas, setSchemas] = React.useState<DecisionSchema[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEvaluating, setIsEvaluating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [evaluationFeedback, setEvaluationFeedback] = React.useState<string | null>(null);

  const fetchStatus = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [capRes, schemaRes] = await Promise.all([
        apiClient.get<CapabilityResponse>("/api/ai/providers/laya/capabilities"),
        apiClient.get<DecisionSchema[]>("/api/v1/ai/typed-decisions/schemas/").catch(() => ({ data: [] })),
      ]);
      setCapabilities(capRes.data);
      setSchemas(schemaRes.data || []);
    } catch (err: any) {
      console.error("Failed to load Laya status:", err);
      setError(err?.response?.data?.error || err.message || "Failed to contact Laya service.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleRunRobustnessTest = async (schemaId: string) => {
    setIsEvaluating(true);
    setEvaluationFeedback(null);
    try {
      const res = await apiClient.post("/api/v1/ai/typed-decisions/evaluations/robustness-test/", {
        schema_id: schemaId,
        sample_context: "Patient presenting for routine triage with stable vitals.",
      });
      setEvaluationFeedback(
        `Permutation test complete: ${res.data.status} (Score: ${(res.data.robustness_score * 100).toFixed(1)}%) across ${res.data.permutations_tested} permutations.`
      );
      fetchStatus();
    } catch (err: any) {
      setEvaluationFeedback(`Evaluation failed: ${err?.response?.data?.error || err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getHealthBadge = (health?: string) => {
    switch (health) {
      case "READY":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">READY</Badge>;
      case "SUPPORTED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">SUPPORTED</Badge>;
      case "UNSUPPORTED_PLATFORM":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">UNSUPPORTED_PLATFORM</Badge>;
      case "DEPENDENCY_MISSING":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">DEPENDENCY_MISSING</Badge>;
      case "DISABLED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300">DISABLED</Badge>;
      default:
        return <Badge variant="outline">{health || "UNKNOWN"}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 space-y-8">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 bg-white p-6 rounded-xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/informaticist/models" className="hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Model Registry
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-medium">Laya-MLX Typed Decisions</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            Laya-MLX Native Runtime
            {getHealthBadge(capabilities?.health)}
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Controlled local typed-decision AI engine providing auxiliary workflow support (triage, review urgency, routing).
            Operates strictly under clinical safety oversight with zero autonomous diagnosis authority.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={isLoading}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Diagnostics
          </Button>
          <Link href="/admin/services/ai/laya">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Sliders className="h-4 w-4 mr-2" />
              Service Admin
            </Button>
          </Link>
        </div>
      </div>

      {/* Diagnostics / Alert Banner if unsupported */}
      {capabilities && !capabilities.platform_supported && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 space-y-1">
            <p className="font-semibold">Hardware Platform Notice: {capabilities.health}</p>
            <p className="text-amber-700">
              {capabilities.details ||
                "Apple MLX inference requires macOS on Apple Silicon (arm64). Current host environment is active in controlled sandbox/harness mode."}
            </p>
          </div>
        </div>
      )}

      {/* Feedback banner */}
      {evaluationFeedback && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between text-sm text-blue-800">
          <span>{evaluationFeedback}</span>
          <Button variant="ghost" size="sm" onClick={() => setEvaluationFeedback(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            Overview & Hardware
          </TabsTrigger>
          <TabsTrigger value="schemas" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            Decision Schemas ({schemas.length})
          </TabsTrigger>
          <TabsTrigger value="safety" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            Safety & Robustness Gate
          </TabsTrigger>
          <TabsTrigger value="provenance" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            Model Provenance & License
          </TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-500">Platform Capability</CardDescription>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-blue-600" />
                  {capabilities?.platform_supported ? "Apple Silicon (Metal)" : capabilities?.os || "Non-Apple-Silicon"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 space-y-1">
                <p>Architecture: <span className="font-mono font-medium text-slate-800">{capabilities?.arch || "Unknown"}</span></p>
                <p>MLX Framework: <span className="font-mono font-medium text-slate-800">{capabilities?.mlx_available ? "Installed" : "Unavailable"}</span></p>
                <p>Metal GPU Acceleration: <span className="font-mono font-medium text-slate-800">{capabilities?.gpu_metal_available ? "Available" : "No"}</span></p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-500">Pinned Checkpoint</CardDescription>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-600" />
                  convaiinnovations/laya
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 space-y-1">
                <p>Revision: <span className="font-mono text-xs text-slate-800">573e5b6 (pinned)</span></p>
                <p>Architecture: <span className="font-medium text-slate-800">ModernBERT-DecisionModel</span></p>
                <p>Parameters: <span className="font-medium text-slate-800">149M (float16)</span></p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-500">Clinical Boundary</CardDescription>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  Auxiliary CDS Only
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 space-y-1">
                <p>Primary Risk Model: <span className="font-medium text-slate-800">Scikit-Learn / SHAP</span></p>
                <p>Authoritative Store: <span className="font-medium text-slate-800">Neon PostgreSQL</span></p>
                <p>Autonomous Action: <span className="font-semibold text-rose-600">Strictly Forbidden</span></p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Engine Operating Principles</CardTitle>
              <CardDescription>
                Architectural safeguards governing typed-decision usage across HealthNova AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-1 flex-shrink-0" />
                <p><strong>Separation of Concerns:</strong> Primary clinical patient risk predictions are computed by approved supervised models (SVM, Random Forest, AdaBoost) in Neon PostgreSQL. Laya-MLX is used exclusively for auxiliary typed decisions.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-1 flex-shrink-0" />
                <p><strong>Context Minimization:</strong> Raw medical histories or direct PHI (names, addresses, national IDs) are stripped before dispatching to the decision runtime.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-1 flex-shrink-0" />
                <p><strong>Permutation Robustness:</strong> Every choice schema must pass option permutation validation before being approved for clinical operations.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Schemas */}
        <TabsContent value="schemas" className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-semibold">Clinical Decision Schema Registry</CardTitle>
                <CardDescription>Versioned typed schemas approved for clinical workflow support.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {schemas.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No decision schemas registered yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Schemas must be authored and approved by Informaticists.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Schema Name</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Options / Criteria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Robustness</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schemas.map((schema) => (
                      <TableRow key={schema.id}>
                        <TableCell className="font-medium text-slate-900">{schema.name}</TableCell>
                        <TableCell className="font-mono text-xs">{schema.version}</TableCell>
                        <TableCell><Badge variant="outline">{schema.decision_type}</Badge></TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {Array.isArray(schema.allowed_options) ? schema.allowed_options.join(", ") : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            schema.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                            schema.status === "APPROVED" ? "bg-blue-100 text-blue-800 border-blue-300" :
                            "bg-slate-100 text-slate-800"
                          }>
                            {schema.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {schema.robustness_status === "PASS" ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                              PASS ({schema.robustness_score ? (schema.robustness_score * 100).toFixed(0) : "100"}%)
                            </Badge>
                          ) : schema.robustness_status === "ROBUSTNESS_FAILED" ? (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-300">FAILED</Badge>
                          ) : (
                            <span className="text-xs text-slate-400">NOT EVALUATED</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRunRobustnessTest(schema.id)}
                            disabled={isEvaluating}
                            className="text-xs"
                          >
                            <Play className="h-3 w-3 mr-1" /> Test Robustness
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Safety */}
        <TabsContent value="safety" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Scale className="h-5 w-5 text-blue-600" />
                  Option-Order Permutation Invariant
                </CardTitle>
                <CardDescription>Defends against ordering bias in categorical choice models.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>
                  Decision models may exhibit positional bias if trained on non-shuffled outputs. HealthNova AI tests each schema by evaluating permuted orderings:
                </p>
                <div className="bg-slate-100 p-3 rounded font-mono text-xs text-slate-800 space-y-1">
                  <div>Original: [A, B, C, D]</div>
                  <div>Permutation 1: [B, A, C, D]</div>
                  <div>Permutation 2: [C, B, A, D]</div>
                  <div>Permutation 3: [D, C, B, A]</div>
                </div>
                <p>
                  If semantic decision output varies beyond the 25% threshold, the schema is marked <code>ROBUSTNESS_FAILED</code> and automatically suspended from clinical workflow use.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-indigo-600" />
                  Uncertainty & Review Thresholds
                </CardTitle>
                <CardDescription>Deterministic human review triggers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Confidence Threshold:</strong> Decisions with probability below 0.60 are marked <code>LOW_CONFIDENCE</code> and require clinician sign-off.</li>
                  <li><strong>Normalized Entropy:</strong> Decisions with Shannon entropy exceeding 0.75 are flagged as <code>PARTIALLY_SUPPORTED</code>.</li>
                  <li><strong>Human In The Loop:</strong> Advisory classifications never auto-apply clinical actions. Clinicians retain sole decision authority.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Provenance */}
        <TabsContent value="provenance" className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Attribution & Legal Notices</CardTitle>
              <CardDescription>Open-source compliance under Apache-2.0.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg font-mono text-xs space-y-2 text-slate-800">
                <p><strong>Package:</strong> laya-mlx (v0.2.0)</p>
                <p><strong>License:</strong> Apache License 2.0</p>
                <p><strong>Upstream Source:</strong> https://github.com/mizorewww/laya-mlx.git</p>
                <p><strong>Derived From:</strong> NandhaKishorM/laya (Convai Innovations and Laya contributors)</p>
                <p><strong>Upstream Revision:</strong> 573e5b62696ba441230cd6be71d593331b5d23af</p>
              </div>
              <p className="text-xs text-slate-500">
                The neural network architecture is implemented using Apple MLX following Laya ModernBERT DecisionModel.
                Model weights are version-pinned and downloaded separately from verified checkpoints.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
