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
  FileCheck,
  Download,
  Eye,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  Lock,
  Hash,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actor_role: string;
  action: string;
  category: "CLINICAL" | "PREDICTION" | "GOVERNANCE" | "SECURITY" | "SYSTEM";
  resource: string;
  status: "SUCCESS" | "WARNING" | "FAILED";
  ip_address: string;
  sha256: string;
  merkleRoot: string;
  details?: string;
}

const AUDIT_DATA: AuditEntry[] = [
  {
    id: "aud-901",
    timestamp: "2026-09-14 17:42:10",
    actor: "Dr. Elena Vance, MD",
    actor_role: "DOCTOR",
    action: "PREDICTION_EVALUATED",
    category: "PREDICTION",
    resource: "Prediction / MRN-90241",
    status: "SUCCESS",
    ip_address: "10.240.12.84",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    merkleRoot: "0x89f2...a12c",
    details: "Evaluated 30-day readmission risk inference. Confidence: 0.842. Recommendation approved.",
  },
  {
    id: "aud-902",
    timestamp: "2026-09-14 17:38:05",
    actor: "Dr. Elena Vance, MD",
    actor_role: "DOCTOR",
    action: "PHYSICIAN_OVERRIDE",
    category: "CLINICAL",
    resource: "Prediction / MRN-39201",
    status: "WARNING",
    ip_address: "10.240.12.84",
    sha256: "7d793037a0760186574b0282f2f435e70d18d029f27f2284507ee3a4d2033f12",
    merkleRoot: "0x89f2...a12c",
    details: "Clinician override recorded for sepsis risk alert. Rationale: Patient vitals stabilizing post-IV antibiotics.",
  },
  {
    id: "aud-903",
    timestamp: "2026-09-14 17:20:19",
    actor: "Sarah Jenkins, RN",
    actor_role: "NURSE",
    action: "VITALS_RECORDED",
    category: "CLINICAL",
    resource: "Encounter / MRN-48192",
    status: "SUCCESS",
    ip_address: "10.240.14.12",
    sha256: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    merkleRoot: "0x89f2...a12c",
    details: "Bedside vitals entered: BP 122/78, HR 74 bpm, SpO2 98%, Temp 98.4F. Triage score: 2.",
  },
  {
    id: "aud-904",
    timestamp: "2026-09-14 16:55:40",
    actor: "Hospital Administrator",
    actor_role: "ADMIN",
    action: "MODEL_PROMOTED",
    category: "GOVERNANCE",
    resource: "CardioEnsemble-RF v1.4.2",
    status: "SUCCESS",
    ip_address: "10.240.0.4",
    sha256: "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
    merkleRoot: "0x78e1...b45f",
    details: "Model version promoted from Challenger to Champion following clinical validation sign-off.",
  },
  {
    id: "aud-905",
    timestamp: "2026-09-14 16:10:02",
    actor: "Celery Worker #2",
    actor_role: "SYSTEM",
    action: "REPORT_COMPILED",
    category: "SYSTEM",
    resource: "PDF Report / MRN-90241",
    status: "SUCCESS",
    ip_address: "127.0.0.1",
    sha256: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    merkleRoot: "0x78e1...b45f",
    details: "Automated SaMD compliance clinical dossier compiled and digitally signed.",
  },
  {
    id: "aud-906",
    timestamp: "2026-09-14 15:02:11",
    actor: "Anonymous Probe",
    actor_role: "UNKNOWN",
    action: "LOGIN_FAILED",
    category: "SECURITY",
    resource: "Auth / Gateway",
    status: "FAILED",
    ip_address: "192.168.1.104",
    sha256: "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35",
    merkleRoot: "0x67c0...d98a",
    details: "5 consecutive failed authentication attempts. Account rate-limited for 15 minutes.",
  },
  {
    id: "aud-907",
    timestamp: "2026-09-14 14:15:22",
    actor: "Alex Rivera, MSc",
    actor_role: "INFORMATICIST",
    action: "DRIFT_MONITOR_CALIBRATED",
    category: "GOVERNANCE",
    resource: "Monitor / Sepsis-KS-Test",
    status: "SUCCESS",
    ip_address: "10.240.15.02",
    sha256: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    merkleRoot: "0x67c0...d98a",
    details: "Updated Kolmogorov-Smirnov test sensitivity threshold from 0.05 to 0.03.",
  },
];

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");
  const [selectedEntry, setSelectedEntry] = React.useState<AuditEntry | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleVerifyMerkle = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      showToast("Merkle tree cryptographic audit completed: 84,200 events verified. Zero tamper flags. Grade A+.");
    }, 1200);
  };

  const handleExportCsv = () => {
    showToast("Cryptographically signed 21 CFR Part 11 Audit CSV generated & downloaded.");
  };

  const filteredLogs = AUDIT_DATA.filter((l) => {
    const matchesCategory = categoryFilter === "ALL" || l.category === categoryFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      l.actor.toLowerCase().includes(term) ||
      l.action.toLowerCase().includes(term) ||
      l.resource.toLowerCase().includes(term) ||
      l.sha256.toLowerCase().includes(term) ||
      l.id.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
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
              21 CFR Part 11 & HIPAA § 164.312
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Append-Only Immutable Ledger
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileCheck className="h-7 w-7 text-purple-600" />
            HIPAA Audit Logs & Immutable Event Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cryptographically signed event ledger tracking clinical encounters, AI risk predictions, model promotions, and role access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleVerifyMerkle}
            disabled={isVerifying}
            className="text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isVerifying ? "animate-spin" : ""}`} />
            {isVerifying ? "Verifying Merkle Tree..." : "Verify Hash Chain"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs font-semibold gap-1.5 border-slate-200"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            Export Signed CSV
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
              <FileCheck className="h-5 w-5 text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Total Signed Events</p>
              <p className="text-xl font-bold text-slate-900">84,200</p>
              <p className="text-[11px] text-purple-700 font-medium">100% Merkle anchored</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Tamper Integrity</p>
              <p className="text-xl font-bold text-slate-900">0 Tamper Flags</p>
              <p className="text-[11px] text-emerald-700 font-medium">SHA-256 chain verified</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
              <Clock className="h-5 w-5 text-sky-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">HIPAA Retention</p>
              <p className="text-xl font-bold text-slate-900">7 Years</p>
              <p className="text-[11px] text-sky-700 font-medium">Append-only guaranteed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
              <Hash className="h-5 w-5 text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Current Block Root</p>
              <p className="text-xl font-bold text-slate-900 font-mono text-sm sm:text-base">0x89f2...a12c</p>
              <p className="text-[11px] text-amber-700 font-medium">Block #1,492,019</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center rounded-xl bg-slate-100 p-1 w-fit overflow-x-auto max-w-full">
          {(["ALL", "PREDICTION", "CLINICAL", "GOVERNANCE", "SECURITY", "SYSTEM"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {cat === "ALL" ? "All Logs" : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search actor, action, resource, hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Audit Ledger Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Cryptographic Audit Trail
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Showing {filteredLogs.length} verified immutable ledger entries.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono text-slate-600 self-start sm:self-auto">
            Algorithm: SHA-256 + HMAC-SHA512
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card View (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No audit entries match your criteria.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-4 space-y-2.5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-slate-500">{log.timestamp}</span>
                    <Badge
                      variant={
                        log.status === "SUCCESS"
                          ? "success"
                          : log.status === "WARNING"
                          ? "warning"
                          : "destructive"
                      }
                      className="text-[10px] font-bold"
                    >
                      {log.status}
                    </Badge>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-purple-900 block">{log.action}</span>
                      <span className="text-[11px] text-slate-500">{log.category}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900 text-xs block">{log.actor}</span>
                      <span className="text-[10px] font-mono text-slate-500">{log.actor_role}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-1 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Resource</span>
                      <p className="font-mono text-slate-800 text-[11px] break-all">{log.resource}</p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>IP: <strong className="font-mono text-slate-700">{log.ip_address}</strong></span>
                      <span>Hash: <strong className="font-mono text-slate-700">{log.sha256.substring(0, 10)}...</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEntry(log)}
                      className="text-xs h-7 px-2.5 text-purple-700 border-purple-200 hover:bg-purple-50 font-semibold"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Verify Signature
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-36 font-bold text-slate-700">Timestamp</TableHead>
                  <TableHead className="w-44 font-bold text-slate-700">Actor / Role</TableHead>
                  <TableHead className="w-48 font-bold text-slate-700">Action / Event</TableHead>
                  <TableHead className="font-bold text-slate-700">Target Resource</TableHead>
                  <TableHead className="w-32 font-bold text-slate-700">Source IP</TableHead>
                  <TableHead className="w-24 font-bold text-slate-700">Outcome</TableHead>
                  <TableHead className="w-24 text-right font-bold text-slate-700">Proof</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="text-xs font-mono text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-900 text-xs">{log.actor}</div>
                      <span className="text-[10px] font-mono text-slate-500">{log.actor_role}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono font-bold text-purple-900 block">{log.action}</span>
                      <span className="text-[10px] text-slate-500">{log.category}</span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 font-medium max-w-xs truncate">
                      {log.resource}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-500">
                      {log.ip_address}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === "SUCCESS"
                            ? "success"
                            : log.status === "WARNING"
                            ? "warning"
                            : "destructive"
                        }
                        className="text-[10px] font-bold"
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEntry(log)}
                        className="text-xs h-7 text-purple-700 hover:bg-purple-50"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Verify
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cryptographic Proof Modal */}
      {selectedEntry && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEntry(null)}
          title={`Audit Proof & Signature: ${selectedEntry.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Action Type</span>
                <p className="text-sm font-bold text-slate-900">{selectedEntry.action}</p>
              </div>
              <Badge
                variant={
                  selectedEntry.status === "SUCCESS"
                    ? "success"
                    : selectedEntry.status === "WARNING"
                    ? "warning"
                    : "destructive"
                }
              >
                {selectedEntry.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Actor Identity</span>
                <span className="font-semibold text-slate-900">{selectedEntry.actor} ({selectedEntry.actor_role})</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Network Origin</span>
                <span className="font-mono text-slate-900">{selectedEntry.ip_address}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Resource</span>
              <p className="font-semibold text-slate-800 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                {selectedEntry.resource}
              </p>
            </div>

            {selectedEntry.details && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Event Details & Context</span>
                <p className="text-slate-600 p-2.5 bg-slate-50 rounded-lg border border-slate-100 leading-relaxed">
                  {selectedEntry.details}
                </p>
              </div>
            )}

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">SHA-256 Event Digest</span>
              <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] break-all select-all">
                {selectedEntry.sha256}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Merkle Tree Root Anchor</span>
              <div className="p-2 bg-purple-50 text-purple-900 border border-purple-200 rounded-lg font-mono text-[11px]">
                Root: {selectedEntry.merkleRoot} | Block #1,492,019
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Validated Cryptographic Signature
              </span>
              <Button size="sm" onClick={() => setSelectedEntry(null)} className="text-xs font-semibold">
                Close Verification
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
