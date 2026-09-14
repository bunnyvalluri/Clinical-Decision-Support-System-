"use client";

import * as React from "react";
import {
  FileText,
  Search,
  Filter,
  Download,
  Play,
  Pause,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LogMessage {
  id: string;
  timestamp: string;
  level: "INFO" | "WARNING" | "ERROR" | "DEBUG";
  service: "DJANGO_API" | "CELERY_WORKER" | "CHANNELS_ASGI" | "NEON_DB";
  message: string;
}

const INITIAL_LOGS: LogMessage[] = [
  {
    id: "log-1",
    timestamp: "2026-09-13 17:42:01.129",
    level: "INFO",
    service: "DJANGO_API",
    message: "GET /api/v1/doctor/summary/ 200 OK (latency: 34ms, user: dr.elena.vance@hospital.org)",
  },
  {
    id: "log-2",
    timestamp: "2026-09-13 17:41:55.802",
    level: "INFO",
    service: "CELERY_WORKER",
    message: "Task apps.predictions.tasks.generate_patient_risk_report[b91-49a] succeeded in 1.42s",
  },
  {
    id: "log-3",
    timestamp: "2026-09-13 17:41:40.012",
    level: "WARNING",
    service: "DJANGO_API",
    message: "High vital sign variance detected for patient MRN-90241: SBP 178 > 140 (Alert Triggered)",
  },
  {
    id: "log-4",
    timestamp: "2026-09-13 17:40:19.450",
    level: "INFO",
    service: "CHANNELS_ASGI",
    message: "WebSocket connection established for channel 'nurse_triage' (client 10.240.14.12:51294)",
  },
  {
    id: "log-5",
    timestamp: "2026-09-13 17:39:02.912",
    level: "DEBUG",
    service: "NEON_DB",
    message: "neon_pool: connection checkout duration: 2.1ms (active_pool_size: 4/20)",
  },
  {
    id: "log-6",
    timestamp: "2026-09-13 17:38:11.230",
    level: "ERROR",
    service: "DJANGO_API",
    message: "Inference timeout fallback triggered on secondary AdaBoost pipeline; falling back to champion RF v1.4",
  },
];

export default function AdminLogsPage() {
  const [filterLevel, setFilterLevel] = React.useState<string>("ALL");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [isPaused, setIsPaused] = React.useState<boolean>(false);

  const filteredLogs = INITIAL_LOGS.filter((l) => {
    const matchLevel = filterLevel === "ALL" || l.level === filterLevel;
    const matchSearch =
      l.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.timestamp.includes(searchTerm);
    return matchLevel && matchSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-slate-800" />
            Centralized System Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated stdout/stderr streams from Django REST API, Daphne ASGI, Celery workers, and Neon queries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="text-xs gap-1.5 border-slate-200"
          >
            {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-600" /> : <Pause className="h-3.5 w-3.5 text-amber-600" />}
            {isPaused ? "Resume Stream" : "Pause Stream"}
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-200">
            <Download className="h-3.5 w-3.5 text-slate-600" />
            Export Log Archive
          </Button>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-slate-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Console Log Stream</CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-slate-200 text-slate-600">
              {isPaused ? "STREAM PAUSED" : "LIVE TAIL"}
            </Badge>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full md:w-auto">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto max-w-full">
              {["ALL", "INFO", "WARNING", "ERROR", "DEBUG"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all shrink-0 ${
                    filterLevel === lvl
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="bg-slate-900 text-slate-100 p-3 sm:p-4 font-mono text-xs overflow-x-auto max-h-[600px] space-y-2 rounded-b-xl">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 leading-relaxed hover:bg-slate-800/60 p-2 sm:p-1 rounded transition-colors border-b border-slate-800/40 sm:border-0"
              >
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <span className="text-slate-500 text-[11px] select-none">{log.timestamp}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.level === "ERROR"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : log.level === "WARNING"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : log.level === "DEBUG"
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-sky-400 font-semibold text-[11px]">[{log.service}]</span>
                </div>
                <span className="text-slate-200 break-words text-[11px] sm:text-xs min-w-0 flex-1">{log.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
