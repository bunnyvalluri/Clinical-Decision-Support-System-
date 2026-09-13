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
  Volume2
} from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
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

  const handleToggle = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Settings & Preferences</h1>
            <p className="text-sm text-slate-600 mt-1">
              Configure communication channels, clinical notification schedules, and accessibility preferences.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-sm inline-flex items-center gap-2 shrink-0"
        >
          <Save className="w-4 h-4" /> Save Preferences
        </button>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-sm text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Your portal preferences have been successfully updated and synced.</span>
        </div>
      )}

      {/* Communications & Alerts */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-600" />
          Communication & Clinical Notifications
        </h2>

        <div className="divide-y divide-slate-100">
          <div className="py-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-500" /> SMS Text Alerts
              </span>
              <p className="text-xs text-slate-500">Receive instant SMS alerts for critical prescription updates and urgent physician messages.</p>
            </div>
            <button
              onClick={() => handleToggle("smsAlerts")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                prefs.smsAlerts ? "bg-teal-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  prefs.smsAlerts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" /> Email Summaries & Appointment Confirmations
              </span>
              <p className="text-xs text-slate-500">Receive appointment reminders 48 hours and 2 hours prior to scheduled clinical visits.</p>
            </div>
            <button
              onClick={() => handleToggle("emailDigest")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                prefs.emailDigest ? "bg-teal-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  prefs.emailDigest ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-500" /> Daily Vital Telemetry Reminder
              </span>
              <p className="text-xs text-slate-500">Receive morning notification prompting blood pressure and resting heart rate entry.</p>
            </div>
            <button
              onClick={() => handleToggle("vitalReminders")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                prefs.vitalReminders ? "bg-teal-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  prefs.vitalReminders ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Accessibility & Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-teal-600" />
            Accessibility & Display (Light Theme Only)
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Display Font Sizing
              </label>
              <select
                value={prefs.fontSize}
                onChange={(e) => setPrefs({ ...prefs, fontSize: e.target.value })}
                className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              >
                <option value="normal">Standard (100%)</option>
                <option value="large">Comfortable (115%)</option>
                <option value="xlarge">Large Readability (130%)</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900">Audio Screen Guidance</span>
                <p className="text-xs text-slate-500">Provide enhanced ARIA labels and vocal cues for assistive readers.</p>
              </div>
              <button
                onClick={() => handleToggle("audioGuidance")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  prefs.audioGuidance ? "bg-teal-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    prefs.audioGuidance ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-600" />
            Language & Region
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Preferred Medical Language
              </label>
              <select
                value={prefs.language}
                onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
                className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              >
                <option value="en-US">English (United States)</option>
                <option value="es-US">Español (Estados Unidos)</option>
                <option value="zh-CN">中文 (Simplified Chinese)</option>
                <option value="vi-VN">Tiếng Việt (Vietnamese)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Clinical discharge instructions and assessment forms will be presented in your selected language when verified translations are available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
