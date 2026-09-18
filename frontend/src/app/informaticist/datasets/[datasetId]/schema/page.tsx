"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RefreshCw, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { kaggleDatasetsApi } from "@/services/kaggleDatasets";

export default function DatasetSchemaPage() {
  const params = useParams();
  const datasetId = params.datasetId as string;
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    kaggleDatasetsApi.getDatasetSchema(datasetId)
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
        <h1 className="text-xl font-bold text-slate-900">Feature Schema & Clinical Data Dictionary</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Standardized clinical feature definitions, physiological constraints, and leakage annotations.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
          Loading schema dictionary...
        </div>
      ) : !data || !data.features || data.features.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 bg-white border-slate-200">
          No feature definitions recorded. Please run dataset validation to extract schema.
        </Card>
      ) : (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Registered Features ({data.feature_count})</CardTitle>
            <CardDescription className="text-xs">Version {data.version_number}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Feature</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Physiological Range</th>
                    <th className="py-2.5 px-4">Missing %</th>
                    <th className="py-2.5 px-4">Leakage Status</th>
                    <th className="py-2.5 px-4">Clinical Semantics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.features.map((feat: any) => (
                    <tr key={feat.name} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{feat.name}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">{feat.data_type}</td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {feat.min !== null && feat.min !== undefined ? `${feat.min} - ${feat.max}` : "Categorical"}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{feat.missing_pct}%</td>
                      <td className="py-2.5 px-4">
                        <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50">
                          {feat.leakage_status || "SAFE"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{feat.clinical_meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
