"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertTriangle, Database, RefreshCw, BarChart2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { kaggleDatasetsApi } from "@/services/kaggleDatasets";

export default function DatasetQualityReportPage() {
  const params = useParams();
  const datasetId = params.datasetId as string;
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    kaggleDatasetsApi.getDatasetQuality(datasetId)
      .then(setData)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [datasetId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 bg-white min-h-screen">
      <Link
        href={`/informaticist/datasets/${datasetId}`}
        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dataset Overview
      </Link>

      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl font-bold text-slate-900">Data Quality Audit Ledger</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Deep structural quality analysis computed by DatasetQualityEngine.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
          Loading quality report...
        </div>
      ) : !data ? (
        <Card className="p-8 text-center text-slate-500 bg-white border-slate-200">
          No quality report found. Please run the validation pipeline first.
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-slate-200 bg-white">
              <span className="text-xs text-slate-400 block font-semibold">Total Records Evaluated</span>
              <span className="text-xl font-bold text-slate-900">{data.row_count?.toLocaleString()}</span>
            </Card>
            <Card className="p-4 border-slate-200 bg-white">
              <span className="text-xs text-slate-400 block font-semibold">Column Dimensions</span>
              <span className="text-xl font-bold text-slate-900">{data.column_count} columns</span>
            </Card>
            <Card className="p-4 border-slate-200 bg-white">
              <span className="text-xs text-slate-400 block font-semibold">Quality Findings</span>
              <span className="text-xl font-bold text-amber-600">{data.findings_count}</span>
            </Card>
          </div>

          <Card className="border-slate-200 bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Recorded Quality Observations</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2">
              {data.findings?.map((f: any, i: number) => (
                <div key={i} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 flex items-start justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">
                      {f.feature ? `Feature [${f.feature}]: ` : ""}{f.issue_type}
                    </span>
                    <p className="text-slate-600 mt-0.5">{f.message}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                    {f.severity}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
