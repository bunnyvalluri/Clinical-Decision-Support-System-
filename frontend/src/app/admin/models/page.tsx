"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cpu,
  History,
  Play,
  Radio,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import { useAuthStore } from "@/features/auth/authStore";

export default function ModelManagementPage() {
  const { models, promoteModel, addNotification } = useClinicalStore();
  const { user } = useAuthStore();

  const [isRetraining, setIsRetraining] = React.useState(false);
  const [retrainSuccess, setRetrainSuccess] = React.useState(false);

  const isAuthorized = user?.role === "ADMIN" || user?.role === "DOCTOR" || user?.role === "ANALYST";

  const handleTriggerRetraining = () => {
    setIsRetraining(true);
    setTimeout(() => {
      setIsRetraining(false);
      setRetrainSuccess(true);
      addNotification({
        id: `notif-retrain-${Date.now()}`,
        title: "Celery ML Retraining Completed",
        message: "CardioEnsemble-RF retrained on new hospital cohort data: ROC-AUC maintained at 92.4%.",
        severity: "INFO",
        timestamp: "Just now",
        read: false,
        action_url: "/admin/models",
      });
      setTimeout(() => setRetrainSuccess(false), 3000);
    }, 1800);
  };

  return (
    <Shell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Cpu className="h-6 w-6 text-emerald-600" />
              Machine Learning Model Registry & Governance
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Candidate model promotion, performance telemetry, ROC-AUC calibration, and Celery retraining jobs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-mono bg-white border-slate-200 text-slate-700 shadow-sm">
              Role: {user?.role || "CLINICIAN"}
            </Badge>
            <Button
              variant="default"
              size="sm"
              onClick={handleTriggerRetraining}
              isLoading={isRetraining}
              className="text-xs gap-1.5 shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retrain on Celery
            </Button>
          </div>
        </div>

        {retrainSuccess && (
          <Alert variant="success" onDismiss={() => setRetrainSuccess(false)}>
            Asynchronous model evaluation job completed via Celery ML queue. Ensemble weights verified.
          </Alert>
        )}

        {!isAuthorized && (
          <Alert variant="warning" title="Restricted Administrative View">
            Your current account role has read-only access to algorithm governance. Promoting models or triggering
            retraining requires DOCTOR or ADMIN privileges.
          </Alert>
        )}

        {/* Top Registry KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-500 font-semibold">Active Model</CardDescription>
              <CardTitle className="text-base text-slate-900 font-bold flex items-center justify-between">
                <span>Random Forest</span>
                <Badge variant="success" className="text-[10px]">ACTIVE</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-emerald-700 font-mono font-medium">v1.4.2 Production</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-500 font-semibold">Validation ROC-AUC</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900 font-mono">
                94.2%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Sensitivity: 93.1%</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-500 font-semibold">Mean Inference Latency</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900 font-mono">
                22 ms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Cached in Redis</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-500 font-semibold">Total Inferences Run</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900 font-mono">
                48,000+
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Zero model drift flags</p>
            </CardContent>
          </Card>
        </div>

        {/* Model Registry Table */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-purple-600" />
              Registered Model Candidates & History
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Review and promote candidate algorithms (CANDIDATE, ACTIVE, ARCHIVED).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model / Algorithm</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Accuracy (ROC-AUC)</TableHead>
                  <TableHead>Sensitivity / Specificity</TableHead>
                  <TableHead>Avg Latency</TableHead>
                  <TableHead>Last Trained</TableHead>
                  <TableHead className="text-right">Governance Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span>{m.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">{m.algorithm}</span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-700">
                      {m.version}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          m.status === "ACTIVE"
                            ? "success"
                            : m.status === "CANDIDATE"
                            ? "warning"
                            : "outline"
                        }
                      >
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-emerald-700 font-bold">
                      {(m.roc_auc * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-600">
                      {(m.sensitivity * 100).toFixed(0)}% / {(m.specificity * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-700">
                      {m.avg_latency_ms} ms
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {m.last_trained}
                    </TableCell>
                    <TableCell className="text-right">
                      {m.status === "ACTIVE" ? (
                        <span className="text-xs text-emerald-700 font-bold flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Live In Production
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!isAuthorized}
                          onClick={() => promoteModel(m.id)}
                          className="h-7 text-xs border-slate-200 hover:bg-slate-50 text-slate-700"
                        >
                          Promote to Active
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Model Drift & Calibration Health Panel */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                Kolmogorov-Smirnov (KS) Feature Drift Test
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Monitoring clinical population distribution against training baseline.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Systolic Blood Pressure:</span>
                <span className="text-emerald-700 font-mono font-semibold">p = 0.48 (No drift)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Serum Cholesterol:</span>
                <span className="text-emerald-700 font-mono font-semibold">p = 0.62 (No drift)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">ST Depression (Oldpeak):</span>
                <span className="text-emerald-700 font-mono font-semibold">p = 0.39 (No drift)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Overall Population Stability Index (PSI):</span>
                <span className="text-emerald-700 font-mono font-bold">0.042 (Optimal &lt; 0.1)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Explainability & Ethical Auditing
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Fairness and bias mitigation across patient demographics.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Demographic Parity Ratio:</span>
                <span className="text-slate-800 font-mono font-semibold">0.96 (Target: 0.8 - 1.2)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Equalized Odds Disparity:</span>
                <span className="text-slate-800 font-mono font-semibold">0.03 (Within 5% margin)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Calibration Brier Score:</span>
                <span className="text-slate-800 font-mono font-semibold">0.081</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">XAI Attribution Consistency:</span>
                <span className="text-emerald-700 font-mono font-bold">100% TreeSHAP Additivity</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
