"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Filter,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/features/auth/authStore";

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actor_role: string;
  action: string;
  resource: string;
  status: "SUCCESS" | "WARNING" | "FAILED";
  ip_address: string;
}

export default function AuditLogsPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = React.useState("");

  const auditData: AuditEntry[] = [
    {
      id: "aud-901",
      timestamp: "2026-09-13 16:42:10",
      actor: "Dr. Elena Vance, MD",
      actor_role: "DOCTOR",
      action: "PREDICTION_EVALUATED",
      resource: "Prediction / MRN-90241",
      status: "SUCCESS",
      ip_address: "10.240.12.84",
    },
    {
      id: "aud-902",
      timestamp: "2026-09-13 16:38:05",
      actor: "Dr. Elena Vance, MD",
      actor_role: "DOCTOR",
      action: "PHYSICIAN_OVERRIDE",
      resource: "Prediction / MRN-39201",
      status: "WARNING",
      ip_address: "10.240.12.84",
    },
    {
      id: "aud-903",
      timestamp: "2026-09-13 16:20:19",
      actor: "Sarah Jenkins, RN",
      actor_role: "NURSE",
      action: "VITALS_RECORDED",
      resource: "Encounter / MRN-48192",
      status: "SUCCESS",
      ip_address: "10.240.14.12",
    },
    {
      id: "aud-904",
      timestamp: "2026-09-13 15:55:40",
      actor: "Hospital Administrator",
      actor_role: "ADMIN",
      action: "MODEL_PROMOTED",
      resource: "CardioEnsemble-RF v1.4.2",
      status: "SUCCESS",
      ip_address: "10.240.0.4",
    },
    {
      id: "aud-905",
      timestamp: "2026-09-13 15:10:02",
      actor: "Celery Worker #2",
      actor_role: "SYSTEM",
      action: "REPORT_COMPILED",
      resource: "PDF Report / MRN-90241",
      status: "SUCCESS",
      ip_address: "127.0.0.1",
    },
    {
      id: "aud-906",
      timestamp: "2026-09-13 14:02:11",
      actor: "Anonymous User",
      actor_role: "UNKNOWN",
      action: "LOGIN_FAILED",
      resource: "Auth / Gateway",
      status: "FAILED",
      ip_address: "192.168.1.104",
    },
  ];

  const filteredLogs = auditData.filter((l) => {
    const term = searchTerm.toLowerCase();
    return (
      l.actor.toLowerCase().includes(term) ||
      l.action.toLowerCase().includes(term) ||
      l.resource.toLowerCase().includes(term) ||
      l.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200">
                <ArrowLeft className="h-4 w-4 text-slate-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-purple-600" />
                HIPAA Audit Logs & Immutable Event Ledger
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Cryptographically tracked clinical encounters, prediction access, and role activity.
              </p>
            </div>
          </div>

          <Badge variant="outline" className="text-xs font-mono bg-white border-slate-200 text-slate-700 shadow-sm self-start sm:self-auto">
            Audit Retention: 7 Years (HIPAA Compliance)
          </Badge>
        </div>

        {/* Search Toolbar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search audit trail by actor, action, resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredLogs.length} verified events
          </span>
        </div>

        {/* Audit Table */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor / Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Outcome Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono text-slate-500">
                      {log.timestamp}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-900 text-xs">{log.actor}</div>
                      <span className="text-[10px] font-mono text-slate-400">{log.actor_role}</span>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-slate-800">
                      {log.action}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-medium">
                      {log.resource}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-400">
                      {log.ip_address}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          log.status === "SUCCESS"
                            ? "success"
                            : log.status === "WARNING"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
  );
}
