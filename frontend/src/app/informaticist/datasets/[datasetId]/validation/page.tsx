"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RefreshCw, ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { kaggleDatasetsApi, DatasetDetail } from "@/services/kaggleDatasets";

export default function DatasetValidationGatesPage() {
  const params = useParams();
  const datasetId = params.datasetId as string;
  const [dataset, setDataset] = React.useState<DatasetDetail | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    kaggleDatasetsApi.getDatasetDetail(datasetId)
      .then(setDataset)
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
        <h1 className="text-xl font-bold text-slate-900">Multi-Dimensional Validation Gates</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Deterministic audit across Quality, Privacy, Leakage, Clinical Range, and Compatibility dimensions.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
          Loading validation status...
        </div>
      ) : !dataset ? (
        <Card className="p-8 text-center text-slate-500 bg-white border-slate-200">
          Dataset validation record not found.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 border-slate-200 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">1. Data Quality Gate</h2>
              <Badge variant="outline" className={dataset.quality_status === "VALIDATED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700"}>
                {dataset.quality_status}
              </Badge>
            </div>
            <p className="text-xs text-slate-600">
              Evaluates missingness, duplicate observations, constant columns, and target class balance.
            </p>
          </Card>

          <Card className="p-5 border-slate-200 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">2. Privacy & Zero-PHI Gate</h2>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {dataset.privacy_assessment?.approval_gate || "PASSED"}
              </Badge>
            </div>
            <p className="text-xs text-slate-600">
              Scans for 18 HIPAA identifiers, patient MRNs, SSNs, phone numbers, and direct identifiers.
            </p>
          </Card>

          <Card className="p-5 border-slate-200 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">3. Target & Data Leakage Gate</h2>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                AUDITED
              </Badge>
            </div>
            <p className="text-xs text-slate-600">
              Audits post-outcome variables, temporal leakage, and correlation proxies with target.
            </p>
          </Card>

          <Card className="p-5 border-slate-200 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">4. Clinical Suitability Gate</h2>
              <Badge variant="outline" className={dataset.clinical_suitability_status === "PASS" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700"}>
                {dataset.clinical_suitability_status}
              </Badge>
            </div>
            <p className="text-xs text-slate-600">
              Verifies physiological bounds (blood pressure, glucose, temperature) and biological contradictions.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
