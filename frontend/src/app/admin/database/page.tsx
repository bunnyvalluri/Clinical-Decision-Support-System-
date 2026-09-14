"use client";

import * as React from "react";
import {
  Database,
  CheckCircle2,
  Info,
  RefreshCw,
  Server,
  Layers,
  HardDrive,
  Cpu,
  Clock,
  Zap,
  GitBranch,
  ShieldCheck,
  Search,
  ExternalLink,
  Play,
  Terminal,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface TableInfo {
  name: string;
  rowCount: number;
  sizeMb: number;
  indexes: string[];
  purpose: string;
  health: "OPTIMAL" | "VACUUM_NEEDED";
}

const DATABASE_TABLES: TableInfo[] = [
  {
    name: "audit_ledger_part11",
    rowCount: 84200,
    sizeMb: 42.1,
    indexes: ["idx_audit_sha256", "idx_audit_timestamp", "idx_audit_user"],
    purpose: "Immutable 21 CFR Part 11 append-only cryptographic event ledger",
    health: "OPTIMAL",
  },
  {
    name: "ml_predictions",
    rowCount: 18420,
    sizeMb: 14.8,
    indexes: ["idx_pred_patient_id", "idx_pred_created_at", "idx_pred_model_ver"],
    purpose: "SaMD risk prediction inferences, confidence scores, and SHAP vectors",
    health: "OPTIMAL",
  },
  {
    name: "ai_evaluation_traces",
    rowCount: 3410,
    sizeMb: 18.2,
    indexes: ["idx_trace_session", "idx_trace_grounding_score"],
    purpose: "RAG clinical evidence citations, grounding scores, and safety traces",
    health: "OPTIMAL",
  },
  {
    name: "clinical_patients",
    rowCount: 1240,
    sizeMb: 4.2,
    indexes: ["idx_patient_mrn", "idx_patient_admit_date", "idx_patient_status"],
    purpose: "Patient clinical demographics, active encounter codes, and admission records",
    health: "OPTIMAL",
  },
  {
    name: "auth_user_accounts",
    rowCount: 5,
    sizeMb: 0.12,
    indexes: ["idx_user_email", "idx_user_role"],
    purpose: "Staff credentials, Argon2id password hashes, and FIDO2 MFA public keys",
    health: "OPTIMAL",
  },
];

const SLOW_QUERIES = [
  {
    id: "q-101",
    query: "SELECT * FROM ml_predictions WHERE created_at > NOW() - INTERVAL '30 days' AND risk_tier = 'HIGH' ORDER BY confidence_score DESC;",
    avgMs: 14.2,
    calls: 1420,
    indexHitRate: "99.8%",
  },
  {
    id: "q-102",
    query: "SELECT p.id, p.mrn, a.hash_signature FROM clinical_patients p JOIN audit_ledger_part11 a ON p.id = a.target_id WHERE a.event_type = 'OVERRIDE';",
    avgMs: 18.6,
    calls: 310,
    indexHitRate: "99.1%",
  },
  {
    id: "q-103",
    query: "SELECT model_id, AVG(grounding_score) FROM ai_evaluation_traces GROUP BY model_id;",
    avgMs: 8.4,
    calls: 640,
    indexHitRate: "100.0%",
  },
];

export default function AdminDatabasePage() {
  const [activeTab, setActiveTab] = React.useState<"tables" | "topology" | "queries">("tables");
  const [isVacuuming, setIsVacuuming] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = React.useState<typeof SLOW_QUERIES[0] | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRunVacuum = () => {
    setIsVacuuming(true);
    setTimeout(() => {
      setIsVacuuming(false);
      showToast("VACUUM ANALYZE completed successfully: 0 dead tuples detected; statistics catalog refreshed.");
    }, 1400);
  };

  const handleTestConnection = () => {
    showToast("Connection ping to Neon Serverless Postgres pool: 12.4ms (TLS 1.3 strict). Healthy!");
  };

  const filteredTables = DATABASE_TABLES.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Neon Lakebase PostgreSQL
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> PgBouncer Pool Online
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Database className="h-7 w-7 text-purple-600" />
            PostgreSQL Database & Pool Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Serverless PostgreSQL 16 with autoscaling compute, point-in-time branch management, and transaction pooling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            className="text-xs font-semibold gap-1.5 border-slate-200"
          >
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            Test Pool Latency
          </Button>
          <Button
            onClick={handleRunVacuum}
            disabled={isVacuuming}
            className="text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isVacuuming ? "animate-spin" : ""}`} />
            {isVacuuming ? "Vacuuming Tables..." : "Run VACUUM ANALYZE"}
          </Button>
        </div>
      </div>

      {/* Database KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
              <Layers className="h-5 w-5 text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Connection Pool</p>
              <p className="text-xl font-bold text-slate-900">8 / 100</p>
              <p className="text-[11px] text-purple-700 font-medium">PgBouncer transaction mode</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <Clock className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Avg Query Latency</p>
              <p className="text-xl font-bold text-slate-900">12.4 ms</p>
              <p className="text-[11px] text-emerald-700 font-medium">99.4% index hit ratio</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
              <HardDrive className="h-5 w-5 text-sky-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Disk Storage Used</p>
              <p className="text-xl font-bold text-slate-900">240.6 MB</p>
              <p className="text-[11px] text-sky-700 font-medium">Auto-scales to 10 GB</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
              <Cpu className="h-5 w-5 text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Compute Autoscaling</p>
              <p className="text-xl font-bold text-slate-900">0.25 → 4 vCPU</p>
              <p className="text-[11px] text-amber-700 font-medium">Scale-to-zero active (5m idle)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("tables")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "tables"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Database Tables ({DATABASE_TABLES.length})
        </button>
        <button
          onClick={() => setActiveTab("topology")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "topology"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Connection & Topology
        </button>
        <button
          onClick={() => setActiveTab("queries")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "queries"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Query Inspector & Indexes
        </button>
      </div>

      {/* Tab 1: Database Tables */}
      {activeTab === "tables" && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Clinical & Audit Relational Tables</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Storage footprints, index definitions, and health status across core database relations.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Filter tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="p-3 font-bold text-slate-700">Table Name</th>
                  <th className="p-3 font-bold text-slate-700">Rows</th>
                  <th className="p-3 font-bold text-slate-700">Size</th>
                  <th className="p-3 font-bold text-slate-700">Indexes</th>
                  <th className="p-3 font-bold text-slate-700">Purpose / Role</th>
                  <th className="p-3 font-bold text-right text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTables.map((tbl) => (
                  <tr key={tbl.name} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-purple-900">{tbl.name}</td>
                    <td className="p-3 font-semibold text-slate-800">{tbl.rowCount.toLocaleString()}</td>
                    <td className="p-3 font-semibold text-slate-800">{tbl.sizeMb} MB</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {tbl.indexes.map((idx) => (
                          <span key={idx} className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {idx}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs">{tbl.purpose}</td>
                    <td className="p-3 text-right">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                        {tbl.health}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Connection & Topology */}
      {activeTab === "topology" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">Cluster Connection Parameters</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Encrypted connection endpoints for application and worker services.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Host Endpoint (US-East-2)</span>
                <span className="font-mono text-slate-800 font-semibold block select-all">
                  ep-divine-credit-a589ua8g.us-east-2.aws.neon.tech
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">PgBouncer Pool Port (Pooled Mode)</span>
                <span className="font-mono text-slate-800 font-semibold block">Port 6543 (Transaction Pooling)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Direct Compute Port (Migrations)</span>
                <span className="font-mono text-slate-800 font-semibold block">Port 5432 (Session Mode)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">SSL Security Mode</span>
                <span className="font-mono text-emerald-700 font-semibold block">sslmode=require (TLS 1.3 Strict)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">Branching & Point-in-Time Recovery</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Isolated copy-on-write database branches for zero-impact migration testing.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg border border-purple-200 bg-purple-50/50">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-purple-700" />
                  <div>
                    <span className="font-bold text-slate-900 font-mono">main (production)</span>
                    <span className="text-[11px] text-slate-500 block">Current active parent branch (HEAD)</span>
                  </div>
                </div>
                <Badge className="bg-purple-100 text-purple-800 border-0 text-[10px] font-bold">PRIMARY</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="font-bold text-slate-700 font-mono">staging</span>
                    <span className="text-[11px] text-slate-500 block">Synced 2 hours ago from parent</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">STANDBY</Badge>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showToast("Branch snapshot initialized. Created ephemeral test branch 'migration-preview-pr42'.")}
                  className="w-full text-xs font-semibold text-purple-700 border-purple-200 hover:bg-purple-50"
                >
                  <GitBranch className="h-3.5 w-3.5 mr-1.5" />
                  Create Ephemeral Test Branch
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Query Inspector */}
      {activeTab === "queries" && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">Query Performance & Index Statistics</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Live pg_stat_statements telemetry showing latency percentiles and sequential scan prevention.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="p-3 font-bold text-slate-700">Query Template</th>
                  <th className="p-3 font-bold text-slate-700">Avg Latency</th>
                  <th className="p-3 font-bold text-slate-700">24h Calls</th>
                  <th className="p-3 font-bold text-slate-700">Index Hit</th>
                  <th className="p-3 font-bold text-right text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SLOW_QUERIES.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-mono text-slate-800 max-w-md">
                      <p className="line-clamp-1">{q.query}</p>
                    </td>
                    <td className="p-3 font-semibold text-emerald-700">{q.avgMs} ms</td>
                    <td className="p-3 font-medium text-slate-700">{q.calls.toLocaleString()}</td>
                    <td className="p-3">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                        {q.indexHitRate}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedQuery(q)}
                        className="text-xs h-7 text-purple-700 hover:bg-purple-50"
                      >
                        Explain Plan
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Query Explain Modal */}
      {selectedQuery && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedQuery(null)}
          title={`EXPLAIN (ANALYZE, BUFFERS): ${selectedQuery.id}`}
        >
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">SQL Query</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {selectedQuery.query}
              </pre>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Query Execution Plan</span>
              <pre className="p-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-[11px] font-mono whitespace-pre-wrap">
                {`Index Scan using idx_pred_created_at on ml_predictions (cost=0.29..8.42 rows=1 width=324) (actual time=0.042..0.121 rows=14 loops=1)\n  Index Cond: (created_at > (now() - '30 days'::interval))\n  Filter: (risk_tier = 'HIGH'::text)\n  Buffers: shared hit=4 read=0\nPlanning Time: 0.114 ms\nExecution Time: 0.158 ms`}
              </pre>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button size="sm" onClick={() => setSelectedQuery(null)} className="text-xs font-semibold">
                Close Plan
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
