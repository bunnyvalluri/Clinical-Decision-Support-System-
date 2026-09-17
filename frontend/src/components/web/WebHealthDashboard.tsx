"use client";

import * as React from "react";
import { Activity, ShieldAlert, CheckCircle2, XCircle, RefreshCw, Server, Zap, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { webIntelligenceService } from "@/services/webIntelligenceService";
import type { AdminHealthData } from "@/types/webIntelligence";

export function WebHealthDashboard() {
  const [health, setHealth] = React.useState<AdminHealthData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchHealth = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await webIntelligenceService.getAdminHealth();
      setHealth(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || "Failed to load Firecrawl health metrics.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHealth();
    const timer = setInterval(fetchHealth, 10000);
    return () => clearInterval(timer);
  }, [fetchHealth]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            Firecrawl Infrastructure & Telemetry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry and circuit breaker state. Authoritative store: Neon PostgreSQL.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHealth} disabled={isLoading} className="text-xs bg-white border-slate-200 text-slate-700">
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {health && (
        <div className="space-y-6">
          {/* Top Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border border-slate-200 bg-white shadow-xs p-4 space-y-2">
              <span className="text-xs font-medium text-slate-500">Service Status</span>
              <div className="flex items-center gap-2">
                {health.enabled ? (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> ENABLED
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 text-xs">
                    <XCircle className="mr-1 h-3.5 w-3.5" /> DISABLED
                  </Badge>
                )}
                <span className="text-xs text-slate-600 font-mono">({health.mode})</span>
              </div>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-xs p-4 space-y-2">
              <span className="text-xs font-medium text-slate-500">Circuit Breaker</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    health.circuit_breaker === "CLOSED"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : health.circuit_breaker === "HALF_OPEN"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  <Zap className="mr-1 h-3.5 w-3.5" /> {health.circuit_breaker}
                </Badge>
              </div>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-xs p-4 space-y-2">
              <span className="text-xs font-medium text-slate-500">Average Latency</span>
              <div className="text-xl font-bold text-slate-900">
                {health.telemetry.average_latency_ms} <span className="text-xs font-normal text-slate-500">ms</span>
              </div>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-xs p-4 space-y-2">
              <span className="text-xs font-medium text-slate-500">Authoritative Docs Cached</span>
              <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                {health.total_documents_cached}
              </div>
            </Card>
          </div>

          {/* Job Queue Breakdown */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">PostgreSQL Crawl Job Queue</CardTitle>
              <CardDescription className="text-xs text-slate-500">State breakdown across all tenant crawl tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500">Queued</div>
                  <div className="text-lg font-bold text-amber-700">{health.total_jobs_queued}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500">Running</div>
                  <div className="text-lg font-bold text-blue-700">{health.total_jobs_running}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500">Completed</div>
                  <div className="text-lg font-bold text-emerald-700">{health.total_jobs_completed}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500">Failed</div>
                  <div className="text-lg font-bold text-red-700">{health.total_jobs_failed}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Threat Telemetry */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Security & Defense Telemetry
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                SSRF rejections, domain policy blocks, and rate limit throttles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-red-100 bg-red-50/50">
                  <div className="text-xs font-semibold text-red-800">SSRF Blocks</div>
                  <div className="text-2xl font-bold text-red-700 mt-1">{health.telemetry.ssrf_blocks}</div>
                  <p className="text-[11px] text-red-600 mt-1">RFC1918 / Loopback attacks blocked</p>
                </div>

                <div className="p-4 rounded-lg border border-amber-100 bg-amber-50/50">
                  <div className="text-xs font-semibold text-amber-800">Domain Blocks</div>
                  <div className="text-2xl font-bold text-amber-700 mt-1">{health.telemetry.domain_blocks}</div>
                  <p className="text-[11px] text-amber-600 mt-1">Untrusted / unapproved domains blocked</p>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="text-xs font-semibold text-slate-800">Rate Limit Events</div>
                  <div className="text-2xl font-bold text-slate-700 mt-1">{health.telemetry.rate_limit_blocks}</div>
                  <p className="text-[11px] text-slate-600 mt-1">Role & concurrency throttles applied</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
