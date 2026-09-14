"use client";

import { Database, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClinicalStore, type DataQualityMetric } from "@/features/clinical/clinicalStore";

export default function DataQualityPage() {
  const { dataQualityMetrics } = useClinicalStore();

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "PASSED":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <XCircle className="h-4 w-4 text-rose-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Data Quality</h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated integrity, completeness, and distribution metrics across clinical feature pipelines.
        </p>
      </div>

      {dataQualityMetrics && dataQualityMetrics.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataQualityMetrics.map((item: DataQualityMetric) => (
            <Card key={item.id} className="bg-white border-slate-200">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {item.metric_name}
                  </p>
                  <Badge variant="outline" className="text-xs flex items-center gap-1 border-slate-200">
                    {getStatusIcon(item.status)}
                    <span>{item.status}</span>
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {(item.score * 100).toFixed(1)}%
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-purple-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, item.score * 100))}%` }}
                  />
                </div>
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
