"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RefreshCw, GitBranch, Database, Cpu, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { kaggleDatasetsApi, DatasetLineageGraph } from "@/services/kaggleDatasets";

export default function DatasetLineagePage() {
  const params = useParams();
  const datasetId = params.datasetId as string;
  const [lineage, setLineage] = React.useState<DatasetLineageGraph | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    kaggleDatasetsApi.getDatasetLineage(datasetId)
      .then(setLineage)
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
        <h1 className="text-xl font-bold text-slate-900">Provenance & Model Lineage DAG</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Auditable chain of custody from external Kaggle source to clinical decision support predictions.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
          Tracing dataset provenance...
        </div>
      ) : !lineage ? (
        <Card className="p-8 text-center text-slate-500 bg-white border-slate-200">
          No lineage graph available.
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Lineage Execution Graph Nodes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {lineage.nodes.map((node, i) => (
                <div key={node.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                  <div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-blue-700 border-blue-200 bg-blue-50 mb-2">
                      Stage {i + 1}: {node.type}
                    </Badge>
                    <p className="text-xs font-semibold text-slate-800">{node.label}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-3">Node ID: {node.id}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-2">Relational Dependencies (Edges)</h2>
            <div className="space-y-2">
              {lineage.edges.map((e, idx) => (
                <div key={idx} className="p-2.5 rounded border border-slate-100 bg-slate-50 text-xs font-mono text-slate-700 flex items-center gap-2">
                  <span className="font-semibold text-blue-600">{e.source}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-purple-600">{e.target}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
