'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  History, ArrowLeft, ArrowRight, ShieldCheck, 
  AlertCircle, CheckCircle2, Clock, GitCompare, 
  Database, RefreshCw, FileText
} from 'lucide-react';
import { kaggleDatasetsApi, DatasetDetail, KaggleDatasetVersion } from '@/services/kaggleDatasets';

export default function DatasetVersionsPage() {
  const params = useParams();
  const datasetId = params?.datasetId as string;

  const [dataset, setDataset] = useState<DatasetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(0);

  useEffect(() => {
    if (!datasetId) return;

    async function loadData() {
      try {
        setLoading(true);
        const data = await kaggleDatasetsApi.getDataset(datasetId);
        setDataset(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dataset version history');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [datasetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-sm font-medium text-slate-600">Loading version lineage...</span>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-5 h-5" />
          <span>Error Loading Versions</span>
        </div>
        <p className="mt-2 text-sm">{error || 'Dataset not found.'}</p>
        <Link href="/informaticist/datasets" className="inline-flex items-center mt-4 text-sm font-medium text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const versions = dataset.versions || [];
  const activeVersion = versions[selectedVersionIndex] || versions[0];
  const previousVersion = versions.length > 1 && selectedVersionIndex < versions.length - 1 
    ? versions[selectedVersionIndex + 1] 
    : null;

  return (
    <div className="space-y-6">
      {/* Header Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/informaticist/datasets" className="hover:text-blue-600">Datasets</Link>
            <span>/</span>
            <Link href={`/informaticist/datasets/${dataset.id}`} className="hover:text-blue-600">{dataset.title}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Version History & Schema Diff</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            Dataset Versioning & Distribution Evolution
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable snapshot log with cryptographic hashes, schema comparisons, and feature drift audits.
          </p>
        </div>
        <Link
          href={`/informaticist/datasets/${dataset.id}`}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Overview
        </Link>
      </div>

      {versions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Snapshot Versions Available</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            This dataset has not yet been ingested and versioned into an authoritative immutable snapshot.
          </p>
          <div className="mt-4">
            <Link
              href={`/informaticist/datasets/${dataset.id}/validation`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
            >
              Trigger Ingestion & Validation Gate
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Versions Sidebar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Snapshot Releases ({versions.length})
            </h2>
            <div className="space-y-2">
              {versions.map((ver: KaggleDatasetVersion, idx: number) => {
                const isSelected = idx === selectedVersionIndex;
                return (
                  <button
                    key={ver.id}
                    onClick={() => setSelectedVersionIndex(idx)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">
                        Version {ver.version_number}
                      </span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-3">
                      <span>{ver.row_count.toLocaleString()} rows</span>
                      <span>•</span>
                      <span>{ver.column_count} cols</span>
                      <span>•</span>
                      <span>{(ver.file_size_bytes / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-slate-400 truncate">
                      SHA: {ver.content_hash_sha256.substring(0, 16)}...
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Version Details & Schema Diff View */}
          <div className="lg:col-span-2 space-y-6">
            {activeVersion && (
              <>
                {/* Active Snapshot Summary Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Authoritative Snapshot</span>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                        Release v{activeVersion.version_number}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        Status: {activeVersion.validation_status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Ingested At</span>
                      <div className="text-sm font-semibold text-slate-800 mt-1">
                        {new Date(activeVersion.ingested_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Authoritative Rows</span>
                      <div className="text-sm font-semibold text-slate-800 mt-1">
                        {activeVersion.row_count.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Columns</span>
                      <div className="text-sm font-semibold text-slate-800 mt-1">
                        {activeVersion.column_count}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Storage Size</span>
                      <div className="text-sm font-semibold text-slate-800 mt-1">
                        {(activeVersion.file_size_bytes / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SHA-256 Digest</span>
                    <div className="mt-1 p-2 bg-slate-900 rounded font-mono text-xs text-emerald-400 select-all break-all">
                      {activeVersion.content_hash_sha256}
                    </div>
                  </div>
                </div>

                {/* Schema Comparison / Diff Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <GitCompare className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-base font-semibold text-slate-900">
                        {previousVersion 
                          ? `Comparison: v${activeVersion.version_number} vs v${previousVersion.version_number}`
                          : `Baseline Schema Architecture (v${activeVersion.version_number})`
                        }
                      </h3>
                    </div>
                  </div>

                  {previousVersion ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs font-medium text-slate-500">Prior Version (v{previousVersion.version_number}):</span>
                            <p className="font-semibold text-slate-800">{previousVersion.row_count.toLocaleString()} rows • {previousVersion.column_count} cols</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-slate-500">Delta Evolution:</span>
                            <p className="font-semibold text-emerald-700">
                              {activeVersion.row_count - previousVersion.row_count >= 0 ? '+' : ''}
                              {(activeVersion.row_count - previousVersion.row_count).toLocaleString()} rows
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-2.5 text-left font-semibold text-slate-700">Feature Column</th>
                              <th className="px-4 py-2.5 text-left font-semibold text-slate-700">v{previousVersion.version_number} Type</th>
                              <th className="px-4 py-2.5 text-left font-semibold text-slate-700">v{activeVersion.version_number} Type</th>
                              <th className="px-4 py-2.5 text-left font-semibold text-slate-700">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {Object.entries(activeVersion.schema_definition || {}).map(([col, type]: [string, any]) => {
                              const priorType = previousVersion.schema_definition?.[col];
                              const isUnchanged = priorType === type;
                              return (
                                <tr key={col} className="hover:bg-slate-50">
                                  <td className="px-4 py-2 font-mono text-xs font-medium text-slate-800">{col}</td>
                                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{priorType || '—'}</td>
                                  <td className="px-4 py-2 font-mono text-xs text-blue-600">{String(type)}</td>
                                  <td className="px-4 py-2 text-xs">
                                    {!priorType ? (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Added</span>
                                    ) : isUnchanged ? (
                                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">Identical</span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">Type Changed</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600">
                        This is the initial baseline snapshot release. All features represent the canonical schema registered during onboarding.
                      </p>
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-2.5 text-left font-semibold text-slate-700">Feature Column</th>
                              <th className="px-4 py-2.5 text-left font-semibold text-slate-700">Inferred Ingestion Type</th>
                              <th className="px-4 py-2.5 text-left font-semibold text-slate-700">Classification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {Object.entries(activeVersion.schema_definition || {}).map(([col, type]: [string, any]) => (
                              <tr key={col} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-mono text-xs font-semibold text-slate-800">{col}</td>
                                <td className="px-4 py-2 font-mono text-xs text-blue-600">{String(type)}</td>
                                <td className="px-4 py-2 text-xs text-slate-600">
                                  {col.toLowerCase().includes('outcome') || col.toLowerCase().includes('target') || col.toLowerCase().includes('stroke') || col.toLowerCase().includes('heart')
                                    ? <span className="font-semibold text-amber-700">Clinical Target Ground Truth</span>
                                    : 'Deterministic Clinical Predictor'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
