"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FileText,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Star,
  Tag,
  ThumbsUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { kaggleDatasetsApi, KaggleCandidate } from "@/services/kaggleDatasets";

const PRESET_QUERIES = [
  "patient risk",
  "diabetes",
  "stroke",
  "heart disease",
  "cardiovascular",
  "hypertension",
];

export default function DiscoverDatasetsPage() {
  const router = useRouter();
  const [query, setQuery] = React.useState("patient risk");
  const [candidates, setCandidates] = React.useState<KaggleCandidate[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [importingSlug, setImportingSlug] = React.useState<string | null>(null);
  const [importedSlugs, setImportedSlugs] = React.useState<Set<string>>(new Set());

  const handleSearch = React.useCallback(async (searchQuery: string) => {
    try {
      setLoading(true);
      const list = await kaggleDatasetsApi.discoverDatasets(searchQuery);
      setCandidates(list);
    } catch (err) {
      console.error("Discovery error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    handleSearch("patient risk");
  }, [handleSearch]);

  const handleImport = async (candidate: KaggleCandidate) => {
    const key = `${candidate.kaggle_owner}/${candidate.kaggle_slug}`;
    try {
      setImportingSlug(key);
      const res = await kaggleDatasetsApi.importDataset({
        kaggle_owner: candidate.kaggle_owner,
        kaggle_slug: candidate.kaggle_slug,
        title: candidate.title,
        description: candidate.description,
        dataset_url: candidate.dataset_url,
        license_name: candidate.license_name,
        author: candidate.author,
      });
      setImportedSlugs((prev) => new Set([...prev, key]));
      // Navigate to dataset detail page
      router.push(`/informaticist/datasets/${res.id}`);
    } catch (err) {
      console.error("Failed to import dataset:", err);
    } finally {
      setImportingSlug(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 bg-white min-h-screen">
      {/* Navigation and Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/informaticist/datasets"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dataset Catalog
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kaggle Dataset Discovery Engine
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Query and inspect candidate healthcare machine learning cohorts from the Kaggle ecosystem.
          </p>
        </div>
      </div>

      {/* Search Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Kaggle by clinical indication, physiology, or cohort..."
              className="pl-9 bg-white border-slate-200 h-10"
            />
          </div>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Discover
          </Button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 font-medium mr-1">Clinical Domains:</span>
          {PRESET_QUERIES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setQuery(term);
                handleSearch(term);
              }}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                query === term
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Discovery Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Candidate Datasets ({candidates.length})
          </h2>
          <span className="text-xs text-slate-500">
            Showing authoritative search responses from Kaggle API Gateway
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Searching Kaggle repository...</p>
          </div>
        ) : candidates.length === 0 ? (
          <Card className="p-8 text-center border-slate-200 bg-white">
            <Database className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">No candidates returned for query &quot;{query}&quot;</p>
            <p className="text-xs text-slate-500 mt-1">Try broadening your search term or select one of the suggested clinical domains.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidates.map((c) => {
              const key = `${c.kaggle_owner}/${c.kaggle_slug}`;
              const isImported = importedSlugs.has(key);
              const isProcessing = importingSlug === key;

              return (
                <Card key={key} className="border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900 leading-snug">
                          {c.title}
                        </CardTitle>
                        <CardDescription className="text-xs font-mono text-slate-500 mt-0.5">
                          {c.kaggle_owner}/{c.kaggle_slug}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-slate-600 border-slate-200 text-xs shrink-0">
                        {c.license_name}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 mt-3 leading-relaxed">
                      {c.description || "No description provided."}
                    </p>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 pb-3">
                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <ThumbsUp className="h-3.5 w-3.5 text-amber-500" />
                        {c.vote_count.toLocaleString()} votes
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3.5 w-3.5 text-slate-400" />
                        {c.download_count.toLocaleString()} downloads
                      </span>
                      <span>
                        Size: {(c.size_bytes / 1024).toFixed(1)} KB
                      </span>
                      {c.usability_rating > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                          {Math.round(c.usability_rating * 100)}% Usability
                        </span>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={c.dataset_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                    >
                      Kaggle Page <ExternalLink className="h-3 w-3" />
                    </a>

                    <Button
                      size="sm"
                      onClick={() => handleImport(c)}
                      disabled={isImported || isProcessing}
                      className={
                        isImported
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                          : "bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      }
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          Importing...
                        </>
                      ) : isImported ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Registered
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Import to Catalog
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
