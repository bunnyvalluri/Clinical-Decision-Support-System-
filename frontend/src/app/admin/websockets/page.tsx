"use client";

import * as React from "react";
import {
  Wifi,
  CheckCircle2,
  Radio,
  Clock,
  Layers,
  Search,
  Activity,
  Send,
  UserX,
  Lock,
  Globe2,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SocketClient {
  id: string;
  email: string;
  role: string;
  ip: string;
  groups: string[];
  connectedSince: string;
}

const ACTIVE_CLIENTS: SocketClient[] = [
  {
    id: "ws-901a",
    email: "dr.abhinay.vadla@hospital.org",
    role: "DOCTOR",
    ip: "10.240.12.84",
    groups: ["alerts_emergency", "vitals_live_stream"],
    connectedSince: "42 min ago",
  },
  {
    id: "ws-901b",
    email: "s.jenkins@hospital.org",
    role: "NURSE",
    ip: "10.240.14.12",
    groups: ["alerts_emergency", "triage_updates"],
    connectedSince: "1 hr 12 min ago",
  },
  {
    id: "ws-901c",
    email: "alex.rivera@hospital.org",
    role: "MEDICAL_INFORMATICIST",
    ip: "10.240.15.02",
    groups: ["model_drift_telemetry"],
    connectedSince: "25 min ago",
  },
  {
    id: "ws-901d",
    email: "m.chen@hospital.org",
    role: "IT_ADMIN",
    ip: "10.240.10.01",
    groups: ["admin_system_health", "alerts_emergency"],
    connectedSince: "2 hrs 10 min ago",
  },
  {
    id: "ws-901e",
    email: "dr.james.park@hospital.org",
    role: "DOCTOR",
    ip: "10.240.12.91",
    groups: ["alerts_emergency"],
    connectedSince: "8 min ago",
  },
];

const CHANNEL_GROUPS = [
  { name: "alerts_emergency", listeners: 8, priority: "CRITICAL", msgRate: "4 msg/min", desc: "Hospital emergency code blue and clinical triage escalations" },
  { name: "vitals_live_stream", listeners: 6, priority: "HIGH", msgRate: "60 msg/min", desc: "1Hz real-time bedside telemetry updates (SpO2, HR, BP)" },
  { name: "model_drift_telemetry", listeners: 2, priority: "MEDIUM", msgRate: "2 msg/hour", desc: "KS-test alerts and biomarker distribution shifts" },
  { name: "admin_system_health", listeners: 3, priority: "LOW", msgRate: "12 msg/min", desc: "Live heartbeat pings from database and worker daemons" },
];

export default function AdminWebSocketsPage() {
  const [clients, setClients] = React.useState<SocketClient[]>(ACTIVE_CLIENTS);
  const [broadcastGroup, setBroadcastGroup] = React.useState("alerts_emergency");
  const [broadcastText, setBroadcastText] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isBroadcasting, setIsBroadcasting] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDisconnect = (id: string, email: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    showToast(`WebSocket session ${id} for ${email} was closed by administrator.`);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setIsBroadcasting(true);
    setTimeout(() => {
      setIsBroadcasting(false);
      showToast(`Event broadcasted to [${broadcastGroup}]: "${broadcastText}"`);
      setBroadcastText("");
    }, 600);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ip.includes(searchTerm)
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
              Django Channels ASGI Daphne
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> WSS Secure Gateway
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Radio className="h-7 w-7 text-purple-600" />
            WebSocket Real-Time Gateway
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Bidirectional real-time event streaming powered by Django Channels, Daphne ASGI, and Upstash Redis channel layers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => showToast("Gateway ping: Daphne ASGI responding with sub-8ms roundtrip.")}
            className="text-xs font-semibold gap-1.5 border-slate-200"
          >
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            Ping Gateway
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
              <Radio className="h-5 w-5 text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Active Sockets</p>
              <p className="text-xl font-bold text-slate-900">{clients.length} Clients</p>
              <p className="text-[11px] text-purple-700 font-medium">100% authenticated</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <Activity className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Delivery Latency</p>
              <p className="text-xl font-bold text-slate-900">&lt; 8 ms</p>
              <p className="text-[11px] text-emerald-700 font-medium">p95: 14ms</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
              <Layers className="h-5 w-5 text-sky-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Channel Groups</p>
              <p className="text-xl font-bold text-slate-900">{CHANNEL_GROUPS.length} Topics</p>
              <p className="text-[11px] text-sky-700 font-medium">Pub/Sub Redis Layer</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
              <Lock className="h-5 w-5 text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Transport Encryption</p>
              <p className="text-xl font-bold text-slate-900">WSS Strict</p>
              <p className="text-[11px] text-emerald-700 font-medium">TLS 1.3 enforced</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Broadcast Message Simulator */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">Interactive Broadcast Event Dispatcher</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Publish real-time telemetry messages to specific channel groups for verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleBroadcast} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={broadcastGroup}
              onChange={(e) => setBroadcastGroup(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-600 sm:w-60 shrink-0"
            >
              {CHANNEL_GROUPS.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name} ({g.listeners} listeners)
                </option>
              ))}
            </select>
            <Input
              placeholder="Enter message payload (e.g. Code Blue alert simulation, calibration update)..."
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              className="text-xs h-9"
              required
            />
            <Button
              type="submit"
              disabled={isBroadcasting}
              className="text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              {isBroadcasting ? "Publishing..." : "Broadcast Event"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Channel Groups Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CHANNEL_GROUPS.map((g) => (
          <Card key={g.name} className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-900">{g.name}</span>
                <Badge
                  variant={g.priority === "CRITICAL" ? "destructive" : "outline"}
                  className="text-[10px]"
                >
                  {g.priority}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">{g.desc}</p>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-100 text-slate-600">
                <span>{g.listeners} Subscribers</span>
                <span className="font-mono text-emerald-700 font-semibold">{g.msgRate}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connected Sockets Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Active WebSocket Client Sessions</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Real-time connections authenticated via JWT tokens with active channel group subscriptions.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search clients or IPs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card View (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active WebSocket connections found.
              </div>
            ) : (
              filteredClients.map((client) => (
                <div key={client.id} className="p-4 space-y-2.5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-purple-900">{client.id}</span>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {client.role}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">{client.email}</span>
                    <span className="text-[11px] font-mono text-slate-500">{client.ip}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Subscribed Topics</span>
                    <div className="flex flex-wrap gap-1">
                      {client.groups.map((grp) => (
                        <span key={grp} className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {grp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <span className="text-[11px] text-slate-400">Connected: {client.connectedSince}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(client.id, client.email)}
                      className="text-xs h-7 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-semibold"
                    >
                      <UserX className="h-3 w-3 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="p-3 font-bold text-slate-700">Client ID</th>
                  <th className="p-3 font-bold text-slate-700">Staff Account</th>
                  <th className="p-3 font-bold text-slate-700">Role</th>
                  <th className="p-3 font-bold text-slate-700">Remote IP</th>
                  <th className="p-3 font-bold text-slate-700">Subscribed Topics</th>
                  <th className="p-3 font-bold text-slate-700">Connected Since</th>
                  <th className="p-3 font-bold text-right text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-mono font-semibold text-purple-900">{client.id}</td>
                    <td className="p-3 font-medium text-slate-800">{client.email}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {client.role}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{client.ip}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {client.groups.map((grp) => (
                          <span key={grp} className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {grp}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-slate-500">{client.connectedSince}</td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(client.id, client.email)}
                        className="text-xs h-7 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <UserX className="h-3 w-3 mr-1" />
                        Disconnect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

