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
  Globe2,
  HelpCircle,
  Layers,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TableProperties,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import apiClient from "@/services/apiClient";

interface LanguageEvaluation {
  id: string;
  language_code: string;
  language_name: string;
  checkpoint: string;
  accuracy: number | null;
  calibration_error: number | null;
  confidence_mean: number | null;
  abstention_rate: number | null;
  sample_size: number;
  is_clinically_validated: boolean;
  status: string;
}

interface ProviderCapabilities {
  default_provider: string;
  providers: {
    laya: any;
    laya_mlx: any;
  };
  timestamp: string;
}

export default function LayaEvaluationCenterPage() {
  const [languages, setLanguages] = React.useState<LanguageEvaluation[]>([]);
  const [capabilities, setCapabilities] = React.useState<ProviderCapabilities | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("multilingual");

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [langRes, capRes] = await Promise.all([
        apiClient.get<LanguageEvaluation[]>("/api/ai/evaluations/laya"),
        apiClient.get<ProviderCapabilities>("/api/ai/providers/capabilities"),
      ]);
      setLanguages(langRes.data || []);
      setCapabilities(capRes.data || null);
    } catch (err: any) {
      console.error("Failed to load evaluation data:", err);
      setError(err?.response?.data?.error || err.message || "Failed to load evaluation records.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 space-y-8">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 bg-white p-6 rounded-xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/informaticist/ai-evaluation" className="hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> AI Evaluation Center
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-medium">Laya Multilingual Evaluation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            Laya Multilingual & Typed-Decision Evaluation
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">Prompt 69 Standards</Badge>
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Empirical validation benchmarks across Indic & global languages, script routing fidelity, option-order robustness, and calibration diagnostics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="border-slate-300 text-slate-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Benchmarks
          </Button>
          <Link href="/informaticist/models/laya">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              Model Registry
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-lg">
          <TabsTrigger value="multilingual" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            Multilingual Language Matrix ({languages.length})
          </TabsTrigger>
          <TabsTrigger value="comparison" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            Provider Comparison (Laya vs Laya-MLX)
          </TabsTrigger>
          <TabsTrigger value="routing" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            Script & Language Router Invariants
          </TabsTrigger>
        </TabsList>

        {/* Tab: Multilingual Matrix */}
        <TabsContent value="multilingual" className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-blue-600" />
                Language-Specific Evaluation & Validation Matrix
              </CardTitle>
              <CardDescription>
                Zero-fabrication status: languages without empirical evaluation datasets explicitly display <strong>NOT EVALUATED</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Language</TableHead>
                    <TableHead>ISO Code</TableHead>
                    <TableHead>Target Checkpoint</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>ECE Calibration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clinical Validation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {languages.map((lang) => (
                    <TableRow key={lang.id}>
                      <TableCell className="font-medium text-slate-900">{lang.language_name}</TableCell>
                      <TableCell className="font-mono text-xs">{lang.language_code}</TableCell>
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {lang.checkpoint.replace("convaiinnovations/", "")}
                      </TableCell>
                      <TableCell>
                        {lang.accuracy !== null ? (
                          <span className="font-semibold text-emerald-700">{(lang.accuracy * 100).toFixed(1)}%</span>
                        ) : (
                          <span className="text-xs text-slate-400">NOT EVALUATED</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lang.calibration_error !== null ? (
                          <span className="text-xs font-mono text-slate-700">{lang.calibration_error.toFixed(3)}</span>
                        ) : (
                          <span className="text-xs text-slate-400">NOT EVALUATED</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lang.status === "EVALUATED" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">EVALUATED</Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 border-slate-300">NOT EVALUATED</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {lang.is_clinically_validated ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" /> Validated
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                            Workflow Only
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Provider Comparison */}
        <TabsContent value="comparison" className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TableProperties className="h-5 w-5 text-indigo-600" />
                Factual Provider Compatibility Comparison
              </CardTitle>
              <CardDescription>
                Architectural selection governed by deployment platform, hardware capability, and language scope.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dimension</TableHead>
                    <TableHead>Laya (NandhaKishorM/laya)</TableHead>
                    <TableHead>Laya-MLX (mizorewww/laya-mlx)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold text-slate-800">Primary Role</TableCell>
                    <TableCell>Multilingual Typed Decisions (100+ languages)</TableCell>
                    <TableCell>Apple Silicon Native Local Typed Decisions</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-slate-800">Runtime Engine</TableCell>
                    <TableCell>PyTorch / Transformers / Pure-Python Router</TableCell>
                    <TableCell>Apple MLX / Metal GPU Acceleration</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-slate-800">Platform Requirements</TableCell>
                    <TableCell>Platform-agnostic (Linux, Docker, Windows, macOS)</TableCell>
                    <TableCell>Strictly macOS on Apple Silicon (arm64)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-slate-800">Supported Scripts</TableCell>
                    <TableCell>Latin, Devanagari, Telugu, Tamil, Bengali, etc.</TableCell>
                    <TableCell>Primarily English Latin (ModernBERT)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-slate-800">Default Checkpoint</TableCell>
                    <TableCell className="font-mono text-xs">convaiinnovations/laya-multilingual</TableCell>
                    <TableCell className="font-mono text-xs">convaiinnovations/laya</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-slate-800">Failover Policy</TableCell>
                    <TableCell>Universal fallback for non-Apple environments</TableCell>
                    <TableCell>High-speed local execution on Apple devices</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Routing */}
        <TabsContent value="routing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Script-First Routing Principle
                </CardTitle>
                <CardDescription>Prevents checkpoint collapse on non-Latin scripts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>
                  Upstream benchmarks on MASSIVE (14 languages) demonstrated that English checkpoints collapse to near-random on non-Latin scripts (Hindi: 0.100, Tamil: 0.113 vs 0.050 random), while falsely reporting high confidence.
                </p>
                <p>
                  HealthNova AI enforces <strong>script-first routing</strong>: any clinical context containing Devanagari, Telugu, Tamil, Bengali, Malayalam, or Kannada Unicode characters is automatically routed to <code>convaiinnovations/laya-multilingual</code>.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Scale className="h-5 w-5 text-indigo-600" />
                  Human Review & Uncertainty Gate
                </CardTitle>
                <CardDescription>Enforces human clinical sign-off for ambiguous contexts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Decisions in non-evaluated languages flag <code>UNSUPPORTED_LANGUAGE</code> or <code>REQUIRES_REVIEW</code>.</li>
                  <li>Confidence below 0.60 or Shannon entropy exceeding 0.75 triggers mandatory clinician review.</li>
                  <li>AI never issues autonomous diagnoses or prescriptions.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
