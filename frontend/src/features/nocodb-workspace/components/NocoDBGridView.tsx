"use client";

import React, { useState, useEffect, useCallback } from "react";
import { nocodbClient } from "@/services/nocodb/nocodbClient";
import type {
  NocoDBDataset,
  NocoDBRowsResponse,
  NocoDBSchemaColumn,
  NocoDBRow,
} from "@/services/nocodb/types";

interface NocoDBGridViewProps {
  dataset: NocoDBDataset;
  canMutate?: boolean;
  canExport?: boolean;
  onRowSelect?: (row: NocoDBRow) => void;
}

export function NocoDBGridView({
  dataset,
  canMutate = false,
  canExport = true,
  onRowSelect,
}: NocoDBGridViewProps) {
  const [data, setData] = useState<NocoDBRowsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & pagination states
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [search, setSearch] = useState<string>("");
  const [sortCol, setSortCol] = useState<string>("");
  const [sortDesc, setSortDesc] = useState<boolean>(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Edit Modal State
  const [editingRow, setEditingRow] = useState<NocoDBRow | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sortParam = sortCol ? (sortDesc ? `-${sortCol}` : sortCol) : "";
      const res = await nocodbClient.getRows(dataset.slug, {
        page,
        page_size: pageSize,
        sort: sortParam,
        search,
        filters: filterValues,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load rows.");
    } finally {
      setIsLoading(false);
    }
  }, [dataset.slug, page, pageSize, sortCol, sortDesc, search, filterValues]);

  useEffect(() => {
    let isCurrent = true;
    fetchRows();
    return () => {
      isCurrent = false;
    };
  }, [fetchRows]);

  const handleSort = (colName: string) => {
    if (sortCol === colName) {
      if (sortDesc) {
        setSortCol("");
        setSortDesc(false);
      } else {
        setSortDesc(true);
      }
    } else {
      setSortCol(colName);
      setSortDesc(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await nocodbClient.exportCsv(dataset.slug);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dataset.slug}_export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Failed to export dataset.");
    }
  };

  const openEditModal = (row: NocoDBRow) => {
    if (!canMutate) return;
    setEditingRow(row);
    setEditFormData({ ...row });
  };

  const handleSaveEdit = async () => {
    if (!editingRow || !editingRow._record_id) return;
    setIsSaving(true);
    try {
      await nocodbClient.updateRow(dataset.slug, editingRow._record_id, editFormData);
      setEditingRow(null);
      fetchRows();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to save record.");
    } finally {
      setIsSaving(false);
    }
  };

  const schema = data?.schema || dataset.columns || [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
      {/* Table Toolbar */}
      <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder={`Search in ${dataset.title}...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`px-2.5 py-1.5 border rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isFilterOpen || Object.keys(filterValues).length > 0
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter
            {Object.keys(filterValues).length > 0 && (
              <span className="w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] flex items-center justify-center">
                {Object.keys(filterValues).length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {canExport && (
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export CSV
            </button>
          )}

          <button
            onClick={fetchRows}
            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 transition-colors"
            title="Refresh rows"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Drawer */}
      {isFilterOpen && (
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2.5 items-center">
          <span className="text-xs font-semibold text-slate-700">Active Filters:</span>
          {schema.slice(0, 5).map((col) => (
            <div key={col.name} className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 font-medium">{col.display_name}:</span>
              <input
                type="text"
                placeholder="Match..."
                value={filterValues[col.name] || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterValues((prev) => {
                    const next = { ...prev };
                    if (val) next[col.name] = val;
                    else delete next[col.name];
                    return next;
                  });
                  setPage(1);
                }}
                className="w-24 text-xs bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-800"
              />
            </div>
          ))}
          {Object.keys(filterValues).length > 0 && (
            <button
              onClick={() => {
                setFilterValues({});
                setPage(1);
              }}
              className="text-[11px] text-rose-600 hover:underline font-medium ml-2"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Grid Container */}
      <div className="overflow-x-auto min-h-[320px]">
        {error ? (
          <div className="p-8 text-center text-xs text-rose-600 bg-rose-50/50">
            {error}
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th className="py-2.5 px-3 w-12 text-center text-slate-400 font-medium">#</th>
                {schema.map((col) => {
                  const isSorted = sortCol === col.name;
                  return (
                    <th
                      key={col.id || col.name}
                      onClick={() => handleSort(col.name)}
                      className="py-2.5 px-3 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.display_name}</span>
                        {isSorted && (
                          <span className="text-blue-600">
                            {sortDesc ? "▼" : "▲"}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({col.column_type})
                        </span>
                      </div>
                    </th>
                  );
                })}
                {canMutate && <th className="py-2.5 px-3 w-16 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading && !data ? (
                <tr>
                  <td
                    colSpan={schema.length + 2}
                    className="py-12 text-center text-slate-400 animate-pulse"
                  >
                    Loading records from Neon PostgreSQL...
                  </td>
                </tr>
              ) : data && data.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={schema.length + 2}
                    className="py-12 text-center text-slate-400"
                  >
                    No records found in this dataset.
                  </td>
                </tr>
              ) : (
                data?.rows.map((row, idx) => {
                  const rowNum = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={row._record_id || idx}
                      onClick={() => onRowSelect && onRowSelect(row)}
                      className="hover:bg-blue-50/20 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {rowNum}
                      </td>
                      {schema.map((col) => {
                        const val = row[col.name];
                        return (
                          <td key={col.name} className="py-2.5 px-3 whitespace-nowrap font-medium">
                            {renderCell(val, col)}
                          </td>
                        );
                      })}
                      {canMutate && (
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(row);
                            }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {data && (
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Showing {data.rows.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(page * pageSize, data.total_rows)} of {data.total_rows} entries
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none"
            >
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition-colors font-medium text-slate-700"
            >
              Previous
            </button>
            <span className="px-2 py-1 text-slate-600 font-semibold">
              {page} / {Math.max(1, data.total_pages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              disabled={page >= data.total_pages || isLoading}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition-colors font-medium text-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Inline Edit Modal */}
      {editingRow && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">
                Edit Record ({dataset.title})
              </h3>
              <button
                onClick={() => setEditingRow(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {schema
                .filter((col) => !col.is_primary && !col.is_read_only)
                .map((col) => (
                  <div key={col.name}>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {col.display_name}
                    </label>
                    {col.column_type === "Select" && col.options ? (
                      <select
                        value={editFormData[col.name] ?? ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, [col.name]: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800"
                      >
                        {col.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : col.column_type === "Checkbox" ? (
                      <input
                        type="checkbox"
                        checked={Boolean(editFormData[col.name])}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, [col.name]: e.target.checked })
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={editFormData[col.name] ?? ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, [col.name]: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800"
                      />
                    )}
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingRow(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderCell(val: any, col: NocoDBSchemaColumn) {
  if (val === null || val === undefined) {
    return <span className="text-slate-300 italic">—</span>;
  }

  if (typeof val === "boolean") {
    return val ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Yes
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        No
      </span>
    );
  }

  if (col.column_type === "Select") {
    const s = String(val);
    const isCritical = ["Critical", "High", "REJECTED", "FAILED"].includes(s);
    const isSuccess = ["Stable", "Resolved", "ACTIVE", "APPROVED", "Low", "AGREED"].includes(s);
    const isWarning = ["Moderate", "Investigating", "CHALLENGER", "Medium"].includes(s);

    let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
    if (isCritical) badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
    else if (isSuccess) badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
    else if (isWarning) badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";

    return (
      <span
        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeStyle}`}
      >
        {s}
      </span>
    );
  }

  if (col.column_type === "Number" && typeof val === "number") {
    return <span className="font-mono text-slate-700">{val}</span>;
  }

  if (col.column_type === "DateTime" && typeof val === "string") {
    return <span className="text-slate-500 font-mono text-[11px]">{val.slice(0, 19).replace("T", " ")}</span>;
  }

  return <span>{String(val)}</span>;
}
