"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  Play,
  ArrowLeft,
  ShieldCheck,
  Ban,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { securityService, SecurityScan, SecurityTarget } from "@/services/securityService";

export default function SecurityScansPage() {
  const [scans, setScans] = React.useState<SecurityScan[]>([]);
  const [targets, setTargets] = React.useState<SecurityTarget[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTarget, setSelectedTarget] = React.useState<string>("");
  const [scanType, setScanType] = React.useState<string>("API_SECURITY");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchData = async () => {
    try {
      const [sList, tList] = await Promise.all([
        securityService.getScans(),
        securityService.getTargets(),
      ]);
      setScans(sList);
      setTargets(tList.filter((t) => t.approval_status === "APPROVED"));
      if (tList.length > 0 && !selectedTarget) {
        setSelectedTarget(tList[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleLaunchScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget) return;

    setIsSubmitting(true);
    try {
      const newScan = await securityService.createScan({
        target: selectedTarget,
        scan_type: scanType,
      });
      await securityService.startScan(newScan.id);
      fetchData();
    } catch (e) {
      console.error("Failed to launch scan:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmergencyStop = async (scanId: string) => {
    try {
      await securityService.emergencyStop(scanId, "Manual emergency abort by administrator");
      fetchData();
    } catch (e) {
      console.error("Emergency stop failed:", e);
    }
  };

  return (
    <div className="space-y-6 pb-12 bg-slate-50 min-h-screen text-slate-900 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/security">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Overview
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Security Scans</h1>
            <p className="text-xs text-slate-500">
              Controlled DevSecOps audit executions against approved internal targets.
            </p>
          </div>
        </div>
      </div>

      {/* Launch Scan Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Play className="w-4 h-4 text-indigo-600" />
            Launch Authorized Security Audit
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Select an approved target from the allowlist to initiate isolated security testing.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLaunchScan} className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1 min-w-[240px]">
              <label className="text-xs font-semibold text-slate-700">Approved Target</label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="text-xs border border-slate-200 rounded-md p-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {targets.length === 0 ? (
                  <option value="">No approved targets available</option>
                ) : (
                  targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} [{t.environment}] ({t.protocol}://{t.hostname}:{t.port})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex flex-col gap-1 min-w-[200px]">
              <label className="text-xs font-semibold text-slate-700">Audit Type</label>
              <select
                value={scanType}
                onChange={(e) => setScanType(e.target.value)}
                className="text-xs border border-slate-200 rounded-md p-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="API_SECURITY">API Security & Injection Testing</option>
                <option value="RBAC_AUTH">5-Role Privilege Escalation & Auth Matrix</option>
                <option value="IDOR">Insecure Direct Object References (IDOR)</option>
                <option value="RECON">Attack Surface & Route Recon</option>
                <option value="COMPREHENSIVE_LAB">Full Controlled Security Lab Scan</option>
              </select>
            </div>

            <div className="flex items-end pt-5">
              <Button
                type="submit"
                disabled={!selectedTarget || isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
              >
                <Play className="w-3.5 h-3.5 mr-1.5" />
                {isSubmitting ? "Starting..." : "Start Scan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Scans Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900">Scan Execution Ledger ({scans.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading scan ledger...</div>
          ) : scans.length === 0 ? (
            <div className="py-16 text-center px-4">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-slate-800">No security scans have been executed.</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Use the form above to trigger your first authorized audit against the isolated security test lab.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-100 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">Target</th>
                    <th className="p-3">Environment</th>
                    <th className="p-3">Audit Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Findings</th>
                    <th className="p-3">Initiated By</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scans.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{s.target_name}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] border-slate-200 font-medium">
                          {s.target_environment}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600">{s.scan_type}</td>
                      <td className="p-3">
                        <Badge
                          className={`text-[10px] font-semibold ${
                            s.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : s.status === "RUNNING"
                              ? "bg-blue-100 text-blue-800 animate-pulse"
                              : s.status === "FAILED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{s.findings_count ?? 0}</td>
                      <td className="p-3 text-slate-500">{s.initiated_by_name || "Admin"}</td>
                      <td className="p-3 text-right space-x-2">
                        {s.status === "RUNNING" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleEmergencyStop(s.id)}
                            className="text-xs h-7"
                          >
                            <Ban className="w-3.5 h-3.5 mr-1" />
                            Stop
                          </Button>
                        )}
                        <Link href={`/admin/security/scans/${s.id}`}>
                          <Button size="sm" variant="ghost" className="text-xs text-indigo-600 hover:text-indigo-800 h-7">
                            View →
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
