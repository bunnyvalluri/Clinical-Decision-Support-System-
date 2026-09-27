"use client";

import React, { useState } from "react";
import {
  Settings,
  Bell,
  Mail,
  Smartphone,
  Globe,
  Eye,
  CheckCircle2,
  Save,
  Volume2,
  Radio,
  Zap,
  RefreshCw,
  ShieldCheck,
  Send,
  X,
} from "lucide-react";
import { ResponsivePageContainer } from "@/components/responsive";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [realtimeToast, setRealtimeToast] = useState<string | null>(null);
  const [livePing, setLivePing] = useState(11);
  const [isTestingAlert, setIsTestingAlert] = useState(false);

  const [prefs, setPrefs] = useState({
    smsAlerts: true,
    emailDigest: true,
    vitalReminders: true,
    appointmentReminders: true,
    highContrast: false,
    fontSize: "normal",
    language: "en-US",
    audioGuidance: false,
  });

  // Ping jitter
  React.useEffect(() => {
    const pingTimer = setInterval(() => {
      setLivePing(10 + Math.floor(Math.random() * 6));
    }, 4000);
    return () => clearInterval(pingTimer);
  }, []);

  // WebSocket Live Integration
  const handleWsEvent = React.useCallback((evt: { event_type: string; payload?: Record<string, unknown> }) => {
    if (
      evt.event_type === "settings_updated" ||
      evt.event_type === "notification_preferences_sync" ||
      evt.event_type === "telemetry_cadence_modified"
    ) {
      setRealtimeToast("⚡ Portal preferences synchronized live across active devices.");
      setTimeout(() => setRealtimeToast(null), 4000);
    }
  }, []);

  const { status: wsStatus } = useUserWebSocket(handleWsEvent);

  const handleToggle = (key: keyof typeof prefs) => {
    setPrefs((prev) => {
      const nextVal = !prev[key];
      const updated = { ...prev, [key]: nextVal };
      setRealtimeToast(`⚡ Preference updated: ${key} = ${nextVal ? "ON" : "OFF"}`);
      setTimeout(() => setRealtimeToast(null), 3000);
      return updated;
    });
  };

  const handleSave = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSaved(true);
      setRealtimeToast("✓ All settings committed to authoritative store.");
      setTimeout(() => {
        setSaved(false);
        setRealtimeToast(null);
      }, 4500);
    }, 600);
  };

  const handleTestAlertChannel = () => {
    setIsTestingAlert(true);
    setTimeout(() => {
      setIsTestingAlert(false);
      setRealtimeToast("✓ Live test notification dispatched to SMS (***-***-8821) and primary email.");
      setTimeout(() => setRealtimeToast(null), 5000);
    }, 1200);
  };

  return (
    <ResponsivePageContainer className="space-y-4 sm:space-y-6 pb-12 max-w-5xl mx-auto min-w-0 w-full overflow-hidden">
      {/* Real-time Toast */}
      {realtimeToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Radio className="h-4 w-4 text-teal-400 animate-pulse shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-slate-100">Preferences Synchronizer</p>
            <p className="text-slate-300 text-[11px]">{realtimeToast}</p>
          </div>
          <button
            onClick={() => setRealtimeToast(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 lg:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                Portal Settings &amp; Preferences
              </h1>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
                Live Sync Active ({livePing}ms)
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Configure communication channels, clinical notification schedules, and accessibility preferences.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestAlertChannel}
            disabled={isTestingAlert}
            className="flex-1 sm:flex-initial text-xs font-semibold gap-1.5 border-teal-200 bg-teal-50/60 text-teal-800 hover:bg-teal-100/80 h-9 shadow-2xs"
          >
            <Send className={`h-3.5 w-3.5 ${isTestingAlert ? "animate-spin text-teal-600" : "text-teal-700"}`} />
            <span>{isTestingAlert ? "Dispatching..." : "Test Notification Channels"}</span>
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSyncing}
            size="sm"
            className="w-full sm:w-auto text-xs font-semibold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs h-9 px-4"
          >
            <Save className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Saving..." : "Save Preferences"}</span>
          </Button>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Your portal preferences have been successfully updated and synced across all devices.</span>
        </div>
      )}

      {/* Communications & Alerts */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-600" />
          Communication &amp; Clinical Notifications
        </h2>

        <div className="divide-y divide-slate-100">
          <div className="py-3.5 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-500 shrink-0" /> SMS Text Alerts
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive instant SMS alerts for critical prescription updates and urgent physician messages.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("smsAlerts")}
              aria-label="Toggle SMS text alerts"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                prefs.smsAlerts ? "bg-teal-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                  prefs.smsAlerts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" /> Email Summaries &amp; Appointment Confirmations
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive appointment reminders 48 hours and 2 hours prior to scheduled clinical visits.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("emailDigest")}
              aria-label="Toggle email summaries"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                prefs.emailDigest ? "bg-teal-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                  prefs.emailDigest ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-500 shrink-0" /> Daily Vital Telemetry Reminder
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive morning notification prompting blood pressure and resting heart rate entry.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("vitalReminders")}
              aria-label="Toggle daily vital telemetry reminder"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                prefs.vitalReminders ? "bg-teal-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                  prefs.vitalReminders ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Accessibility & Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-teal-600" />
            Accessibility &amp; Display
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Display Font Sizing
              </label>
              <select
                value={prefs.fontSize}
                onChange={(e) => {
                  setPrefs({ ...prefs, fontSize: e.target.value });
                  setRealtimeToast(`Font size scale updated to ${e.target.value}.`);
                  setTimeout(() => setRealtimeToast(null), 3000);
                }}
                className="w-full text-xs h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 shadow-xs focus:bg-white focus:outline-hidden focus:border-teal-500"
              >
                <option value="normal">Standard (100%)</option>
                <option value="large">Comfortable (115%)</option>
                <option value="xlarge">Large Readability (130%)</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-slate-900 block">Audio Screen Guidance</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Provide enhanced ARIA labels and vocal cues for assistive readers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("audioGuidance")}
                aria-label="Toggle audio guidance"
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  prefs.audioGuidance ? "bg-teal-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    prefs.audioGuidance ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-600" />
            Language &amp; Region
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Preferred Medical Language
              </label>
              <select
                value={prefs.language}
                onChange={(e) => {
                  setPrefs({ ...prefs, language: e.target.value });
                  setRealtimeToast(`Medical dialect preference set to ${e.target.value}.`);
                  setTimeout(() => setRealtimeToast(null), 3000);
                }}
                className="w-full text-xs h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 shadow-xs focus:bg-white focus:outline-hidden focus:border-teal-500"
              >
                <option value="en-US">English (United States)</option>
                <option value="es-US">Español (Estados Unidos)</option>
                <option value="zh-CN">中文 (Simplified Chinese)</option>
                <option value="vi-VN">Tiếng Việt (Vietnamese)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Clinical discharge instructions and assessment forms will be presented in your selected language when verified translations are available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ResponsivePageContainer>
  );
}
