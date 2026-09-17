"use client";

import * as React from "react";
import {
  Search,
  Pill,
  Building2,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Info,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { ExternalApiService } from "@/services/external-apis/ExternalApiService";
import type {
  ExternalEnvelope,
  ExternalDrugInformation,
  ExternalProviderInformation,
} from "@/services/external-apis/ExternalApiTypes";

export default function DoctorExternalDataPage() {
  const [activeTab, setActiveTab] = React.useState<"drugs" | "providers">("drugs");

  // Drug search state
  const [drugQuery, setDrugQuery] = React.useState("");
  const [drugLoading, setDrugLoading] = React.useState(false);
  const [drugError, setDrugError] = React.useState<string | null>(null);
  const [drugResult, setDrugResult] = React.useState<ExternalEnvelope<ExternalDrugInformation> | null>(null);

  // Provider lookup state
  const [npiQuery, setNpiQuery] = React.useState("");
  const [providerLoading, setProviderLoading] = React.useState(false);
  const [providerError, setProviderError] = React.useState<string | null>(null);
  const [providerResult, setProviderResult] = React.useState<ExternalEnvelope<ExternalProviderInformation> | null>(null);

  const handleDrugSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugQuery.trim()) return;

    setDrugLoading(true);
    setDrugError(null);
    setDrugResult(null);

    try {
      const res = await ExternalApiService.searchDrugs(drugQuery.trim());
      setDrugResult(res);
    } catch (err: any) {
      setDrugError(err?.response?.data?.detail || "Drug reference information temporarily unavailable.");
    } finally {
      setDrugLoading(false);
    }
  };

  const handleProviderSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npiQuery.trim()) return;

    setProviderLoading(true);
    setProviderError(null);
    setProviderResult(null);

    try {
      const res = await ExternalApiService.lookupProvider({ npi: npiQuery.trim() });
      setProviderResult(res);
    } catch (err: any) {
      setProviderError(err?.response?.data?.detail || "Provider registry lookup temporarily unavailable.");
    } finally {
      setProviderLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 bg-white p-6 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
              External Reference Data
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <ShieldCheck className="h-3 w-3" />
              SSRF & PHI Protected
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Clinical External Reference Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Query approved external healthcare directories (openFDA, CMS NPPES) via the secure application gateway.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab("drugs")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "drugs"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Pill className="h-3.5 w-3.5 text-emerald-600" />
            Drug Reference (openFDA)
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "providers"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-indigo-600" />
            Provider Registry (NPPES)
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-3">
        <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <span className="font-semibold">Clinical Data Boundary Notice: </span>
          All queries through this portal are strictly non-identifying. No patient records, vitals, or clinical diagnoses are transmitted externally. External data is supplementary and does not modify patient charts.
        </div>
      </div>

      {/* TAB 1: DRUG SEARCH */}
      {activeTab === "drugs" && (
        <div className="space-y-6">
          {/* Search Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <form onSubmit={handleDrugSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={drugQuery}
                  onChange={(e) => setDrugQuery(e.target.value)}
                  placeholder="Enter brand or generic drug name (e.g. Metformin, Lisinopril, Lipitor)..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={drugLoading || !drugQuery.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {drugLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Querying openFDA...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Query FDA Label
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error Message */}
          {drugError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              {drugError}
            </div>
          )}

          {/* Results Card */}
          {drugResult && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Provenance Header */}
              <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] tracking-wider">
                    EXTERNAL PUBLIC API
                  </span>
                  <span className="font-semibold text-slate-200">
                    Source: {drugResult.provenance.provider}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-300 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    Retrieved: {new Date(drugResult.provenance.retrieved_at).toLocaleTimeString()}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    Status: {drugResult.provenance.validation_status}
                  </span>
                </div>
              </div>

              {/* Drug Content */}
              <div className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{drugResult.data.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Generic: <span className="font-medium text-slate-700">{drugResult.data.generic_name}</span> | Manufacturer: <span className="font-medium text-slate-700">{drugResult.data.manufacturer}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded border border-slate-200 text-slate-700">
                      NDC: {drugResult.data.identifier}
                    </span>
                  </div>
                </div>

                {/* Indications */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Indications & Usage
                  </h3>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800">
                    {drugResult.data.indications}
                  </div>
                </div>

                {/* Warnings */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    FDA Boxed Warnings & Safety Precautions
                  </h3>
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs leading-relaxed text-rose-900">
                    {drugResult.data.warnings}
                  </div>
                </div>

                {/* Active Ingredients */}
                {drugResult.data.active_ingredients && drugResult.data.active_ingredients.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Active Substances
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {drugResult.data.active_ingredients.map((sub, idx) => (
                        <span
                          key={`${sub}-${idx}`}
                          className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md text-xs font-medium"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!drugResult && !drugLoading && !drugError && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-8">
              <Pill className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No Drug Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Enter an FDA-approved pharmaceutical brand or generic name above to view official product labeling and warnings.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROVIDER SEARCH */}
      {activeTab === "providers" && (
        <div className="space-y-6">
          {/* Search Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <form onSubmit={handleProviderSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={npiQuery}
                  onChange={(e) => setNpiQuery(e.target.value)}
                  placeholder="Enter 10-digit National Provider Identifier (NPI)..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={providerLoading || !npiQuery.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {providerLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Querying NPPES...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Verify Provider NPI
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error Message */}
          {providerError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              {providerError}
            </div>
          )}

          {/* Results Card */}
          {providerResult && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Provenance Header */}
              <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] tracking-wider">
                    EXTERNAL PUBLIC API
                  </span>
                  <span className="font-semibold text-slate-200">
                    Source: {providerResult.provenance.provider}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-300 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    Retrieved: {new Date(providerResult.provenance.retrieved_at).toLocaleTimeString()}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    Status: {providerResult.provenance.validation_status}
                  </span>
                </div>
              </div>

              {/* Provider Info */}
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{providerResult.data.provider_name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Specialty: <span className="font-medium text-slate-700">{providerResult.data.specialty}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded">
                      NPI: {providerResult.data.npi}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
                      {providerResult.data.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-semibold block mb-1">Practice Location</span>
                    <span className="text-slate-800">{providerResult.data.practice_address || "Unspecified"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-semibold block mb-1">Registry Enumeration Date</span>
                    <span className="text-slate-800">{providerResult.data.enumeration_date || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!providerResult && !providerLoading && !providerError && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-8">
              <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No NPI Searched</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Enter a 10-digit National Provider Identifier above to verify medical licensure and registered specialties.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
