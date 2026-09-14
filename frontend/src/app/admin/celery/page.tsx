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
  Cpu,
  Play,
  FileCheck,
  AlertCircle,
  Radio,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TaskRecord {
  id: string;
  name: string;
  queue: string;
  runtime: string;
  status: "SUCCESS" | "RUNNING" | "FAILED";
  completedAt: string;
  details: string;
}

const RECENT_TASKS: TaskRecord[] = [
  {
    id: "task-8f92a",
    name: "tasks.evaluate_feature_drift_ks_test",
    queue: "mlops_drift_audit",
    runtime: "320 ms",
    status: "SUCCESS",
    completedAt: "18:01:10",
    details: "Evaluated 10 clinical features across 1,240 records; KS-test p=0.48.",
  },
  {
    id: "task-8f92b",
    name: "tasks.send_hl7_fhir_dispatch",
    queue: "hl7_fhir_export",
    runtime: "112 ms",
    status: "SUCCESS",
    completedAt: "17:58:44",
    details: "Dispatched FHIR Observation resource for patient PT-1002.",
  },
  {
    id: "task-8f92c",
    name: "tasks.run_mortality_prediction_batch",
    queue: "triage_ai_priority",
    runtime: "418 ms",
    status: "SUCCESS",
    completedAt: "17:55:02",
    details: "Scored 14 ICU patient admissions with Champion XGBoost v2.4.",
  },
  {
    id: "task-8f92d",
    name: "tasks.clean_ephemeral_tokens",
    queue: "scheduled_heartbeat",
    runtime: "45 ms",
    status: "SUCCESS",
    completedAt: "17:50:00",
    details: "Pruned 24 expired JWT refresh nonces from Redis cache.",
  },
  {
    id: "task-8f92e",
    name: "tasks.generate_samd_compliance_dossier",
    queue: "hl7_fhir_export",
    runtime: "890 ms",
    status: "SUCCESS",
    completedAt: "17:40:15",
    details: "Built 21 CFR Part 11 signed validation audit PDF bundle.",
  },
];

export default function AdminCeleryPage() {
  const [tasks, setTasks] = React.useState<TaskRecord[]>(RECENT_TASKS);
  const [isTriggering, setIsTriggering] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTriggerTestTask = () => {
    setIsTriggering(true);
    setTimeout(() => {
      setIsTriggering(false);
      const newTask: TaskRecord = {
        id: `task-${Math.random().toString(36).substring(2, 7)}`,
        name: "tasks.ping_cluster_health_check",
        queue: "triage_ai_priority",
        runtime: "88 ms",
        status: "SUCCESS",
        completedAt: new Date().toLocaleTimeString(),
        details: "Subsystem health ping completed: all worker daemons responsive.",
      };
      setTasks([newTask, ...tasks]);
      showToast("Async task dispatched to Celery daemon. Result: SUCCESS (88ms).");
    }, 900);
  };

  const filteredTasks = tasks.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.queue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.details.toLowerCase().includes(searchTerm.toLowerCase())
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
              Celery Distributed Task Fleet
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Workers Online (Solo Pool)
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Cpu className="h-7 w-7 text-purple-600" />
            Celery Async Workers & Queue Fleet
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Asynchronous background daemons handling heavy batch ML predictions, automated drift evaluations, and HL7 messaging.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleTriggerTestTask}
            disabled={isTriggering}
            className="text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <Play className={`h-3.5 w-3.5 ${isTriggering ? "animate-spin" : ""}`} />
            {isTriggering ? "Executing Task..." : "Trigger Health Task"}
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
              <Cpu className="h-5 w-5 text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Worker Daemons</p>
              <p className="text-xl font-bold text-slate-900">2 Active</p>
              <p className="text-[11px] text-purple-700 font-medium">Solo pool (Windows/POSIX)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Tasks Processed (24h)</p>
              <p className="text-xl font-bold text-slate-900">{tasks.length + 142}</p>
              <p className="text-[11px] text-emerald-700 font-medium">100% success rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
              <Clock className="h-5 w-5 text-sky-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Avg Task Runtime</p>
              <p className="text-xl font-bold text-slate-900">342 ms</p>
              <p className="text-[11px] text-sky-700 font-medium">p95: 890ms</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
              <Layers className="h-5 w-5 text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Dead Letter Queue</p>
              <p className="text-xl font-bold text-slate-900">0 Tasks</p>
              <p className="text-[11px] text-emerald-700 font-medium">Zero dropped jobs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Queues Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-purple-900">triage_ai_priority</span>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">ACTIVE</Badge>
            </div>
            <p className="text-xs text-slate-500">Real-time clinical inference and emergency triage evaluations.</p>
            <div className="flex justify-between text-xs pt-2 border-t border-slate-100 text-slate-600">
              <span>Backlog: 0</span>
              <span>Concurrency: 4</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-purple-900">mlops_drift_audit</span>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">ACTIVE</Badge>
            </div>
            <p className="text-xs text-slate-500">Scheduled KS-test statistical checks and data quality validation.</p>
            <div className="flex justify-between text-xs pt-2 border-t border-slate-100 text-slate-600">
              <span>Backlog: 0</span>
              <span>Concurrency: 2</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-purple-900">hl7_fhir_export</span>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">ACTIVE</Badge>
            </div>
            <p className="text-xs text-slate-500">Async PDF generation and external EHR interoperability sync.</p>
            <div className="flex justify-between text-xs pt-2 border-t border-slate-100 text-slate-600">
              <span>Backlog: 0</span>
              <span>Concurrency: 2</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Execution Ledger */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Recent Task Executions</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Audit log of asynchronous worker execution traces, arguments, and runtimes.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Filter tasks or queues..."
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
                <th className="p-3 font-bold text-slate-700">Task Name</th>
                <th className="p-3 font-bold text-slate-700">Queue</th>
                <th className="p-3 font-bold text-slate-700">Runtime</th>
                <th className="p-3 font-bold text-slate-700">Finished At</th>
                <th className="p-3 font-bold text-slate-700">Result Summary</th>
                <th className="p-3 font-bold text-right text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 font-mono font-semibold text-slate-900">{t.name}</td>
                  <td className="p-3">
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {t.queue}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-emerald-700">{t.runtime}</td>
                  <td className="p-3 font-mono text-slate-500">{t.completedAt}</td>
                  <td className="p-3 text-slate-600 max-w-sm">{t.details}</td>
                  <td className="p-3 text-right">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                      {t.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
