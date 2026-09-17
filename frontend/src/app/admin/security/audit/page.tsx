"use client";

import * as React from "react";
import Link from "next/link";
import {
  Terminal,
  ArrowLeft,
  ShieldCheck,
  Clock,
  User,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { securityService } from "@/services/securityService";

export default function SecurityAuditLedgerPage() {
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    securityService
      .getAuditLogs()
      .then((data) => setAuditLogs(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

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
            <h1 className="text-2xl font-bold text-slate-900">Security Audit Ledger</h1>
            <p className="text-xs text-slate-500">
              Immutable chronological record of security operations, target approvals, and scan executions.
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900">
            Audit Events ({auditLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading audit events...</div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No security audit events recorded.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono border-slate-200">
                        {log.event_type}
                      </Badge>
                      <span className="font-semibold text-xs text-slate-900">{log.target_name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Actor: {log.actor_name || "System"} • IP: {log.ip_address || "127.0.0.1"}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
