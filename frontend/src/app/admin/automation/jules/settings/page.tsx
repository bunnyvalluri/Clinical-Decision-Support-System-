"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  GitBranch,
} from "lucide-react";
import { julesApi } from "@/services/jules";
import { JulesSettings, JulesHealthResponse } from "@/types/jules";
import { JulesErrorState } from "@/features/automation/jules/components";

export default function JulesSettingsPage() {
  const [settings, setSettings] = useState<JulesSettings | null>(null);
  const [health, setHealth] = useState<JulesHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, h] = await Promise.all([
        julesApi.getSettings(),
        julesApi.getHealth().catch(() => null),
      ]);
      setSettings(s);
      setHealth(h);
    } catch (err: any) {
      setError(err.message || "Failed to load Jules configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const h = await julesApi.getHealth();
      setHealth(h);
    } catch (err: any) {
      setError(err.message || "Connection test failed");
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/automation/jules"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-950">
              Jules Automation Settings & Governance
            </h1>
            <p className="text-xs text-slate-500">
              Operational parameters, safety policies, and credential security
            </p>
          </div>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={testingConnection || loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${testingConnection ? "animate-spin" : ""}`} />
          <span>{testingConnection ? "Testing..." : "Test Connection"}</span>
        </button>
      </div>

      {error && <JulesErrorState message={error} onRetry={loadSettings} />}

      {/* Secret Security Notice */}
      <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-start gap-3 text-xs text-teal-900">
        <Lock className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Backend-Only Credential Isolation</p>
          <p className="text-[11px] leading-relaxed text-teal-800">
            For healthcare defense-in-depth, <code>JULES_API_KEY</code> is strictly stored in backend environment variables and Coolify encrypted secrets. It is never exposed in client bundles, browser localStorage, or database fields.
          </p>
        </div>
      </div>

      {/* Configuration Cards */}
      {settings && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-950 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Settings className="h-4 w-4 text-teal-600" />
            <span>Active Operational Policy Parameters</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block mb-0.5">SERVICE STATE</span>
              <span className="font-bold text-slate-900">
                {settings.enabled ? "ENABLED (True)" : "DISABLED (False)"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block mb-0.5">CREDENTIAL STATUS</span>
              <span className="font-bold text-emerald-700">
                {settings.is_configured ? "CONFIGURED (Key Present)" : "UNCONFIGURED"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block mb-0.5">API BASE URL</span>
              <span className="font-bold text-slate-800">{settings.base_url}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block mb-0.5">PLAN APPROVAL GATE</span>
              <span className="font-bold text-amber-800">
                {settings.require_plan_approval ? "ENFORCED (Dual-Custody)" : "DISABLED"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block mb-0.5">TIMEOUT SECONDS</span>
              <span className="font-bold text-slate-800">{settings.timeout_seconds}s (Read) &bull; {settings.connect_timeout_seconds}s (Connect)</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block mb-0.5">CONCURRENT SESSIONS</span>
              <span className="font-bold text-slate-800">Max {settings.max_concurrent_sessions}</span>
            </div>
          </div>

          {/* Allowed Repositories */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 mb-2">
              Repository Allowlist:
            </h4>
            <div className="flex flex-wrap gap-2">
              {settings.allowed_repositories.map((repo, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs text-slate-700 font-semibold"
                >
                  {repo}
                </span>
              ))}
            </div>
          </div>

          {/* Allowed Branches */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 mb-2">
              Permitted Branches:
            </h4>
            <div className="flex flex-wrap gap-2">
              {settings.allowed_branches.map((b, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs text-slate-700 font-semibold flex items-center gap-1"
                >
                  <GitBranch className="h-3 w-3 text-slate-400" />
                  <span>{b}</span>
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Direct modifications to <code>main</code>, <code>production</code>, and <code>release/*</code> are permanently blocked by policy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
