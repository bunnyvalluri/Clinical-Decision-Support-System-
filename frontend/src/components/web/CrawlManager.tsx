"use client";

import * as React from "react";
import { Play, Square, RefreshCw, Globe, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { webIntelligenceService } from "@/services/webIntelligenceService";
import type { WebCrawlJob, WebJobStatus } from "@/types/webIntelligence";

export function CrawlManager() {
  const [jobs, setJobs] = React.useState<WebCrawlJob[]>([]);
  const [crawlUrl, setCrawlUrl] = React.useState("");
  const [maxPages, setMaxPages] = React.useState(25);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchJobs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await webIntelligenceService.getJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load crawl jobs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 8000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleStartCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlUrl.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      await webIntelligenceService.startCrawl(crawlUrl.trim(), maxPages);
      setMessage({ type: "success", text: "Asynchronous site crawl job queued successfully." });
      setCrawlUrl("");
      fetchJobs();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || "Failed to start crawl job.";
      setMessage({ type: "error", text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await webIntelligenceService.cancelJob(jobId);
      fetchJobs();
    } catch (err: any) {
      console.error("Failed to cancel job:", err);
    }
  };

  const getStatusBadge = (status: WebJobStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
          </Badge>
        );
      case "RUNNING":
        return (
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-xs animate-pulse">
            <RefreshCw className="mr-1 h-3 w-3 animate-spin" /> Running
          </Badge>
        );
      case "QUEUED":
        return (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs">
            <Clock className="mr-1 h-3 w-3" /> Queued
          </Badge>
        );
      case "PARTIAL":
        return (
          <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 text-xs">
            <AlertTriangle className="mr-1 h-3 w-3" /> Partial
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-600 text-xs">
            <Square className="mr-1 h-3 w-3" /> Cancelled
          </Badge>
        );
      case "FAILED":
      default:
        return (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 text-xs">
            <XCircle className="mr-1 h-3 w-3" /> Failed
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Crawl Launcher */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Asynchronous Site Crawl & Batch Ingestion
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Dispatches policy-bounded web crawler to index multiple pages from approved medical guidelines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStartCrawl} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-3">
                <label className="text-xs font-medium text-slate-700 mb-1 block">Target Website URL</label>
                <Input
                  placeholder="https://www.cdc.gov/sepsis/clinical-tools/"
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  className="bg-white border-slate-200 text-slate-900 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Max Pages (Hard Cap: 50)</label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value) || 25)}
                  className="bg-white border-slate-200 text-slate-900 text-sm"
                />
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !crawlUrl.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9"
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Launch Crawl Job
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Crawl Jobs List */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">Active & Historical Crawl Jobs</CardTitle>
            <CardDescription className="text-xs text-slate-500">Authoritative status recorded in Neon PostgreSQL.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchJobs} className="text-slate-500 hover:text-slate-900">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No crawl jobs recorded in database. Use the form above to initiate a crawl.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {jobs.map((job) => {
                const progressPct = job.total_pages > 0 ? Math.round((job.completed_pages / job.total_pages) * 100) : 0;
                return (
                  <div key={job.id} className="py-4 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(job.status)}
                          <span className="text-xs text-slate-400 font-mono">Job: {job.id.slice(0, 8)}...</span>
                          <span className="text-xs text-slate-400">
                            {new Date(job.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 line-clamp-1">{job.base_url}</p>
                      </div>

                      {(job.status === "RUNNING" || job.status === "QUEUED") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelJob(job.id)}
                          className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Square className="mr-1 h-3 w-3" /> Cancel
                        </Button>
                      )}
                    </div>

                    {/* Progress details */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>
                          Pages: {job.completed_pages} / {job.total_pages}
                        </span>
                        <span>{progressPct}%</span>
                      </div>
                      <Progress value={progressPct} className="h-1.5 bg-slate-100" />
                    </div>

                    {job.failure_count > 0 && (
                      <p className="text-[11px] text-amber-600">
                        {job.failure_count} page(s) failed or encountered policy blocks.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
