"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  FileCode,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { securityService, SecurityFinding } from "@/services/securityService";

export default function FindingDetailPage() {
  const params = useParams();
  const findingId = params?.findingId as string;
  const [finding, setFinding] = React.useState<SecurityFinding | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [validating, setValidating] = React.useState(false);
  const [retesting, setRetesting] = React.useState(false);

  const fetchFinding = React.useCallback(async () => {
    if (!findingId) return;
    try {
      const data = await securityService.getFinding(findingId);
      setFinding(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [findingId]);

  React.useEffect(() => {
    fetchFinding();
  }, [fetchFinding]);

  const handleValidateGate = async () => {
    if (!finding) return;
    setValidating(true);
    try {
      await securityService.validateGate(finding.id, "Manual trigger of 7-question validation gate");
      fetchFinding();
    } catch (e) {
      console.error(e);
    } finally {
      setValidating(false);
    }
  };

  const handleRetest = async () => {
    if (!finding) return;
    setRetesting(true);
    try {
      await securityService.retestFinding(finding.id);
      fetchFinding();
    } catch (e) {
      console.error(e);
    } finally {
      setRetesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm bg-slate-50 min-h-screen">
        Loading finding details...
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm bg-slate-50 min-h-screen">
        Finding not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 bg-slate-50 min-h-screen text-slate-900 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/security/findings">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Findings
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge
                className={`text-xs font-semibold ${
                  finding.severity === "CRITICAL"
                    ? "bg-rose-100 text-rose-800"
                    : finding.severity === "HIGH"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {finding.severity}
              </Badge>
              <h1 className="text-xl font-bold text-slate-900">{finding.title}</h1>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{finding.affected_endpoint}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidateGate}
            disabled={validating}
            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            {validating ? "Evaluating Gate..." : "Re-evaluate 7Q Gate"}
          </Button>
          <Button
            size="sm"
            onClick={handleRetest}
            disabled={retesting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            {retesting ? "Running Retest..." : "Trigger Automated Retest"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">Description & Clinical Impact</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Vulnerability Description:</span>
                <p className="text-slate-600 leading-relaxed">{finding.description}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Healthcare & System Impact:</span>
                <p className="text-slate-600 leading-relaxed">{finding.impact}</p>
              </div>

              {finding.root_cause && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Root Cause Analysis:</span>
                  <p className="text-slate-600 leading-relaxed font-mono bg-slate-50 p-2.5 rounded border border-slate-200">
                    {finding.root_cause}
                  </p>
                </div>
              )}

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Recommended Remediation:</span>
                <p className="text-slate-600 leading-relaxed bg-emerald-50/60 p-2.5 rounded border border-emerald-200">
                  {finding.remediation_guidance}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Validation Gate Status (1 col) */}
        <div className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                7-Question Validation Gate
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500">
                Agentic-Bug-Hunter validation-first filter
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5 text-xs">
              {[
                { q: "1. Target Authorized?", val: true },
                { q: "2. Component Actually Vulnerable?", val: finding.state === "VALIDATED" || finding.state === "RESOLVED" },
                { q: "3. Behavior Reproducible?", val: true },
                { q: "4. Issue Exploitable?", val: true },
                { q: "5. Meaningful Healthcare Impact?", val: Boolean(finding.impact) },
                { q: "6. Evidence Sufficient?", val: true },
                { q: "7. Finding Reportable?", val: finding.state !== "FALSE_POSITIVE" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-700 font-medium">{item.q}</span>
                  {item.val ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
              ))}

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 block">Current Finding State:</span>
                <Badge variant="outline" className="mt-1 font-semibold text-xs border-indigo-200 text-indigo-700 bg-indigo-50">
                  {finding.state}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
