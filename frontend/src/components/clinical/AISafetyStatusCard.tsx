"use client";

import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Power,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import apiClient from "@/services/apiClient";

export function AISafetyStatusCard() {
  const [statusData, setStatusData] = React.useState<{
    kill_switch_active: boolean;
    status: string;
    recent_events_count: number;
    recent_events: any[];
  } | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStatus = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/api/ai/safety/");
      setStatusData(res.data);
    } catch (err: any) {
      console.error("Failed to load AI safety status:", err);
      setError("AI Safety telemetry unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isSuspended = statusData?.kill_switch_active || statusData?.status === "SUSPENDED";

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-sm font-bold text-slate-900">AI Safety Gate Telemetry</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={`text-xs font-semibold ${
              isSuspended
                ? "border-rose-300 bg-rose-50 text-rose-800"
                : "border-emerald-300 bg-emerald-50 text-emerald-800"
            }`}
          >
            {isSuspended ? (
              <>
                <ShieldAlert className="mr-1 h-3.5 w-3.5 text-rose-600" />
                GATE SUSPENDED
              </>
            ) : (
              <>
                <ShieldCheck className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                10-STAGE GATE OPERATIONAL
              </>
            )}
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-500 mt-0.5">
          Real-time enforcement of healthcare invariants, prompt injection defense, and uncertainty gates.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 space-y-3 text-xs">
        {loading ? (
          <div className="flex items-center justify-center p-4 text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span>Checking safety gate status...</span>
          </div>
        ) : error ? (
          <div className="rounded border border-amber-200 bg-amber-50 p-2.5 text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div className="rounded border border-slate-100 bg-slate-50 p-2.5">
                <span className="text-slate-400 block text-[11px]">Emergency Kill Switch:</span>
                <span
                  className={`font-semibold ${
                    statusData?.kill_switch_active ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {statusData?.kill_switch_active ? "ACTIVE (HALTED)" : "STANDBY (NORMAL)"}
                </span>
              </div>
              <div className="rounded border border-slate-100 bg-slate-50 p-2.5">
                <span className="text-slate-400 block text-[11px]">Audited Safety Events:</span>
                <span className="font-semibold text-slate-800">
                  {statusData?.recent_events_count ?? 0} Recorded
                </span>
              </div>
            </div>

            {/* Recent Safety Interventions */}
            {statusData?.recent_events && statusData.recent_events.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="font-semibold text-slate-700 block text-[11px]">Recent Safety Interventions:</span>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {statusData.recent_events.map((evt: any) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between rounded border border-slate-100 bg-slate-50/80 px-2.5 py-1.5 text-[11px]"
                    >
                      <span className="font-medium text-slate-700">{evt.event_type}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] py-0">
                          {evt.action_taken}
                        </Badge>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {evt.timestamp?.slice(11, 16)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
