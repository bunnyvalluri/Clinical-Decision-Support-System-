"use client";

import * as React from "react";
import {
  CheckCircle2,
  RefreshCw,
  Zap,
  HardDrive,
  Clock,
  Layers,
  Search,
  Activity,
  Trash2,
  Lock,
  Cpu,
  Radio,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface KeyNamespace {
  prefix: string;
  count: number;
  avgTtl: string;
  purpose: string;
  sizeKb: number;
}

const KEY_NAMESPACES: KeyNamespace[] = [
  {
    prefix: "patient:cache:*",
    count: 84,
    avgTtl: "300 sec (5 min)",
    purpose: "Hydrated EHR vitals and demographic profiles for low-latency doctor views",
    sizeKb: 840,
  },
  {
    prefix: "rate_limit:*",
    count: 28,
    avgTtl: "60 sec (1 min)",
    purpose: "Token bucket request counters tracking requests per IP per minute",
    sizeKb: 14,
  },
  {
    prefix: "session:*",
    count: 12,
    avgTtl: "900 sec (15 min)",
    purpose: "Authenticated user JWT claims, role boundary tokens, and CSRF nonces",
    sizeKb: 48,
  },
  {
    prefix: "channels:groups:*",
    count: 6,
    avgTtl: "Persistent",
    purpose: "WebSocket subscription routing for emergency alerts and bedside feeds",
    sizeKb: 12,
  },
  {
    prefix: "celery:queue:*",
    count: 3,
    avgTtl: "Instant dequeue",
    purpose: "Message broker priority queues for async inference and drift monitors",
    sizeKb: 8,
  },
];

const RECENT_COMMANDS = [
  { time: "18:01:22.104", cmd: "GET", key: "session:dr_elena_vance", client: "django_api_1", latency: "1.2ms" },
  { time: "18:01:21.840", cmd: "SETEX", key: "rate_limit:10.240.12.84", client: "django_api_1", latency: "1.8ms" },
  { time: "18:01:19.420", cmd: "PUBLISH", key: "channels:alerts_emergency", client: "channels_asgi", latency: "0.9ms" },
  { time: "18:01:18.112", cmd: "BRPOP", key: "celery:triage_priority", client: "celery_worker_1", latency: "2.1ms" },
  { time: "18:01:14.650", cmd: "GET", key: "patient:cache:PT-9042", client: "django_api_2", latency: "1.4ms" },
];

export default function AdminRedisPage() {
  const [isFlushing, setIsFlushing] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePing = () => {
    showToast("PONG received from Upstash Redis cluster: 4.8ms roundtrip. Status: OPTIMAL.");
  };

  const handleFlushCache = () => {
    setIsFlushing(true);
    setTimeout(() => {
      setIsFlushing(false);
      showToast("Flushed 84 ephemeral patient cache keys. Essential auth sessions preserved.");
    }, 1000);
  };

  const filteredNamespaces = KEY_NAMESPACES.filter(
    (k) =>
      k.prefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-semibold">
              Upstash Serverless Redis
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Cache Layer Operational
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Zap className="h-7 w-7 text-purple-600" />
            Redis Cache & Message Broker Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            In-memory data store providing sub-5ms caching, rate limiting, and pub/sub message brokering for Celery and WebSockets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePing}
            className="text-xs font-semibold gap-1.5 border-slate-200"
          >
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            Ping Redis Server
          </Button>
          <Button
            onClick={handleFlushCache}
            disabled={isFlushing}
            className="text-xs font-semibold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            <Trash2 className={`h-3.5 w-3.5 ${isFlushing ? "animate-spin" : ""}`} />
            {isFlushing ? "Flushing Cache..." : "Flush Ephemeral Keys"}
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <Activity className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Cache Hit Ratio</p>
              <p className="text-xl font-bold text-slate-900">94.8%</p>
              <p className="text-[11px] text-emerald-700 font-medium">0 evictions in 24h</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
              <Clock className="h-5 w-5 text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Average Latency</p>
              <p className="text-xl font-bold text-slate-900">4.8 ms</p>
              <p className="text-[11px] text-purple-700 font-medium">TLS 1.3 encrypted</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
              <HardDrive className="h-5 w-5 text-sky-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Memory Footprint</p>
              <p className="text-xl font-bold text-slate-900">18.4 MB</p>
              <p className="text-[11px] text-sky-700 font-medium">256 MB max (7.2%)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
              <Layers className="h-5 w-5 text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Connected Clients</p>
              <p className="text-xl font-bold text-slate-900">4 Nodes</p>
              <p className="text-[11px] text-amber-700 font-medium">ASGI, Celery, API, Proxy</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Namespace Distribution */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Active Key Namespaces & TTL Policies</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Categorized memory usage across caching, rate limiting, and real-time pub/sub topics.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search namespaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="p-3 font-bold text-slate-700">Key Pattern</th>
                <th className="p-3 font-bold text-slate-700">Keys Count</th>
                <th className="p-3 font-bold text-slate-700">Memory</th>
                <th className="p-3 font-bold text-slate-700">TTL Policy</th>
                <th className="p-3 font-bold text-slate-700">Operational Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNamespaces.map((ns) => (
                <tr key={ns.prefix} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 font-mono font-bold text-purple-900">{ns.prefix}</td>
                  <td className="p-3 font-semibold text-slate-800">{ns.count}</td>
                  <td className="p-3 font-medium text-slate-700">~{ns.sizeKb} KB</td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[10px] font-mono bg-slate-50 text-slate-700">
                      {ns.avgTtl}
                    </Badge>
                  </td>
                  <td className="p-3 text-slate-600 max-w-md">{ns.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Live Command Trace */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Live Command Stream</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Recent operations processed across the cluster with microsecond latency metrics.
              </CardDescription>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
              STREAMING
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
                <th className="p-2.5">Time</th>
                <th className="p-2.5">Command</th>
                <th className="p-2.5">Key Target</th>
                <th className="p-2.5">Client ID</th>
                <th className="p-2.5 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {RECENT_COMMANDS.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="p-2.5 text-slate-500">{c.time}</td>
                  <td className="p-2.5 font-bold text-purple-700">{c.cmd}</td>
                  <td className="p-2.5 text-slate-900">{c.key}</td>
                  <td className="p-2.5 text-slate-600">{c.client}</td>
                  <td className="p-2.5 text-right font-semibold text-emerald-700">{c.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
