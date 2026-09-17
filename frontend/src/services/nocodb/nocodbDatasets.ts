/**
 * Dataset registry helpers, category badges, and icon definitions for NocoDB.
 */
import type { DatasetCategory } from "./types";

export interface CategoryMeta {
  label: string;
  badgeClass: string;
  description: string;
}

export const DATASET_CATEGORIES: Record<DatasetCategory, CategoryMeta> = {
  ML_OPS: {
    label: "ML & AI Operations",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description: "Model evaluations, calibration metrics, and live inference tracking.",
  },
  DATA_QUALITY: {
    label: "Data Quality & Integrity",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Ingestion anomalies, schema constraint violations, and missingness queues.",
  },
  CLINICAL_OPS: {
    label: "Clinical Workflow Ops",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Triage latencies, clinician override rates, and department throughput.",
  },
  SYSTEM_TELEMETRY: {
    label: "System & API Telemetry",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    description: "Healthcare external API response times and infrastructure telemetry.",
  },
  COLLABORATION: {
    label: "Whiteboard Collaboration",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Diagram sessions, canvas classifications, and version audit states.",
  },
  GENERAL: {
    label: "General Analytics",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Ad-hoc internal reporting and tabular aggregates.",
  },
};

export function getCategoryMeta(category: DatasetCategory): CategoryMeta {
  return (
    DATASET_CATEGORIES[category] || {
      label: category,
      badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
      description: "Dataset",
    }
  );
}

export function formatDatasetRowCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return count.toString();
}
