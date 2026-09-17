"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  ShieldAlert,
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
import { securityService, SecurityScan, SecurityFinding } from "@/services/securityService";

export default function ScanDetailPage() {
  const params = useParams();
  const scanId = params?.scanId as string;
  const [scan, setScan] = React.useState<SecurityScan | null>(null);
  const [findings, setFindings] = React.useState<SecurityFinding[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    if (!scanId) return;
    try {
      const [s, fList] = await Promise.all([
        securityService.getScan(scanId),
        securityService.getFindings(),
      ]);
      setScan(s);
      setFindings(fList.filter((f) => f.scan === scanId));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStop = async () => {
    if (!scan) return;
    try {
      await securityService.emergencyStop(scan.id, "Emergency stop requested by user");
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm bg-slate-50 min-h-screen">
        Loading scan details...
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm bg-slate-50 min-h-screen">
        Scan not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 bg-slate-50 min-h-screen text-slate-900 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/security/scans">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Scans
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Scan: {scan.target_name}</h1>
            <p className="text-xs text-slate-500">Scan ID: {scan.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            onClick={async () => {
              try {
                const blob = await securityService.downloadSarif(scan.id);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `scan_${scan.id}.sarif`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (e) {
                console.error("Failed to download SARIF:", e);
              }
            }}
          >
            Export SARIF 2.1.0
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            onClick={async () => {
              try {
                const blob = await securityService.downloadReport(scan.id, "markdown");
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `scan_${scan.id}_report.md`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (e) {
                console.error("Failed to download Report:", e);
              }
            }}
          >
            Export Report (.md)
          </Button>

          {scan.status === "RUNNING" && (
            <Button variant="destructive" size="sm" onClick={handleStop}>
              <Ban className="w-4 h-4 mr-1.5" />
              Emergency Stop
            </Button>
          )}
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500 uppercase">Status</CardDescription>
            <CardTitle className="text-xl font-bold">
              <Badge
                className={`text-xs font-semibold ${
                  scan.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-800"
                    : scan.status === "RUNNING"
                    ? "bg-blue-100 text-blue-800 animate-pulse"
                    : scan.status === "FAILED"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {scan.status}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500 uppercase">Audit Type</CardDescription>
            <CardTitle className="text-base font-bold text-slate-900">{scan.scan_type}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500 uppercase">Rate Limit</CardDescription>
            <CardTitle className="text-base font-bold text-slate-900">{scan.rate_limit_rps} req/sec</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500 uppercase">Timeout Limit</CardDescription>
            <CardTitle className="text-base font-bold text-slate-900">{scan.timeout_seconds}s</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Findings on this scan */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900">Findings Detected ({findings.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {findings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Zero findings recorded for this audit.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {findings.map((f) => (
                <div key={f.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{f.title}</span>
                      <Badge
                        className={`text-[10px] font-semibold ${
                          f.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : f.severity === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {f.severity}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-slate-200 font-mono">
                        {f.vulnerability_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">{f.affected_endpoint}</p>
                  </div>
                  <Link href={`/admin/security/findings/${f.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-800">
                      View Finding →
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
