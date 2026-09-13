"use client";

import React, { useState } from "react";
import { 
  KeyRound, 
  ShieldAlert, 
  Smartphone, 
  Laptop, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  History
} from "lucide-react";

interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

const INITIAL_SESSIONS: Session[] = [
  {
    id: "sess_1",
    device: "Windows 11 Workstation",
    browser: "Chrome 128.0",
    ip: "192.168.1.104 (Current Session)",
    lastActive: "Just now",
    isCurrent: true,
  },
  {
    id: "sess_2",
    device: "Apple iPhone 15 Pro",
    browser: "Safari Mobile 17.4",
    ip: "73.189.44.12",
    lastActive: "3 hours ago",
    isCurrent: false,
  },
];

export default function SecurityPage() {
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [passChanged, setPassChanged] = useState(false);
  const [submittingPass, setSubmittingPass] = useState(false);

  const handleRevoke = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPass(true);
    setTimeout(() => {
      setSubmittingPass(false);
      setPassChanged(true);
      setTimeout(() => setPassChanged(false), 4000);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Security & Credentials</h1>
            <p className="text-sm text-slate-600 mt-1">
              Protect your electronic health account with two-factor authentication, active session monitoring, and enterprise password policies.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Factor Authentication */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-teal-600" />
              Two-Factor Authentication (2FA)
            </h2>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
              mfaEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}>
              {mfaEnabled ? "Active & Enforced" : "Disabled"}
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Requires an SMS one-time passcode or authenticator app token each time you sign in from an unrecognized device or browser.
          </p>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-700">
            <div>
              <span className="font-semibold text-slate-900 block">Primary 2FA Method</span>
              <span>SMS Authentication (***-***-8821)</span>
            </div>
            <button
              onClick={() => setMfaEnabled(!mfaEnabled)}
              className="text-teal-700 hover:text-teal-800 font-semibold"
            >
              {mfaEnabled ? "Configure" : "Enable"}
            </button>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-teal-600" />
            Update Password
          </h2>

          {passChanged && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Password updated successfully. All other active sessions have been verified.
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                defaultValue="••••••••••••"
                className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                placeholder="At least 12 characters, 1 number, 1 symbol"
                className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <button
              type="submit"
              disabled={submittingPass}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-60 shadow-xs"
            >
              {submittingPass ? "Validating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-teal-600" />
              Active Sign-in Sessions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Devices currently authorized to access your patient portal account.
            </p>
          </div>
          <button
            onClick={() => setSessions(sessions.filter((s) => s.isCurrent))}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out All Other Devices
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {sessions.map((sess) => (
            <div key={sess.id} className="py-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{sess.device}</span>
                  {sess.isCurrent && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                      This Device
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>{sess.browser}</span>
                  <span>•</span>
                  <span>{sess.ip}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {sess.lastActive}
                  </span>
                </div>
              </div>

              {!sess.isCurrent && (
                <button
                  onClick={() => handleRevoke(sess.id)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-md transition-colors"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-teal-600" />
          Recent Account Security Events
        </h2>
        <div className="text-xs text-slate-600 divide-y divide-slate-100">
          <div className="py-2 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800">Successful Portal Authentication</span>
              <p className="text-slate-500">2FA Verified via SMS code</p>
            </div>
            <span className="text-slate-400">Today, 23:25</span>
          </div>
          <div className="py-2 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800">Vital Record Upload Verified</span>
              <p className="text-slate-500">Telemetry submission (BP 128/84)</p>
            </div>
            <span className="text-slate-400">Yesterday, 14:10</span>
          </div>
          <div className="py-2 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800">Consent Preferences Updated</span>
              <p className="text-slate-500">HIPAA exchange confirmation verified</p>
            </div>
            <span className="text-slate-400">Sep 11, 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
