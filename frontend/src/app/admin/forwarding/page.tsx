"use client";

import * as React from "react";
import {
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  Power,
  Layers,
  Radio,
  RefreshCw,
  Plus,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

interface DeviceItem {
  id: string;
  device_identifier: string;
  device_name: string;
  username: string | null;
  registration_status: string;
  last_seen: string | null;
  is_online: boolean;
}

interface DestinationItem {
  id: string;
  name: string;
  destination_type: string;
  endpoint: string;
  approval_status: string;
  enabled: boolean;
}

interface RuleItem {
  id: string;
  name: string;
  event_type: string;
  source_filter: string;
  classification_policy: string;
  destination_name: string;
  priority: number;
  enabled: boolean;
}

interface DeadLetterItem {
  id: string;
  destination_name: string;
  failure_reason: string;
  attempt_count: number;
  status: string;
  created_at: string;
}

export default function AdminForwardingPage() {
  const [activeTab, setActiveTab] = React.useState<"devices" | "destinations" | "rules" | "dead_letters">("devices");
  const [devices, setDevices] = React.useState<DeviceItem[]>([]);
  const [destinations, setDestinations] = React.useState<DestinationItem[]>([]);
  const [rules, setRules] = React.useState<RuleItem[]>([]);
  const [deadLetters, setDeadLetters] = React.useState<DeadLetterItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [killSwitchActive, setKillSwitchActive] = React.useState(false);
  const [killReason, setKillReason] = React.useState("");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [devRes, destRes, ruleRes, dlRes, ksRes] = await Promise.all([
        fetch("/api/v1/mobile/devices/"),
        fetch("/api/v1/mobile/destinations/"),
        fetch("/api/v1/mobile/rules/"),
        fetch("/api/v1/mobile/dead-letters/"),
        fetch("/api/v1/mobile/kill-switch/"),
      ]);

      if (devRes.ok) {
        const d = await devRes.json();
        setDevices(Array.isArray(d) ? d : d.results || []);
      }
      if (destRes.ok) {
        const d = await destRes.json();
        setDestinations(Array.isArray(d) ? d : d.results || []);
      }
      if (ruleRes.ok) {
        const d = await ruleRes.json();
        setRules(Array.isArray(d) ? d : d.results || []);
      }
      if (dlRes.ok) {
        const d = await dlRes.json();
        setDeadLetters(Array.isArray(d) ? d : d.results || []);
      }
      if (ksRes.ok) {
        const d = await ksRes.json();
        const activeList = (Array.isArray(d) ? d : d.results || []).filter((k: any) => k.is_active);
        setKillSwitchActive(activeList.length > 0);
        if (activeList.length > 0) {
          setKillReason(activeList[0].reason);
        }
      }
    } catch {
      // Empty state fallbacks
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTriggerKillSwitch = async () => {
    const reason = prompt("Enter clinical/security reason for Emergency Forwarding Kill Switch:");
    if (!reason) return;

    try {
      const res = await fetch("/api/v1/mobile/kill-switch/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "GLOBAL",
          reason: reason,
        }),
      });
      if (res.ok) {
        setKillSwitchActive(true);
        setKillReason(reason);
        fetchData();
      }
    } catch {
      alert("Failed to activate kill switch.");
    }
  };

  const handleApproveDevice = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/mobile/devices/${id}/approve/`, { method: "POST" });
      if (res.ok) fetchData();
    } catch {
      alert("Failed to approve device.");
    }
  };

  const handleRevokeDevice = async (id: string) => {
    if (!confirm("Confirm revocation of device?")) return;
    try {
      const res = await fetch(`/api/v1/mobile/devices/${id}/revoke/`, { method: "POST" });
      if (res.ok) fetchData();
    } catch {
      alert("Failed to revoke device.");
    }
  };

  const handleRequeueDeadLetter = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/mobile/dead-letters/${id}/requeue/`, { method: "POST" });
      if (res.ok) fetchData();
    } catch {
      alert("Failed to requeue event.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 bg-white text-slate-800">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-purple-600" />
            Mobile Event Gateway Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Governance command center for Android telephony events, destination allowlists, and policy enforcement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleTriggerKillSwitch}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors flex items-center gap-2 ${
              killSwitchActive ? "bg-rose-700 hover:bg-rose-800" : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            <Power className="h-4 w-4" />
            {killSwitchActive ? "Kill Switch Active" : "Emergency Kill Switch"}
          </button>
        </div>
      </div>

      {/* Emergency Kill Switch Banner */}
      {killSwitchActive && (
        <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertOctagon className="h-6 w-6 text-rose-600 shrink-0 animate-bounce" />
            <div>
              <div className="font-bold text-sm">EMERGENCY FORWARDING HALT IN EFFECT</div>
              <div className="text-xs text-rose-700">Reason: {killReason || "Security containment"}</div>
            </div>
          </div>
          <span className="text-xs font-mono bg-rose-200 text-rose-900 px-2.5 py-1 rounded font-bold">
            ALL FORWARDING BLOCKED
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("devices")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "devices"
              ? "border-purple-600 text-purple-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Smartphone className="h-4 w-4" />
          Devices ({devices.length})
        </button>
        <button
          onClick={() => setActiveTab("destinations")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "destinations"
              ? "border-purple-600 text-purple-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          Destinations ({destinations.length})
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "rules"
              ? "border-purple-600 text-purple-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Declarative Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab("dead_letters")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "dead_letters"
              ? "border-purple-600 text-purple-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          Dead Letter Queue ({deadLetters.length})
        </button>
      </div>

      {/* Tab 1: Devices */}
      {activeTab === "devices" && (
        <div className="space-y-4">
          {devices.length === 0 && !loading ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center text-sm text-slate-500">
              No mobile devices registered.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Device Name / ID</th>
                    <th className="p-3">Owner</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Last Seen</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {devices.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{d.device_name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{d.device_identifier}</div>
                      </td>
                      <td className="p-3">{d.username || "Unassigned"}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            d.registration_status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : d.registration_status === "REVOKED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {d.registration_status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">
                        {d.last_seen ? new Date(d.last_seen).toLocaleTimeString() : "Never"}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {d.registration_status === "PENDING" && (
                          <button
                            onClick={() => handleApproveDevice(d.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium"
                          >
                            Approve
                          </button>
                        )}
                        {d.registration_status !== "REVOKED" && (
                          <button
                            onClick={() => handleRevokeDevice(d.id)}
                            className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded text-[11px] font-medium"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Destinations */}
      {activeTab === "destinations" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Destination Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Endpoint</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {destinations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No forwarding destinations configured. Default-deny strictly enforced.
                    </td>
                  </tr>
                ) : (
                  destinations.map((dst) => (
                    <tr key={dst.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{dst.name}</td>
                      <td className="p-3 font-mono text-[11px]">{dst.destination_type}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{dst.endpoint}</td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 font-medium">
                          {dst.approval_status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            dst.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {dst.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Rules */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Rule Name</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Policy Action</th>
                  <th className="p-3">Destination</th>
                  <th className="p-3">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No forwarding rules found. Default-deny active.
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-600">{r.priority}</td>
                      <td className="p-3 font-semibold text-slate-900">{r.name}</td>
                      <td className="p-3 font-mono text-[11px]">{r.event_type}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.classification_policy === "ALLOW"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.classification_policy === "BLOCK"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {r.classification_policy}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{r.destination_name}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            r.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {r.enabled ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Dead Letters */}
      {activeTab === "dead_letters" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Destination</th>
                  <th className="p-3">Failure Reason</th>
                  <th className="p-3">Attempts</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deadLetters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No failed events in dead-letter queue. All deliveries healthy.
                    </td>
                  </tr>
                ) : (
                  deadLetters.map((dl) => (
                    <tr key={dl.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{dl.destination_name}</td>
                      <td className="p-3 text-rose-600 font-mono text-[11px]">{dl.failure_reason}</td>
                      <td className="p-3 font-mono">{dl.attempt_count}</td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-medium">
                          {dl.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRequeueDeadLetter(dl.id)}
                          className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[11px] font-medium flex items-center gap-1 ml-auto"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Requeue
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
