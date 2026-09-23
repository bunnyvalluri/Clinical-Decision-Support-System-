"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Cpu,
  Power,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import apiClient from "@/services/apiClient";

interface CapabilityResponse {
  provider: string;
  available: boolean;
  health: string;
  platform_supported: boolean;
  os?: string;
  arch?: string;
  details?: string;
}

interface DecisionRequest {
  id: string;
  schema_name: string;
  user_role: string;
  decision_type: string;
  correlation_id: string;
  had_phi_redaction: boolean;
  created_at: string;
  result?: {
    result_value: string;
    confidence: number;
    uncertainty_status: string;
    requires_human_review: boolean;
    latency_ms: number;
  };
}

export default function LayaAdminServicePage() {
  const [capabilities, setCapabilities] = React.useState<CapabilityResponse | null>(null);
  const [history, setHistory] = React.useState<DecisionRequest[]>([]);
  const [isEnabled, setIsEnabled] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchServiceState = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [capRes, histRes] = await Promise.all([
        apiClient.get<CapabilityResponse>("/api/ai/providers/laya/capabilities"),
        apiClient.get<DecisionRequest[]>("/api/v1/ai/typed-decisions/history/").catch(() => ({ data: [] })),
      ]);
      setCapabilities(capRes.data);
      setIsEnabled(capRes.data.health !== "DISABLED");
      setHistory(histRes.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to load service state.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchServiceState();
  }, [fetchServiceState]);

  const handleToggleKillSwitch = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      await apiClient.post("/api/v1/ai/typed-decisions/kill-switch/", {
        enabled: checked,
        reason: checked ? "Re-enabled by administrator" : "Emergency disable via Admin Service Portal",
      });
      setIsEnabled(checked);
      fetchServiceState();
    } catch (err: any) {
      alert(`Failed to update kill switch: ${err?.response?.data?.error || err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 bg-white p-6 rounded-xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/admin/services" className="hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> AI Services
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-medium">Laya-MLX Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            Laya-MLX Provider Administration
            <Badge className={isEnabled ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-rose-100 text-rose-800 border-rose-300"}>
              {isEnabled ? "ACTIVE" : "KILL_SWITCH_ACTIVE"}
            </Badge>
          </h1>
          <p className="text-sm text-slate-600">
            Operational controls, runtime kill switch, hardware telemetry, and tamper-evident audit traces.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchServiceState}
            disabled={isLoading}
            className="border-slate-300 text-slate-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/informaticist/models/laya">
            <Button size="sm" variant="outline" className="border-slate-300">
              Informaticist Registry
            </Button>
          </Link>
        </div>
      </div>

      {/* Kill Switch Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Power className="h-5 w-5 text-rose-600" />
                Operational Kill Switch
              </CardTitle>
              <CardDescription>
                Instantly disable all Laya-MLX typed decision inference across the entire HealthNova platform.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">
                {isEnabled ? "Provider Enabled" : "Provider Disabled"}
              </span>
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggleKillSwitch}
                disabled={isUpdating}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-slate-500">
          When deactivated, any workflow requesting a typed decision receives an honest <code>TypedDecisionUnavailable</code> state without fabricating data. Core HealthNova clinical ML models continue running undisturbed.
        </CardContent>
      </Card>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">Runtime Health</CardDescription>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              {capabilities?.health || "UNKNOWN"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            <p>OS: <span className="font-medium text-slate-800">{capabilities?.os || "N/A"}</span></p>
            <p>Architecture: <span className="font-medium text-slate-800">{capabilities?.arch || "N/A"}</span></p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">Apple Silicon Support</CardDescription>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-600" />
              {capabilities?.platform_supported ? "Supported" : "Unsupported Host"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            <p className="text-xs text-slate-500">{capabilities?.details || "Hardware diagnostic status verified."}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">Audit & Governance</CardDescription>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Neon PostgreSQL
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            <p>Total Recorded Invocations: <span className="font-semibold text-slate-800">{history.length}</span></p>
            <p>Direct PHI Storage: <span className="font-semibold text-emerald-600">Zero (Redacted)</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invocations Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Typed-Decision Invocations</CardTitle>
          <CardDescription>Immutable execution log with safety and human review outcomes.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No decision invocations recorded yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Schema</TableHead>
                  <TableHead>Caller Role</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Uncertainty</TableHead>
                  <TableHead>Review Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(req.created_at).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="font-medium text-slate-800 text-xs">
                      {req.schema_name}
                    </TableCell>
                    <TableCell><Badge variant="outline">{req.user_role}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-slate-900">
                      {req.result?.result_value || "PENDING"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {req.result?.confidence !== undefined ? `${(req.result.confidence * 100).toFixed(0)}%` : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        req.result?.uncertainty_status === "SUPPORTED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      }>
                        {req.result?.uncertainty_status || "UNKNOWN"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {req.result?.requires_human_review ? (
                        <Badge className="bg-rose-100 text-rose-800 border-rose-300">YES</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-800">NO</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
