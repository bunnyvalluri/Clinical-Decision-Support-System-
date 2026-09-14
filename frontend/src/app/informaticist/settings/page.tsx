"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Cpu,
  Database,
  Lock,
  RefreshCw,
  Save,
  ShieldCheck,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function InformaticistSettingsPage() {
  const [driftWarningThreshold, setDriftWarningThreshold] = React.useState(0.10);
  const [driftCriticalThreshold, setDriftCriticalThreshold] = React.useState(0.25);
  const [latencyThresholdMs, setLatencyThresholdMs] = React.useState(5.0);
  const [webhookUrl, setWebhookUrl] = React.useState("https://hooks.slack.com/services/T00/B00/mlops-alerts");

  // Toggles
  const [driftAlerts, setDriftAlerts] = React.useState(true);
  const [performanceDigest, setPerformanceDigest] = React.useState(true);
  const [dataQualityAlerts, setDataQualityAlerts] = React.useState(true);
  const [autoRetrain, setAutoRetrain] = React.useState(false);
  const [enforceCryptoSign, setEnforceCryptoSign] = React.useState(true);
  const [autoDossierExport, setAutoDossierExport] = React.useState(true);

  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Informatics &amp; MLOps Settings</h1>
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs">
              System Configuration
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure population drift thresholds, streaming inference SLAs, webhook incident channels, and SaMD compliance policies.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          Save Preferences
        </Button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            MLOps configuration and threshold policies successfully saved.
          </span>
          <span className="text-[10px] text-emerald-600 font-mono">Synced across cluster</span>
        </div>
      )}

      {/* Grid: Drift Thresholds & Stream SLAs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Drift & Retraining Policies */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-600" />
              Population Drift &amp; Retraining Policies
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Statistical boundaries for automated divergence alerts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-slate-700">PSI Warning Threshold</label>
                <span className="font-mono font-bold text-amber-700">{driftWarningThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.20"
                step="0.01"
                value={driftWarningThreshold}
                onChange={e => setDriftWarningThreshold(parseFloat(e.target.value))}
                className="w-full accent-amber-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">Dispatches notification when population drift reaches this index.</p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-slate-700">Critical Retraining Trigger (PSI)</label>
                <span className="font-mono font-bold text-rose-700">{driftCriticalThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.15"
                max="0.40"
                step="0.01"
                value={driftCriticalThreshold}
                onChange={e => setDriftCriticalThreshold(parseFloat(e.target.value))}
                className="w-full accent-rose-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">Initiates automated shadow retraining DAG if exceeded.</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Auto-Launch Shadow Retraining</p>
                <p className="text-[11px] text-slate-500">Automatically train candidate weights when PSI triggers</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoRetrain(!autoRetrain)}
                className={`h-6 w-11 rounded-full transition-colors relative ${autoRetrain ? "bg-amber-600" : "bg-slate-200"}`}
              >
                <span className={`h-5 w-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${autoRetrain ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Inference Telemetry SLAs */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              Inference Telemetry &amp; Latency SLA
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Real-time scoring speed limits and websocket connection policies.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-slate-700">Latency Anomaly Threshold</label>
                <span className="font-mono font-bold text-purple-700">{latencyThresholdMs.toFixed(1)} ms</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="20.0"
                step="0.5"
                value={latencyThresholdMs}
                onChange={e => setLatencyThresholdMs(parseFloat(e.target.value))}
                className="w-full accent-purple-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">Alerts on scoring operations exceeding this duration.</p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="font-semibold text-slate-700 block mb-1">PagerDuty / Slack Webhook URL</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 font-mono text-[11px] focus:border-purple-400 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Target for real-time critical MLOps incident broadcasts.</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">WebSocket Heartbeat Ping (5s)</p>
                <p className="text-[11px] text-slate-500">Maintain persistent EHR live telemetry stream</p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Preferences & SaMD Compliance Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Preferences */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-sky-600" />
              Alert Subscriptions
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Select which clinical notifications to receive in the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Population Drift Notifications</p>
                <p className="text-[11px] text-slate-500">Notify when feature PSI or KS divergence crosses threshold</p>
              </div>
              <button
                type="button"
                onClick={() => setDriftAlerts(!driftAlerts)}
                className={`h-6 w-11 rounded-full transition-colors relative ${driftAlerts ? "bg-purple-600" : "bg-slate-200"}`}
              >
                <span className={`h-5 w-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${driftAlerts ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Daily Model Performance Digest</p>
                <p className="text-[11px] text-slate-500">Receive morning summary of ROC-AUC, Brier score and volume</p>
              </div>
              <button
                type="button"
                onClick={() => setPerformanceDigest(!performanceDigest)}
                className={`h-6 w-11 rounded-full transition-colors relative ${performanceDigest ? "bg-purple-600" : "bg-slate-200"}`}
              >
                <span className={`h-5 w-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${performanceDigest ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-semibold text-slate-800">Data Quality Pipeline Alerts</p>
                <p className="text-[11px] text-slate-500">Immediate notice on physiological clamps or ingestion gaps</p>
              </div>
              <button
                type="button"
                onClick={() => setDataQualityAlerts(!dataQualityAlerts)}
                className={`h-6 w-11 rounded-full transition-colors relative ${dataQualityAlerts ? "bg-purple-600" : "bg-slate-200"}`}
              >
                <span className={`h-5 w-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${dataQualityAlerts ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* SaMD Regulatory & Audit Controls */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              21 CFR Part 11 Regulatory Controls
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enforce cryptographic signing and audit ledger requirements.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Require Hardware Crypto Sign-Off</p>
                <p className="text-[11px] text-slate-500">Enforce Ed25519 signature before promoting models to champion</p>
              </div>
              <button
                type="button"
                onClick={() => setEnforceCryptoSign(!enforceCryptoSign)}
                className={`h-6 w-11 rounded-full transition-colors relative ${enforceCryptoSign ? "bg-emerald-600" : "bg-slate-200"}`}
              >
                <span className={`h-5 w-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${enforceCryptoSign ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-semibold text-slate-800">Automated Weekly SaMD Export</p>
                <p className="text-[11px] text-slate-500">Automatically compile and archive weekly audit dossier PDF</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoDossierExport(!autoDossierExport)}
                className={`h-6 w-11 rounded-full transition-colors relative ${autoDossierExport ? "bg-emerald-600" : "bg-slate-200"}`}
              >
                <span className={`h-5 w-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${autoDossierExport ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
