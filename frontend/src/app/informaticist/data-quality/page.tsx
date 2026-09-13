"use client";

import { Database, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function DataQualityPage() {
  const { dataQualityMetrics } = useClinicalStore();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Data Quality</h1>
      {dataQualityMetrics && Object.keys(dataQualityMetrics).length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(dataQualityMetrics).map(([key, value]) => (
            <Card key={key}>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider capitalize">{key.replace(/_/g, " ")}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{typeof value === "number" ? value.toFixed(2) : String(value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <Database className="h-12 w-12 text-slate-300 mx-auto" />
            <p className="text-slate-500">Data quality metrics will appear here once collected.</p>
            <p className="text-xs text-slate-400">Metrics are computed from clinical records and feature store.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
