"use client";

import * as React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Key,
  Lock,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SecurityEvent {
  id: string;
  timestamp: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  type: string;
  details: string;
  sourceIp: string;
  actionTaken: string;
}

const SECURITY_METRICS = [
  { label: "TLS In-Transit", value: "TLS 1.3 Strict", status: "COMPLIANT", icon: Lock },
  { label: "Password Hashing", value: "Argon2id (m=65536, t=3)", status: "SECURE", icon: Key },
  { label: "Rate Limiting", value: "100 req/min per IP", status: "ACTIVE", icon: ShieldCheck },
  { label: "HIPAA Audit Log", value: "Append-Only Immutable", status: "ENFORCED", icon: FileCheck },
];

const SECURITY_EVENTS: SecurityEvent[] = [
  {
    id: "sec-401",
    timestamp: "2026-09-13 17:14:02",
    severity: "HIGH",
    type: "Excessive Failed Logins",
    details: "5 consecutive failed authentication attempts on user dr.elena.vance@hospital.org",
    sourceIp: "192.168.1.104",
    actionTaken: "IP temporarily rate-limited for 15 minutes",
  },
  {
    id: "sec-402",
    timestamp: "2026-09-13 16:50:31",
    severity: "MEDIUM",
    type: "New Device Session",
    details: "Physician account signed in from unverified device (Mac OS X - Chrome 128)",
    sourceIp: "10.240.12.84",
    actionTaken: "Email notification dispatched to account owner",
  },
  {
    id: "sec-403",
    timestamp: "2026-09-13 15:30:19",
    severity: "LOW",
    type: "Token Refresh",
    details: "Valid refresh token cycle executed for Sarah Jenkins (RN)",
    sourceIp: "10.240.14.12",
    actionTaken: "New JWT access token issued (15 min expiry)",
  },
  {
    id: "sec-404",
    timestamp: "2026-09-13 14:12:00",
    severity: "CRITICAL",
    type: "Unauthorized Admin Route Probe",
    details: "GET /admin/database probe from non-admin role account (CLINICIAN)",
    sourceIp: "10.240.18.99",
    actionTaken: "HTTP 403 Forbidden returned; incident recorded to audit ledger",
  },
];

export default function AdminSecurityPage() {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredEvents = SECURITY_EVENTS.filter(
    (e) =>
      e.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.sourceIp.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-slate-800" />
            Security & Access Operations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time intrusion detection, cryptographic controls, and role privilege boundary monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-200">
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            Refresh Signals
          </Button>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
            SOC2 / HIPAA Compliant
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SECURITY_METRICS.map(({ label, value, status, icon: Icon }) => (
          <Card key={label} className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-slate-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 truncate">{label}</p>
                <p className="text-sm font-bold text-slate-900 truncate">{value}</p>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{status}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Security Incident & Access Events</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Live intrusion detection alerts and perimeter access attempts.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Filter security events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Source IP</TableHead>
                <TableHead className="text-right">Action Taken</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((evt) => (
                <TableRow key={evt.id}>
                  <TableCell className="text-xs font-mono text-slate-500 whitespace-nowrap">{evt.timestamp}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        evt.severity === "CRITICAL"
                          ? "destructive"
                          : evt.severity === "HIGH"
                          ? "destructive"
                          : evt.severity === "MEDIUM"
                          ? "warning"
                          : "outline"
                      }
                      className="text-[10px]"
                    >
                      {evt.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-900 whitespace-nowrap">{evt.type}</TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-md">{evt.details}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-500">{evt.sourceIp}</TableCell>
                  <TableCell className="text-xs text-right font-medium text-slate-700 whitespace-nowrap">
                    {evt.actionTaken}
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
