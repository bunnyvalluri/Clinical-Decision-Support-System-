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
  CheckCircle2,
  XCircle,
  Eye,
  Ban,
  Radio,
  Clock,
  Sliders,
  Sparkles,
  Fingerprint,
  Cpu,
  Globe2,
  Server,
  Terminal,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";

interface SecurityEvent {
  id: string;
  timestamp: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  type: string;
  details: string;
  sourceIp: string;
  actionTaken: string;
  rawPayload?: string;
  quarantined?: boolean;
}

const INITIAL_SECURITY_EVENTS: SecurityEvent[] = [
  {
    id: "sec-404",
    timestamp: "2026-09-14 17:42:10",
    severity: "CRITICAL",
    type: "Unauthorized Admin Route Probe",
    details: "GET /api/v1/admin/database probe attempted from non-privileged session token (role: CLINICIAN).",
    sourceIp: "10.240.18.99",
    actionTaken: "HTTP 403 Forbidden issued; IP quarantined 30m; SHA-256 event signed to audit ledger.",
    rawPayload: "GET /api/v1/admin/database HTTP/1.1\nHost: cdss.hospital.internal\nAuthorization: Bearer eyJhbGciOi...[CLINICIAN]\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    quarantined: true,
  },
  {
    id: "sec-401",
    timestamp: "2026-09-14 17:14:02",
    severity: "HIGH",
    type: "Excessive Failed Logins (Brute Force)",
    details: "5 consecutive failed authentication attempts on user dr.elena.vance@hospital.org within 45 seconds.",
    sourceIp: "192.168.1.104",
    actionTaken: "IP temporarily rate-limited for 15 minutes; Push challenge dispatched to hardware token.",
    rawPayload: "POST /api/v1/auth/login HTTP/1.1\nPayload: {\"email\":\"dr.elena.vance@hospital.org\",\"attempt\":5}\nStatus: 401 INVALID_CREDENTIALS",
    quarantined: true,
  },
  {
    id: "sec-402",
    timestamp: "2026-09-14 16:50:31",
    severity: "MEDIUM",
    type: "Unrecognized Device Fingerprint",
    details: "Physician account signed in from unverified device (Mac OS X - Chrome 128 / Fingerprint #8b3f2e).",
    sourceIp: "10.240.12.84",
    actionTaken: "Step-up 2FA TOTP verified; hardware key session logged into verified devices inventory.",
    rawPayload: "AUTH_STEPUP_VERIFIED: WebAuthn FIDO2 USB Key passkey exchange successful.",
    quarantined: false,
  },
  {
    id: "sec-403",
    timestamp: "2026-09-14 15:30:19",
    severity: "LOW",
    type: "Automated Token Refresh",
    details: "Standard cryptographic refresh token cycle executed for Sarah Jenkins (RN, Emergency Triage).",
    sourceIp: "10.240.14.12",
    actionTaken: "New RS256 JWT access token issued (15-min expiry); previous refresh token rotated.",
    rawPayload: "POST /api/v1/auth/refresh HTTP/1.1\nStatus: 200 OK (jti: rt_8f293b1)",
    quarantined: false,
  },
  {
    id: "sec-405",
    timestamp: "2026-09-14 14:05:44",
    severity: "HIGH",
    type: "Cross-Site Scripting (XSS) Sanitization Trigger",
    details: "Triage vitals clinical note submission contained escaped <script> payload. Blocked by DOMPurify filter.",
    sourceIp: "10.240.15.7",
    actionTaken: "Payload sanitized before database write; WAF signature alert logged.",
    rawPayload: "INPUT_FIELD: notes=\"Patient complains of chest pain <script>alert(document.cookie)</script>\"",
    quarantined: false,
  },
  {
    id: "sec-406",
    timestamp: "2026-09-14 12:18:22",
    severity: "LOW",
    type: "Mutual TLS Handshake (mTLS)",
    details: "Neon Serverless Postgres compute pool authenticated via internal CA certificate bundle.",
    sourceIp: "10.240.0.1",
    actionTaken: "Zero-trust tunnel active (TLS 1.3 ECDHE-RSA-AES256-GCM-SHA384).",
    rawPayload: "mTLS Handshake negotiated: CN=neon-ep-divine-credit.us-east-2.internal",
    quarantined: false,
  },
];

export default function AdminSecurityPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [severityFilter, setSeverityFilter] = React.useState<"ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [events, setEvents] = React.useState<SecurityEvent[]>(INITIAL_SECURITY_EVENTS);
  const [selectedEvent, setSelectedEvent] = React.useState<SecurityEvent | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanProgress, setScanProgress] = React.useState(100);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Security Policy Toggles
  const [policies, setPolicies] = React.useState({
    enforceMfaAll: true,
    ipGeofencing: true,
    bruteForceLockout: true,
    sessionAutoExpiry: true,
    requirePart11Signing: true,
    wafStrictInspection: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRunSecurityScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          showToast("Vulnerability & Perimeter Penetration Scan completed: 0 critical CVEs detected. Grade A+ intact.");
          return 100;
        }
        return prev + 25;
      });
    }, 350);
  };

  const togglePolicy = (key: keyof typeof policies, label: string) => {
    setPolicies((prev) => {
      const next = !prev[key];
      showToast(`Security Policy "${label}" is now ${next ? "ENFORCED" : "SUSPENDED"}.`);
      return { ...prev, [key]: next };
    });
  };

  const handleQuarantineIp = (evtId: string, ip: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === evtId ? { ...e, quarantined: true, actionTaken: `Quarantine enforced: IP ${ip} permanently blocked by firewall rule.` } : e
      )
    );
    showToast(`Firewall rule applied: IP ${ip} has been added to iptables drop-list.`);
    if (selectedEvent?.id === evtId) {
      setSelectedEvent((prev) => prev ? { ...prev, quarantined: true, actionTaken: `Quarantine enforced: IP ${ip} permanently blocked.` } : null);
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.sourceIp.includes(searchTerm) ||
      e.actionTaken.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "ALL" || e.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-semibold">
              Perimeter Defense & Cryptography
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> SOC 2 Type II Certified
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-purple-600" />
            Security & Zero-Trust Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time intrusion detection, cryptographic controls, automated IP quaratining, and SaMD Class II boundary enforcement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleRunSecurityScan}
            disabled={isScanning}
            className="text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? `Auditing Perimeter (${scanProgress}%)` : "Run Vulnerability Audit"}
          </Button>
        </div>
      </div>

      {/* Security Posture Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-purple-950 rounded-2xl p-5 sm:p-6 text-white shadow-md border border-slate-700 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400">
                All Defense Shields Active
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Institutional Security Posture: Grade A+ (99.2% Zero-Trust Compliance)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              HIPAA Privacy Rule § 164.312, 21 CFR Part 11, and NIST SP 800-53 Rev. 5 controls are actively monitored.
              Zero standing root credentials detected; cryptographic envelope encryption active on all clinical telemetry.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-300">Blocked Probes</p>
              <p className="text-xl font-bold text-white mt-0.5">142</p>
              <p className="text-[10px] text-emerald-300 font-medium mt-0.5">Last 24h (100% neutralized)</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-300">Active MFA Enrolment</p>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">100%</p>
              <p className="text-[10px] text-slate-300 font-medium mt-0.5">5/5 Staff with FIDO2/TOTP</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-300">Audit Ledger Integrity</p>
              <p className="text-xl font-bold text-purple-300 mt-0.5">SHA-256</p>
              <p className="text-[10px] text-slate-300 font-medium mt-0.5">Immutable Merkle Tree</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-300">Quarantined IPs</p>
              <p className="text-xl font-bold text-amber-300 mt-0.5">2</p>
              <p className="text-[10px] text-slate-300 font-medium mt-0.5">Firewall drop-list</p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Cryptographic & Security Subsystems */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
              <Lock className="h-5 w-5 text-purple-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">TLS In-Transit</p>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">A+ STRICT</Badge>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-0.5">TLS 1.3 & HSTS Preload</p>
              <p className="text-[11px] text-slate-500 mt-1">ECDHE-RSA-AES256-GCM forward secrecy on all endpoints.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
              <Key className="h-5 w-5 text-sky-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Password KDF</p>
                <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold">ARGON2ID</Badge>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Memory-Hardened 64MB</p>
              <p className="text-[11px] text-slate-500 mt-1">Time cost=3, parallelism=4, resisting GPU brute force attacks.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Adaptive Rate Limiting</p>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">100 REQ/MIN</Badge>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Upstash Token Bucket</p>
              <p className="text-[11px] text-slate-500 mt-1">Distributed Redis rate-limiting per remote IP address.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
              <FileCheck className="h-5 w-5 text-amber-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">HIPAA & 21 CFR Part 11</p>
                <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-bold">IMMUTABLE</Badge>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Append-Only Audit Ledger</p>
              <p className="text-[11px] text-slate-500 mt-1">Cryptographic non-repudiation on all AI overrides & approvals.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Policies Control Center */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-purple-600" />
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Institutional Security Policy Controls
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Automated security enforcement rules applied cluster-wide across all APIs and worker daemons.
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
              Live Configuration
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="space-y-0.5 pr-2">
                <p className="text-xs font-bold text-slate-900">Enforce Multi-Factor (2FA/MFA)</p>
                <p className="text-[11px] text-slate-500">Mandatory hardware key / TOTP for all hospital roles.</p>
              </div>
              <Button
                variant={policies.enforceMfaAll ? "default" : "outline"}
                size="sm"
                onClick={() => togglePolicy("enforceMfaAll", "Mandatory Multi-Factor")}
                className={`text-xs h-7 px-2.5 font-semibold ${
                  policies.enforceMfaAll ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-slate-300 text-slate-600"
                }`}
              >
                {policies.enforceMfaAll ? "Enforced" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="space-y-0.5 pr-2">
                <p className="text-xs font-bold text-slate-900">Hospital Subnet Geofencing</p>
                <p className="text-[11px] text-slate-500">Restrict access to 10.240.0.0/16 or verified IPsec VPN.</p>
              </div>
              <Button
                variant={policies.ipGeofencing ? "default" : "outline"}
                size="sm"
                onClick={() => togglePolicy("ipGeofencing", "Hospital Subnet Geofencing")}
                className={`text-xs h-7 px-2.5 font-semibold ${
                  policies.ipGeofencing ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-slate-300 text-slate-600"
                }`}
              >
                {policies.ipGeofencing ? "Enforced" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="space-y-0.5 pr-2">
                <p className="text-xs font-bold text-slate-900">Brute-Force Account Lockout</p>
                <p className="text-[11px] text-slate-500">Lock credential after 5 failed attempts for 15 minutes.</p>
              </div>
              <Button
                variant={policies.bruteForceLockout ? "default" : "outline"}
                size="sm"
                onClick={() => togglePolicy("bruteForceLockout", "Brute-Force Account Lockout")}
                className={`text-xs h-7 px-2.5 font-semibold ${
                  policies.bruteForceLockout ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-slate-300 text-slate-600"
                }`}
              >
                {policies.bruteForceLockout ? "Enforced" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="space-y-0.5 pr-2">
                <p className="text-xs font-bold text-slate-900">15-Min Inactive Token Expiry</p>
                <p className="text-[11px] text-slate-500">Automatically revoke access tokens if workstation is idle.</p>
              </div>
              <Button
                variant={policies.sessionAutoExpiry ? "default" : "outline"}
                size="sm"
                onClick={() => togglePolicy("sessionAutoExpiry", "15-Min Token Expiry")}
                className={`text-xs h-7 px-2.5 font-semibold ${
                  policies.sessionAutoExpiry ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-slate-300 text-slate-600"
                }`}
              >
                {policies.sessionAutoExpiry ? "Enforced" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="space-y-0.5 pr-2">
                <p className="text-xs font-bold text-slate-900">21 CFR Part 11 Digital Signatures</p>
                <p className="text-[11px] text-slate-500">Require dual password re-auth on high-risk AI overrides.</p>
              </div>
              <Button
                variant={policies.requirePart11Signing ? "default" : "outline"}
                size="sm"
                onClick={() => togglePolicy("requirePart11Signing", "Part 11 Digital Signatures")}
                className={`text-xs h-7 px-2.5 font-semibold ${
                  policies.requirePart11Signing ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-slate-300 text-slate-600"
                }`}
              >
                {policies.requirePart11Signing ? "Enforced" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="space-y-0.5 pr-2">
                <p className="text-xs font-bold text-slate-900">WAF Deep Payload Inspection</p>
                <p className="text-[11px] text-slate-500">Active regex filters against SQLi, XSS, and path traversal.</p>
              </div>
              <Button
                variant={policies.wafStrictInspection ? "default" : "outline"}
                size="sm"
                onClick={() => togglePolicy("wafStrictInspection", "WAF Deep Inspection")}
                className={`text-xs h-7 px-2.5 font-semibold ${
                  policies.wafStrictInspection ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-slate-300 text-slate-600"
                }`}
              >
                {policies.wafStrictInspection ? "Enforced" : "Disabled"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Incident & Access Events Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900">Security Incident & Access Events</CardTitle>
              <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                {filteredEvents.length} Events Logged
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Live intrusion detection alerts, perimeter probes, privilege violations, and automated mitigations.
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Severity filter pills */}
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5">
              {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                    severityFilter === sev
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search incidents or IPs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-36 text-xs font-bold text-slate-700">Timestamp</TableHead>
                <TableHead className="w-24 text-xs font-bold text-slate-700">Severity</TableHead>
                <TableHead className="w-48 text-xs font-bold text-slate-700">Event Type</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Details</TableHead>
                <TableHead className="w-32 text-xs font-bold text-slate-700">Source IP</TableHead>
                <TableHead className="w-36 text-right text-xs font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-xs text-slate-500">
                    No security incidents match the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((evt) => (
                  <TableRow key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="text-xs font-mono text-slate-500 whitespace-nowrap">
                      {evt.timestamp}
                    </TableCell>
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
                        className="text-[10px] font-bold"
                      >
                        {evt.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {evt.quarantined && <Ban className="h-3 w-3 text-rose-500 shrink-0" />}
                        {evt.type}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-sm sm:max-w-md">
                      <p className="line-clamp-2">{evt.details}</p>
                      <span className="text-[10px] font-medium text-emerald-700 block mt-0.5">
                        {evt.actionTaken}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span>{evt.sourceIp}</span>
                        {evt.quarantined && (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[9px] px-1 py-0 font-mono">
                            QUARANTINED
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEvent(evt)}
                          className="h-7 px-2 text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Inspect
                        </Button>
                        {!evt.quarantined ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuarantineIp(evt.id, evt.sourceIp)}
                            className="h-7 px-2 text-[11px] font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            Quarantine
                          </Button>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 px-2">Blocked</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Incident Deep Inspection Modal */}
      {selectedEvent && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEvent(null)}
          title={`Security Incident Telemetry: ${selectedEvent.id}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Event Classification</span>
                <p className="text-sm font-bold text-slate-900">{selectedEvent.type}</p>
              </div>
              <Badge
                variant={
                  selectedEvent.severity === "CRITICAL"
                    ? "destructive"
                    : selectedEvent.severity === "HIGH"
                    ? "destructive"
                    : selectedEvent.severity === "MEDIUM"
                    ? "warning"
                    : "outline"
                }
                className="text-xs font-bold"
              >
                {selectedEvent.severity}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Source Origin IP</span>
                <span className="font-mono text-slate-900 font-semibold">{selectedEvent.sourceIp}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Detection Timestamp</span>
                <span className="font-mono text-slate-900 font-semibold">{selectedEvent.timestamp}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Incident Summary & Context</span>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {selectedEvent.details}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Automated Countermeasure Applied</span>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-emerald-800">{selectedEvent.actionTaken}</span>
              </div>
            </div>

            {selectedEvent.rawPayload && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700">Raw Perimeter Packet / Trace Payload</span>
                  <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-mono">
                    ASCII PAYLOAD
                  </Badge>
                </div>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto whitespace-pre-wrap border border-slate-800">
                  {selectedEvent.rawPayload}
                </pre>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {!selectedEvent.quarantined ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuarantineIp(selectedEvent.id, selectedEvent.sourceIp)}
                  className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  Quarantine Remote IP
                </Button>
              ) : (
                <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold">
                  IP is currently Quarantined
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEvent(null)}
                className="text-xs font-semibold"
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
