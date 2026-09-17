"use client";

import * as React from "react";
import {
  Smartphone,
  ShieldCheck,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  Lock,
} from "lucide-react";

interface MobileDevice {
  id: string;
  device_identifier: string;
  device_name: string;
  platform: string;
  app_version: string;
  os_version: string;
  registration_status: string;
  last_seen: string | null;
  is_online: boolean;
  created_at: string;
}

interface SanitizedEvent {
  id: string;
  event_type: string;
  source: string;
  timestamp: string;
  content: string;
  classification: string;
  processing_status: string;
}

export default function UserDevicesPage() {
  const [devices, setDevices] = React.useState<MobileDevice[]>([]);
  const [events, setEvents] = React.useState<SanitizedEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);
  const [newDeviceName, setNewDeviceName] = React.useState("");
  const [newDeviceId, setNewDeviceId] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  const fetchDevices = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/mobile/devices/");
      if (res.ok) {
        const data = await res.json();
        setDevices(Array.isArray(data) ? data : data.results || []);
      }

      const eventRes = await fetch("/api/v1/mobile/events/");
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvents(Array.isArray(eventData) ? eventData : eventData.results || []);
      }
    } catch {
      // Offline / fallback empty states
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newDeviceId) {
      setErrorMsg("Device identifier is required.");
      return;
    }

    try {
      const res = await fetch("/api/v1/mobile/devices/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_identifier: newDeviceId,
          device_name: newDeviceName || "My Android Phone",
          platform: "ANDROID",
          app_version: "3.42.0",
        }),
      });

      if (res.ok) {
        setSuccessMsg("Device successfully registered. Awaiting clinical/IT activation.");
        setIsRegisterOpen(false);
        setNewDeviceId("");
        setNewDeviceName("");
        fetchDevices();
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Failed to register device.");
      }
    } catch {
      setErrorMsg("Network error during device registration.");
    }
  };

  const handleRevoke = async (deviceId: string) => {
    if (!confirm("Are you sure you want to revoke this device? It will immediately disconnect.")) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/mobile/devices/${deviceId}/revoke/`, {
        method: "POST",
      });
      if (res.ok) {
        fetchDevices();
      }
    } catch {
      alert("Failed to revoke device.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 bg-white text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-teal-600" />
            My Registered Devices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal healthcare mobile gateway nodes, background sync, and security status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDevices}
            disabled={loading}
            className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Register Device
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Register Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-teal-600" />
              Register New Android Gateway
            </h3>
            <p className="text-xs text-slate-500">
              Enter the unique device identifier generated by your HealthNova Android application.
            </p>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Device Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pixel 8 Pro (Bedside)"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Device Hardware Identifier *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9f8a7b6c-5d4e-3f2a-1b0c-9d8e7f6a5b4c"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Device List */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Radio className="h-4 w-4 text-teal-600" />
          Active Hardware Nodes ({devices.length})
        </h2>

        {devices.length === 0 && !loading ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
            <Smartphone className="h-10 w-10 text-slate-400 mx-auto" />
            <div className="text-sm font-medium text-slate-700">No Mobile Devices Registered</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You have not linked any Android devices yet. Register your phone to securely sync verified clinical notifications.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((device) => {
              const isActive = device.registration_status === "ACTIVE";
              const isRevoked = device.registration_status === "REVOKED";

              return (
                <div
                  key={device.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {device.device_name}
                        </div>
                        <div className="text-xs font-mono text-slate-400 truncate max-w-[200px]">
                          {device.device_identifier}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : isRevoked
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {device.registration_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div>
                      <span className="text-slate-400 block">OS Version</span>
                      {device.os_version || "Android"}
                    </div>
                    <div>
                      <span className="text-slate-400 block">Gateway App</span>
                      v{device.app_version}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : "Never"}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          device.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                        }`}
                      />
                      <span>{device.is_online ? "Connected" : "Offline"}</span>
                    </div>
                  </div>

                  {!isRevoked && (
                    <div className="border-t border-slate-100 pt-3 flex justify-end">
                      <button
                        onClick={() => handleRevoke(device.id)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Revoke Device
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sanitized Events Audit Stream */}
      <div className="space-y-4 pt-6">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-teal-600" />
          Recent Sanitized Events ({events.length})
        </h2>

        {events.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
            No events ingested yet. All events will appear here in redacted/sanitized format.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100">
              {events.slice(0, 5).map((evt) => (
                <div key={evt.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="space-y-1 max-w-[70%]">
                    <div className="font-medium text-slate-800 flex items-center gap-2">
                      <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {evt.event_type}
                      </span>
                      <span>From: {evt.source}</span>
                    </div>
                    <div className="text-slate-500 truncate">{evt.content}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                      {evt.classification}
                    </span>
                    <div className="text-slate-400 text-[10px]">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
