"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Target,
  Search,
  RefreshCw,
  AlertTriangle,
  Play,
  CheckCircle2,
  XCircle,
  FileText,
  Sliders,
  Terminal,
  Activity,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { securityService, SecurityMetrics, SecurityScan, SecurityTarget } from "@/services/securityService";

export default function SecurityOverviewPage() {
  const [metrics, setMetrics] = React.useState<SecurityMetrics | null>(null);
  const [recentScans, setRecentScans] = React.useState<SecurityScan[]>([]);
  const [targets, setTargets] = React.useState<SecurityTarget[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const [m, s, t] = await Promise.all([
        securityService.getMetrics().catch(() => null),
        securityService.getScans().catch(() => []),
        securityService.getTargets().catch(() => []),
      ]);
      setMetrics(m);
      setRecentScans(s);
      setTargets(t);
    } catch (err) {
      console.error("Failed to load security data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <div className="space-y-6 pb-12 bg-slate-50 min-h-screen text-slate-900 p-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                DevSecOps Policy Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                Agentic-Bug-Hunter v3.42.0
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
              Controlled Security & Vulnerability Management
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Internal DevSecOps security testing layer for BPY-CSE-2666. Default-deny allowlist policy,
              7-question validation gate, synthetic test datasets, and strict isolation from clinical request paths.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/admin/security/scans">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                <Play className="w-4 h-4 mr-1.5" />
                Launch Authorized Scan
              </Button>
            </Link>
          </div>
        </div>

        {/* Subnavigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-100">
          <Link href="/admin/security/targets">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium">
              <Target className="w-4 h-4 mr-1.5 text-indigo-600" />
              Target Allowlist ({targets.length})
            </Button>
          </Link>
          <Link href="/admin/security/scans">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium">
              <Activity className="w-4 h-4 mr-1.5 text-blue-600" />
              Scans ({recentScans.length})
            </Button>
          </Link>
          <Link href="/admin/security/findings">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium">
              <ShieldAlert className="w-4 h-4 mr-1.5 text-amber-600" />
              Findings ({metrics?.validated_findings ?? 0})
            </Button>
          </Link>
          <Link href="/admin/security/tools">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium">
              <Sliders className="w-4 h-4 mr-1.5 text-purple-600" />
              Tool Inventory
            </Button>
          </Link>
          <Link href="/admin/security/audit">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium">
              <Terminal className="w-4 h-4 mr-1.5 text-slate-600" />
              Security Audit Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row (Derived Purely from DB) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Approved Targets
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {metrics ? `${metrics.approved_targets} / ${metrics.total_targets}` : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Strict default-deny. {metrics?.approved_targets ?? 0} active in allowlist.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Validated Findings
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {metrics ? metrics.validated_findings : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Passed 7-question validation gate. No theoretical noise.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Resolved / Closed
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {metrics ? metrics.resolved_findings : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Confirmed fixed via automated retest verification.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              False Positives Filtered
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-700">
              {metrics ? metrics.false_positives : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Rejected by evidence gate before clinical reporting.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scans Column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Recent Security Scans
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Controlled executions on approved environments
                </CardDescription>
              </div>
              <Link href="/admin/security/scans">
                <Button variant="outline" size="sm" className="text-xs border-slate-200 hover:bg-slate-50">
                  View All
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Loading security scan registry...
                </div>
              ) : recentScans.length === 0 ? (
                <div className="py-16 text-center px-4">
                  <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-medium text-slate-800">
                    No security scans have been executed.
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Scans can only run against authorized targets registered in the allowlist.
                    Select an approved target to begin controlled security testing.
                  </p>
                  <div className="mt-4">
                    <Link href="/admin/security/scans">
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Create First Scan
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentScans.slice(0, 5).map((scan) => (
                    <div key={scan.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">{scan.target_name}</span>
                          <Badge variant="outline" className="text-[10px] font-medium border-slate-200">
                            {scan.scan_type}
                          </Badge>
                          <Badge
                            className={`text-[10px] font-semibold ${
                              scan.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : scan.status === "RUNNING"
                                ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse"
                                : scan.status === "FAILED"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {scan.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500">
                          Initiated by {scan.initiated_by_name || "IT Admin"} • {scan.findings_count ?? 0} findings recorded
                        </div>
                      </div>

                      <Link href={`/admin/security/scans/${scan.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-800">
                          Details →
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Security Policy & Safety Invariants Column (1 col) */}
        <div className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                Healthcare Safety Boundary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-slate-600">
              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                <span className="font-semibold text-emerald-900 block mb-0.5">1. Zero Real PHI Exposure</span>
                Security agents only interact with synthetic patients and simulated vitals.
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200">
                <span className="font-semibold text-blue-900 block mb-0.5">2. Default-Deny Allowlist</span>
                Scanning arbitrary internet IPs or unapproved endpoints is strictly blocked.
              </div>
              <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-200">
                <span className="font-semibold text-purple-900 block mb-0.5">3. 7-Question Validation Gate</span>
                Eliminates theoretical noise. Findings require verifiable reproduction steps.
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200">
                <span className="font-semibold text-amber-900 block mb-0.5">4. Process & Queue Isolation</span>
                Security tasks run on isolated Celery queues with strict timeout limits (300s).
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
