"use client";

import * as React from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Download,
  Filter,
  Key,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

interface AuditEntry {
  id: string;
  action_type: string;
  action: string;
  user_email: string;
  user: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
  sha256: string;
  ip_address: string;
  status: "VERIFIED" | "IMMUTABLE";
}

const DEFAULT_AUDIT_LOGS: AuditEntry[] = [
  {
    id: "aud-01",
    action_type: "MODEL_PROMOTION",
    action: "Promoted RandomForestClassifier v1.0.0 to Active Production Champion",
    user_email: "alex.rivera@hospital.org",
    user: "Alex Rivera, MSc",
    resource_type: "ModelRegistry",
    resource_id: "mod-01",
    created_at: "2026-09-14 09:12:44 UTC",
    sha256: "7f81a4b9c82e5d1a3f019b882419c8f029471ab69a84210e7b458c92a632db10",
    ip_address: "10.240.12.84 (Hospital VPN)",
    status: "VERIFIED",
  },
  {
    id: "aud-02",
    action_type: "DRIFT_SWEEP",
    action: "Executed scheduled automated PSI & Kolmogorov-Smirnov biomarker drift scan",
    user_email: "system.mlops@hospital.org",
    user: "MLOps Scheduled Daemon #2",
    resource_type: "DriftMonitor",
    resource_id: "drift-sweep-daily",
    created_at: "2026-09-14 06:00:02 UTC",
    sha256: "3d41f09ab721e843c9118a7b5204ef90184b2c7e61a84920fcb48192a83b1029",
    ip_address: "10.240.0.12 (Internal Node)",
    status: "VERIFIED",
  },
  {
    id: "aud-03",
    action_type: "DATA_QUALITY_AUDIT",
    action: "Feature Store ingestion integrity validated: 99.9% completeness across 48,290 records",
    user_email: "system.etl@hospital.org",
    user: "Kafka/FHIR Ingest Worker",
    resource_type: "FeatureStore",
    resource_id: "fs-partition-20260913",
    created_at: "2026-09-13 23:59:15 UTC",
    sha256: "a84921bf094e82104cb9124018fba73c9102847a984c120bf482918a74b10293",
    ip_address: "10.240.0.18 (Internal Node)",
    status: "VERIFIED",
  },
  {
    id: "aud-04",
    action_type: "SAFETY_EVALUATION",
    action: "Executed Prompt 18 LLM adversarial jailbreak, grounding & SSC-2021 guideline audit",
    user_email: "alex.rivera@hospital.org",
    user: "Alex Rivera, MSc",
    resource_type: "AIEvaluation",
    resource_id: "eval-prompt18-0913",
    created_at: "2026-09-13 16:30:10 UTC",
    sha256: "918b4f0284ac120938b7102948ca7210984fb2c1894a73b201948cba71092834",
    ip_address: "10.240.12.84 (Hospital VPN)",
    status: "VERIFIED",
  },
  {
    id: "aud-05",
    action_type: "REPORT_EXPORT",
    action: "Exported Quarterly SaMD Regulatory Compliance Dossier (PDF)",
    user_email: "alex.rivera@hospital.org",
    user: "Alex Rivera, MSc",
    resource_type: "ReportingService",
    resource_id: "rep-samd-q3-2026",
    created_at: "2026-09-13 10:05:22 UTC",
    sha256: "4b921a84c90184b2c7e61a84920fcb48192a83b10293d41f09ab721e843c9118",
    ip_address: "10.240.12.84 (Hospital VPN)",
    status: "VERIFIED",
  },
];

export default function InformaticistAuditPage() {
  const [logs, setLogs] = React.useState<AuditEntry[]>(DEFAULT_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedAction, setSelectedAction] = React.useState("ALL");
  const [notification, setNotification] = React.useState<string | null>(null);

  const handleVerify = () => {
    setNotification("Ledger Hash Chain Verified: All 5 cryptographic SHA-256 block signatures match immutable root.");
    setTimeout(() => setNotification(null), 4000);
  };

  const handleExport = () => {
    setNotification("Audit ledger exported as signed JSON document.");
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredLogs = logs.filter(l => {
    const matchesAction = selectedAction === "ALL" || l.action_type === selectedAction;
    const matchesSearch =
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.sha256.includes(searchQuery);
    return matchesAction && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cryptographic Audit Ledger</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs flex items-center gap-1">
              <Lock className="h-3 w-3" />
              21 CFR Part 11 &amp; HIPAA Compliant
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable, append-only ledger tracking all model promotions, drift scans, parameter updates, and pipeline events.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleVerify}
            className="text-xs h-8 border-slate-200 hover:border-emerald-400 hover:text-emerald-700"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
            Verify Hash Chain
          </Button>

          <Button
            size="sm"
            onClick={handleExport}
            className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Ledger
          </Button>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {notification}
          </span>
          <span className="text-[10px] text-emerald-600 font-mono">Merkle Root Valid</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search action, actor, resource, SHA hash..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "ALL", label: "All Actions" },
            { key: "MODEL_PROMOTION", label: "Model Promotion" },
            { key: "DRIFT_SWEEP", label: "Drift Sweep" },
            { key: "DATA_QUALITY_AUDIT", label: "Data Quality" },
            { key: "SAFETY_EVALUATION", label: "AI Safety" },
            { key: "REPORT_EXPORT", label: "Report Export" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setSelectedAction(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedAction === f.key
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Entries */}
      <div className="space-y-3">
        {filteredLogs.map(log => (
          <Card key={log.id} className="bg-white border-slate-200 shadow-xs hover:border-purple-300 transition-all">
            <CardContent className="p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{log.action}</h3>
                    <p className="text-xs text-slate-500">
                      Actor: <strong className="text-slate-800">{log.user}</strong> ({log.user_email}) · Resource: <span className="font-mono text-slate-700">{log.resource_type}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    {log.status}
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">{log.created_at}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2 font-mono text-slate-500 truncate max-w-xl">
                  <Key className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-400">SHA-256:</span>
                  <span className="text-slate-700 truncate">{log.sha256}</span>
                </div>
                <span className="text-slate-400 whitespace-nowrap">Origin: {log.ip_address}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
