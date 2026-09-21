"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  ChevronRight,
  User,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  ShieldAlert,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import apiClient from "@/services/apiClient";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface PatientItem {
  id: string;
  name: string;
  mrn: string;
  risk: RiskLevel;
  age: number;
  gender: string;
  lastSeen: string;
  predictionCount: number;
  pendingReviews: number;
  department?: string;
  admissionStatus?: string;
}

const RISK_CONFIG: Record<RiskLevel, { color: string; dot: string; label: string; border: string }> = {
  CRITICAL: { color: "bg-rose-50 text-rose-800", dot: "bg-rose-600", label: "CRITICAL", border: "border-rose-300" },
  HIGH:     { color: "bg-orange-50 text-orange-800", dot: "bg-orange-500", label: "HIGH", border: "border-orange-200" },
  MEDIUM:   { color: "bg-amber-50 text-amber-800", dot: "bg-amber-500", label: "MEDIUM", border: "border-amber-200" },
  LOW:      { color: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500", label: "LOW", border: "border-emerald-200" },
};

const POLL_INTERVAL_MS = 30_000;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function DoctorPatientsPage() {
  const [patients, setPatients] = React.useState<PatientItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [isLive, setIsLive] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [riskFilter, setRiskFilter] = React.useState<"ALL" | RiskLevel>("ALL");
  const [sortBy, setSortBy] = React.useState<"risk" | "name" | "lastSeen">("risk");
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch patients from API ──────────────────────────────────
  const fetchPatients = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      // Try dedicated patients endpoint first, fall back to predictions list
      let rawPatients: PatientItem[] = [];

      const patientsRes = await apiClient.get("/patients/").catch(() => null);

      if (patientsRes?.data) {
        const list: any[] =
          patientsRes.data.results ||
          patientsRes.data.data ||
          (Array.isArray(patientsRes.data) ? patientsRes.data : []);

        rawPatients = list.map((p: any) => ({
          id: String(p.id || p.patient_id || ""),
          name: p.full_name || p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Patient",
          mrn: p.mrn || p.patient_mrn || "MRN-UNKNOWN",
          risk: (["CRITICAL","HIGH","MEDIUM","LOW"].includes(p.risk_level?.toUpperCase())
            ? p.risk_level.toUpperCase()
            : "LOW") as RiskLevel,
          age: p.age || p.date_of_birth
            ? (p.age || new Date().getFullYear() - new Date(p.date_of_birth).getFullYear())
            : 0,
          gender: p.gender || "OTHER",
          lastSeen: p.last_prediction_at || p.updated_at || p.created_at || new Date().toISOString(),
          predictionCount: p.prediction_count || p.predictions_count || 0,
          pendingReviews: p.pending_reviews_count || 0,
          department: p.department || "",
          admissionStatus: p.admission_status || "INPATIENT",
        }));
      } else {
        // Fallback: derive from predictions list
        const predsRes = await apiClient.get("/predictions/").catch(() => null);
        const preds: any[] =
          predsRes?.data?.results ||
          predsRes?.data?.data ||
          (Array.isArray(predsRes?.data) ? predsRes?.data : []);

        const byMrn = new Map<string, any>();
        preds.forEach((pr) => {
          const mrn = pr.patient_mrn || "MRN-UNKNOWN";
          if (!byMrn.has(mrn)) {
            byMrn.set(mrn, { ...pr, _count: 0, _pending: 0 });
          }
          const entry = byMrn.get(mrn)!;
          entry._count++;
          if (!pr.clinician_override && pr.review_status !== "REVIEWED") entry._pending++;
        });

        rawPatients = Array.from(byMrn.values()).map((pr) => ({
          id: String(pr.patient_id || pr.patient || pr.id || ""),
          name: pr.patient_name || "Patient",
          mrn: pr.patient_mrn || "MRN-UNKNOWN",
          risk: (["CRITICAL","HIGH","MEDIUM","LOW"].includes(pr.risk_level?.toUpperCase())
            ? pr.risk_level.toUpperCase()
            : "LOW") as RiskLevel,
          age: pr.patient_age || 0,
          gender: pr.patient_gender || "OTHER",
          lastSeen: pr.prediction_timestamp || pr.created_at || new Date().toISOString(),
          predictionCount: pr._count,
          pendingReviews: pr._pending,
          department: "",
          admissionStatus: "INPATIENT",
        }));
      }

      setPatients(rawPatients);
      setIsLive(true);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Failed to load patients:", err);
      setError("Unable to load patient records. Check backend connection.");
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial load + 30s polling ─────────────────────────────
  React.useEffect(() => {
    fetchPatients();
    pollRef.current = setInterval(() => fetchPatients(true), POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchPatients]);

  // ── Filter + Sort ──────────────────────────────────────────
  const RISK_ORDER: RiskLevel[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

  const filtered = React.useMemo(() => {
    let list = patients.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.mrn.toLowerCase().includes(search.toLowerCase());
      const matchRisk = riskFilter === "ALL" || p.risk === riskFilter;
      return matchSearch && matchRisk;
    });

    if (sortBy === "risk") {
      list = [...list].sort((a, b) => RISK_ORDER.indexOf(a.risk) - RISK_ORDER.indexOf(b.risk));
    } else if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list = [...list].sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
    }
    return list;
  }, [patients, search, riskFilter, sortBy]);

  // ── Summary counts ─────────────────────────────────────────
  const critCount = patients.filter((p) => p.risk === "CRITICAL").length;
  const highCount = patients.filter((p) => p.risk === "HIGH").length;
  const pendingCount = patients.reduce((sum, p) => sum + p.pendingReviews, 0);

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4
                        bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">My Patients</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-700">{patients.length}</span> assigned patients
                · Authoritative Store: <span className="font-semibold text-slate-700">Neon PostgreSQL</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live indicator */}
            <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold
              ${isLive && !error
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-slate-50 border-slate-200 text-slate-500"}`}>
              {isLive && !error
                ? <><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />LIVE</>
                : <><WifiOff className="h-3 w-3" />OFFLINE</>}
              {lastUpdated && (
                <span className="font-mono hidden sm:inline ml-1">· {lastUpdated.toLocaleTimeString()}</span>
              )}
            </div>

            <Button
              variant="outline" size="sm"
              onClick={() => fetchPatients()}
              disabled={loading}
              className="text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              size="sm"
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              New Patient
            </Button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Patients", value: patients.length, icon: Users, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
            { label: "Critical / High", value: critCount + highCount, icon: ShieldAlert, color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
            { label: "Pending Reviews", value: pendingCount, icon: Clock, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
            { label: "Last Refreshed", value: lastUpdated ? lastUpdated.toLocaleTimeString() : "—", icon: Activity, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <Card key={label} className={`${bg} border ${border} shadow-sm`}>
              <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg ${bg} border ${border} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filters & Search ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or MRN…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white outline-none
                         focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {(["ALL","CRITICAL","HIGH","MEDIUM","LOW"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer
                  ${riskFilter === r
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"}`}
              >
                {r === "ALL" ? "All" : r}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700
                       outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="risk">Sort: Risk Level</option>
            <option value="name">Sort: Name</option>
            <option value="lastSeen">Sort: Last Seen</option>
          </select>
        </div>

        {/* ── Error State ── */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
            <ShieldAlert className="h-8 w-8 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-900">Failed to Load Patients</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
            <Button size="sm" variant="outline" onClick={() => fetchPatients()}
              className="text-xs border-rose-300 hover:bg-rose-100">
              Retry Connection
            </Button>
          </div>
        )}

        {/* ── Loading Skeleton ── */}
        {loading && !error && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3">
            <Users className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No Patients Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || riskFilter !== "ALL"
                ? "No patients match your current filters."
                : "No patient records exist in the database yet."}
            </p>
          </div>
        )}

        {/* ── Patient Table (Desktop) ── */}
        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Desktop */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Patient / MRN", "Risk Tier", "Predictions", "Pending Reviews", "Last Evaluated", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const risk = RISK_CONFIG[p.risk] || RISK_CONFIG.LOW;
                    return (
                      <tr key={p.id}
                        className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors
                          ${i % 2 === 0 ? "" : "bg-slate-50/20"}`}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-8 w-8 rounded-full ${risk.color} border ${risk.border}
                                            flex items-center justify-center shrink-0`}>
                              <span className="text-[10px] font-bold">
                                {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{p.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {p.mrn} · {p.age > 0 ? `${p.age}y` : "—"} / {p.gender}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5
                                           text-[10px] font-bold ${risk.color} ${risk.border}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                            {risk.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-slate-700">{p.predictionCount}</span>
                          <span className="text-slate-400"> assessment{p.predictionCount !== 1 ? "s" : ""}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          {p.pendingReviews > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200
                                             text-amber-800 text-[10px] font-bold px-2 py-0.5">
                              <Clock className="h-3 w-3" />
                              {p.pendingReviews} pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] font-medium">
                              <CheckCircle2 className="h-3 w-3" />
                              All reviewed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {new Date(p.lastSeen).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                          <p className="text-[10px] text-slate-400">
                            {new Date(p.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <Link href={`/doctor/patients/${p.id}`}>
                            <Button variant="ghost" size="sm"
                              className="h-7 text-[11px] text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1">
                              View Chart
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Showing {filtered.length} of {patients.length} patients
                  {lastUpdated && ` · Auto-refreshes every 30s · Last: ${lastUpdated.toLocaleTimeString()}`}
                </span>
                <span className={`flex items-center gap-1 text-[10px] font-semibold
                  ${isLive ? "text-emerald-600" : "text-slate-400"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                  {isLive ? "Live data" : "Disconnected"}
                </span>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {filtered.map((p) => {
                const risk = RISK_CONFIG[p.risk] || RISK_CONFIG.LOW;
                return (
                  <Link key={p.id} href={`/doctor/patients/${p.id}`} className="block">
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs
                                    hover:border-emerald-300 transition-all active:scale-[0.99]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-10 w-10 rounded-full ${risk.color} border ${risk.border}
                                          flex items-center justify-center shrink-0 font-bold text-xs`}>
                            {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-slate-900 text-sm truncate">{p.name}</p>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${risk.color} ${risk.border}`}>
                                {risk.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {p.mrn} · {p.predictionCount} assessments
                              {p.pendingReviews > 0 && (
                                <span className="ml-2 text-amber-700 font-medium">
                                  · {p.pendingReviews} pending
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
    </div>
  );
}
