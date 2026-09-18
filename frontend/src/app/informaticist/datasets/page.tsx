"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  DownloadCloud,
  FileCheck,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { kaggleDatasetsApi, KaggleDatasetSummary, KaggleAuthStatus } from "@/services/kaggleDatasets";

export default function DatasetsOverviewPage() {
  const [datasets, setDatasets] = React.useState<KaggleDatasetSummary[]>([]);
  const [authStatus, setAuthStatus] = React.useState<KaggleAuthStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [approvalFilter, setApprovalFilter] = React.useState("ALL");

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [auth, list] = await Promise.all([
        kaggleDatasetsApi.getAuthStatus().catch(() => null),
        kaggleDatasetsApi.listDatasets({
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          approval_status: approvalFilter !== "ALL" ? approvalFilter : undefined,
          search: searchQuery.trim() || undefined,
        }).catch(() => []),
      ]);
      setAuthStatus(auth);
      setDatasets(list);
    } catch (err) {
      console.error("Failed to load datasets:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, approvalFilter]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistics derived purely from real returned data
  const totalCount = datasets.length;
  const validatedCount = datasets.filter((d) => d.status === "VALIDATED").length;
  const approvedTrainingCount = datasets.filter((d) => d.approval_status === "APPROVED_FOR_TRAINING").length;
  const underReviewCount = datasets.filter((d) => d.status === "UNDER_REVIEW" || d.status === "DISCOVERED").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VALIDATED":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Validated</Badge>;
      case "APPROVED":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Approved</Badge>;
      case "VALIDATING":
      case "INGESTING":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse">{status}</Badge>;
      case "REJECTED":
      case "FAILED":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">{status}</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-600 border-slate-200">{status}</Badge>;
    }
  };

  const getApprovalBadge = (tier: string) => {
    switch (tier) {
      case "APPROVED_FOR_TRAINING":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Approved for Training</Badge>;
      case "APPROVED_FOR_RESEARCH":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Research Only</Badge>;
      case "APPROVED_FOR_PRODUCTION":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Production Approved</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-amber-700 border-amber-200">Pending Review</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Kaggle Dataset Intelligence & Ingestion
            </h1>
            <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
              External Provider
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Discover, audit, version, and validate external healthcare datasets. Neon PostgreSQL is the sole authoritative store.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/informaticist/datasets/discover">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Discover Kaggle Datasets
            </Button>
          </Link>
          <Button variant="outline" size="icon" onClick={loadData} title="Refresh dataset list">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : "text-slate-600"}`} />
          </Button>
        </div>
      </div>

      {/* Integration Mode & Invariants Alert */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm text-amber-900">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Healthcare ML Governance Invariant:</span> External Kaggle datasets are strictly for research, benchmarking, and development. They are explicitly separated from inpatient EHR records. No model trained on external datasets is promoted to production clinical inference without human clinician sign-off.
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded border border-amber-200">
          <span className="text-slate-500">Gateway Mode:</span>
          <span className="font-semibold text-slate-800">{authStatus?.backend_mode || "CHECKING..."}</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-slate-500">
              Catalog Cohorts
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">{totalCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-slate-500 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-slate-400" />
            Registered in Neon PostgreSQL
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-slate-500">
              Fully Validated
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">{validatedCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-slate-500 flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
            Passed Quality & Range Gates
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-slate-500">
              Approved for Training
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-600">{approvedTrainingCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            Available for ML Pipelines
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-slate-500">
              Under Review / Pending
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">{underReviewCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Awaiting Audit Sign-off
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by title, owner, or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-white border-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DISCOVERED">Discovered</SelectItem>
              <SelectItem value="VALIDATED">Validated</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={approvalFilter} onValueChange={setApprovalFilter}>
            <SelectTrigger className="w-[180px] bg-white border-slate-200">
              <SelectValue placeholder="Approval Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Approval Tiers</SelectItem>
              <SelectItem value="PENDING">Pending Review</SelectItem>
              <SelectItem value="APPROVED_FOR_RESEARCH">Research Only</SelectItem>
              <SelectItem value="APPROVED_FOR_TRAINING">Approved for Training</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Datasets Table */}
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Dataset Repository</th>
                <th className="py-3 px-4">License</th>
                <th className="py-3 px-4">Cohort Size</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Clinical Suitability</th>
                <th className="py-3 px-4">Approval Tier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && datasets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading authoritative dataset catalog...
                  </td>
                </tr>
              ) : datasets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <Database className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">No Kaggle datasets found matching filters.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click &quot;Discover Kaggle Datasets&quot; above to search and import candidates.
                    </p>
                  </td>
                </tr>
              ) : (
                datasets.map((ds) => (
                  <tr key={ds.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link href={`/informaticist/datasets/${ds.id}`} className="font-semibold text-blue-600 hover:underline">
                        {ds.title}
                      </Link>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {ds.kaggle_owner}/{ds.kaggle_slug} (v{ds.version_number})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                      {ds.license_name}
                    </td>
                    <td className="py-3.5 px-4">
                      {ds.row_count ? (
                        <div>
                          <span className="font-semibold text-slate-800">{ds.row_count.toLocaleString()}</span>
                          <span className="text-slate-500 text-xs"> rows · {ds.column_count} cols</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Not yet ingested</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(ds.status)}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant="outline"
                        className={
                          ds.clinical_suitability_status === "PASS"
                            ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                            : ds.clinical_suitability_status === "UNSUITABLE"
                            ? "text-rose-700 border-rose-200 bg-rose-50"
                            : "text-amber-700 border-amber-200 bg-amber-50"
                        }
                      >
                        {ds.clinical_suitability_status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">{getApprovalBadge(ds.approval_status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/informaticist/datasets/${ds.id}`}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          Inspect
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
