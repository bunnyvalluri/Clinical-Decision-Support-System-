"use client";

import * as React from "react";
import Link from "next/link";
import {
  Target,
  ShieldCheck,
  ShieldAlert,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Ban,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { securityService, SecurityTarget } from "@/services/securityService";

export default function SecurityTargetsPage() {
  const [targets, setTargets] = React.useState<SecurityTarget[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchTargets = async () => {
    try {
      const data = await securityService.getTargets();
      setTargets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTargets();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await securityService.approveTarget(id);
      fetchTargets();
    } catch (e) {
      console.error("Failed to approve target:", e);
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
            <h1 className="text-2xl font-bold text-slate-900">Target Allowlist Registry</h1>
            <p className="text-xs text-slate-500">
              Default-deny policy: Scans are strictly blocked unless target is registered and approved.
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900">Registered Targets ({targets.length})</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Authorized endpoints eligible for controlled security audits.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading allowlist targets...</div>
          ) : targets.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No targets registered in allowlist.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-100 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">Target Name</th>
                    <th className="p-3">Environment</th>
                    <th className="p-3">Endpoint</th>
                    <th className="p-3">Allowed Scope</th>
                    <th className="p-3">Approval Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {targets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{t.name}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            t.environment === "PRODUCTION"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : t.environment === "SECURITY_TEST"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {t.environment}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {t.protocol}://{t.hostname}:{t.port}
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{t.scope}</td>
                      <td className="p-3">
                        <Badge
                          className={`text-[10px] font-semibold ${
                            t.approval_status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {t.approval_status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {t.approval_status !== "APPROVED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(t.id)}
                            className="text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                          >
                            Approve Target
                          </Button>
                        )}
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
