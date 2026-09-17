"use client";

import * as React from "react";
import { Search, Globe, ShieldCheck, ExternalLink, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { webIntelligenceService } from "@/services/webIntelligenceService";
import type { SearchResultItem } from "@/types/webIntelligence";
import { SourceViewerModal } from "./SourceViewerModal";

interface SearchIntelligenceProps {
  role?: string;
  defaultQuery?: string;
  allowDomainFilter?: boolean;
}

export function SearchIntelligence({
  role = "DOCTOR",
  defaultQuery = "",
  allowDomainFilter = true,
}: SearchIntelligenceProps) {
  const [query, setQuery] = React.useState(defaultQuery);
  const [domainFilter, setDomainFilter] = React.useState("");
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);

  // Selected source for modal preview
  const [activeSource, setActiveSource] = React.useState<SearchResultItem | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const data = await webIntelligenceService.search(
        query.trim(),
        10,
        domainFilter.trim() || undefined
      );
      setResults(data.results || []);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || "Failed to retrieve search results.";
      setErrorMessage(msg);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "TIER_1":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "TIER_2":
        return "border-blue-200 bg-blue-50 text-blue-700";
      case "TIER_3":
        return "border-amber-200 bg-amber-50 text-amber-700";
      default:
        return "border-slate-200 bg-slate-50 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header Form */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Medical Literature & Evidence Search
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Retrieves verified medical studies, CDC/WHO guidelines, and approved health repositories via Firecrawl.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-slate-200 text-slate-600 bg-slate-50 text-xs">
              Role: {role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Enter medical guideline or clinical search query (e.g. Sepsis bundle, ACC/AHA hypertension)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <Button type="submit" disabled={isLoading || !query.trim()} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            {allowDomainFilter && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-medium text-slate-500">Filter Domain:</span>
                <Input
                  placeholder="e.g. cdc.gov, who.int, nejm.org"
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="h-8 max-w-xs text-xs bg-white border-slate-200 text-slate-900"
                />
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Results Container */}
      <div className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border border-slate-200 bg-white p-5">
                <div className="h-4 w-1/3 rounded bg-slate-200 mb-2" />
                <div className="h-3 w-3/4 rounded bg-slate-100 mb-2" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
              </Card>
            ))}
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && !errorMessage && (
          <Card className="border border-slate-200 bg-white p-8 text-center shadow-xs">
            <Globe className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No Evidence Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No matching clinical literature found for &quot;{query}&quot;. Try broadening your keywords or removing domain filters.
            </p>
          </Card>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Found {results.length} verified evidence results</span>
              <span>All external sources sanitized</span>
            </div>

            {results.map((item, idx) => (
              <Card key={idx} className="border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[11px] font-medium ${getTierColor(item.trust_tier)}`}>
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          {item.trust_tier}
                        </Badge>
                        <span className="text-xs font-medium text-slate-600">{item.source_name}</span>
                        <span className="text-[11px] text-slate-400">
                          {item.retrieved_at ? new Date(item.retrieved_at).toLocaleDateString() : ""}
                        </span>
                      </div>

                      <h4 className="text-base font-semibold text-slate-900 leading-snug hover:text-blue-600 transition-colors">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
                          {item.title}
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                        </a>
                      </h4>

                      <p className="text-xs leading-relaxed text-slate-600 line-clamp-3">
                        {item.snippet}
                      </p>

                      {item.content_hash && (
                        <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-400">
                          <span>SHA-256: <code className="text-slate-600 font-mono">{item.content_hash.slice(0, 12)}...</code></span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveSource(item)}
                        className="h-8 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                        View Evidence
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Source Viewer Modal */}
      {activeSource && (
        <SourceViewerModal
          isOpen={!!activeSource}
          onClose={() => setActiveSource(null)}
          title={activeSource.title}
          url={activeSource.url}
          content={activeSource.markdown || activeSource.snippet}
          contentHash={activeSource.content_hash}
          trustTier={activeSource.trust_tier}
          retrievedAt={activeSource.retrieved_at}
        />
      )}
    </div>
  );
}
