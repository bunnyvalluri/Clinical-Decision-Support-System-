"use client";

import { ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

interface AuditLogEntry {
  id?: string;
  action_type?: string;
  action?: string;
  user_email?: string;
  user?: string;
  resource_type?: string;
  created_at?: string;
}

export default function InformaticistAuditPage() {
  const { auditLogs } = useClinicalStore();
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
      {auditLogs && auditLogs.length > 0 ? (
        <div className="space-y-2">
          {(auditLogs as AuditLogEntry[]).slice(0, 20).map((log: AuditLogEntry, i: number) => (
            <div key={log.id ?? i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
              <ClipboardCheck className="h-5 w-5 text-purple-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{log.action_type || log.action}</p>
                <p className="text-xs text-slate-500">{log.user_email || log.user} · {log.resource_type}</p>
              </div>
              <span className="text-xs text-slate-400">{log.created_at ? new Date(log.created_at).toLocaleString() : ""}</span>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Audit log will populate as actions are performed.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
