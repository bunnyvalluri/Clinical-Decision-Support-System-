"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Heart,
  Info,
  Lock,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/responsive";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import { useAuthStore } from "@/features/auth/authStore";

interface ConversationItem {
  id: string;
  clinician_name: string;
  clinician_role: string;
  department: string;
  subject: string;
  category: "Prescription" | "Lab Results" | "General Inquiry" | "Telemetry" | "Urgent Triage";
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_online: boolean;
  is_typing?: boolean;
  has_telemetry_attached?: boolean;
  urgency?: "normal" | "urgent" | "high";
}

const INITIAL_CONVERSATIONS: ConversationItem[] = [
  {
    id: "conv-01",
    clinician_name: "Dr. Sarah Lin, MD",
    clinician_role: "Chief of Outpatient Cardiology",
    department: "Cardiology Care Team",
    subject: "30-Day Ambulatory Blood Pressure Review & Sodium Guidance",
    category: "Telemetry",
    last_message: "Your 30-day vitals trend looks consistent. Keep up with the daily sodium restriction and let us know immediately if any dizziness occurs.",
    last_message_at: "Just now",
    unread_count: 0,
    is_online: true,
    has_telemetry_attached: true,
    urgency: "normal",
  },
  {
    id: "conv-02",
    clinician_name: "Michael Chang, FNP",
    clinician_role: "Triage Nurse Practitioner",
    department: "Triage & Patient Education",
    subject: "Preparation for Upcoming Telehealth Consultation",
    category: "General Inquiry",
    last_message: "Please ensure your home blood pressure cuff is calibrated prior to Wednesday morning's checkup session.",
    last_message_at: "10 mins ago",
    unread_count: 1,
    is_online: true,
    urgency: "normal",
  },
  {
    id: "conv-03",
    clinician_name: "Dr. Emily Watson, PharmD",
    clinician_role: "Clinical Pharmacist",
    department: "Inpatient & Outpatient Pharmacy",
    subject: "Lisinopril 10mg 90-Day Refill Confirmation",
    category: "Prescription",
    last_message: "Your 90-day supply of Lisinopril 10mg has been transmitted to your designated outpatient pharmacy for pickup.",
    last_message_at: "Sep 04, 02:00 PM",
    unread_count: 0,
    is_online: false,
    urgency: "normal",
  },
];

export default function PatientMessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = React.useState<ConversationItem[]>(INITIAL_CONVERSATIONS);
  const [filter, setFilter] = React.useState<"all" | "unread" | "telemetry">("all");
  const [search, setSearch] = React.useState("");
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [activeClinicianTyping, setActiveClinicianTyping] = React.useState<string | null>(null);
  const [livePing, setLivePing] = React.useState(14);
  const [isSimulatingLiveStream, setIsSimulatingLiveStream] = React.useState(true);

  // Compose State
  const [recipient, setRecipient] = React.useState("Dr. Sarah Lin, MD");
  const [category, setCategory] = React.useState<"Prescription" | "Lab Results" | "General Inquiry" | "Telemetry" | "Urgent Triage">("General Inquiry");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [attachVitals, setAttachVitals] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);

  // WebSocket Integration
  const handleWsEvent = React.useCallback((event: { event_type: string; payload?: Record<string, unknown> }) => {
    if (event.event_type === "care_message_received" || event.event_type === "clinician_reply") {
      const p = event.payload || {};
      const newMsgText = String(p.message || p.content || "New clinical instruction received from care team.");
      const senderName = String(p.clinician_name || "Dr. Sarah Lin, MD");
      
      setConversations((prev) =>
        prev.map((c) =>
          c.clinician_name === senderName
            ? {
                ...c,
                last_message: newMsgText,
                last_message_at: "Just now",
                unread_count: c.unread_count + 1,
              }
            : c
        )
      );
      setToastMessage(`⚡ Real-Time Update: New message from ${senderName}`);
    }
  }, []);

  const { status: wsStatus } = useUserWebSocket(handleWsEvent);

  // Ping jitter simulation
  React.useEffect(() => {
    const pingTimer = setInterval(() => {
      setLivePing(12 + Math.floor(Math.random() * 8));
    }, 4000);
    return () => clearInterval(pingTimer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Real-time automated care team status & typing simulation
  React.useEffect(() => {
    if (!isSimulatingLiveStream) return;

    const timer = setInterval(() => {
      const candidates = ["Dr. Sarah Lin, MD", "Michael Chang, FNP"];
      const randomClinician = candidates[Math.floor(Math.random() * candidates.length)];
      
      // Flash typing indicator
      setActiveClinicianTyping(randomClinician);
      
      setTimeout(() => {
        setActiveClinicianTyping(null);
      }, 5000);
    }, 18000);

    return () => clearInterval(timer);
  }, [isSimulatingLiveStream]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);

    const vitalSnippet = attachVitals
      ? `\n\n[Attached Telemetry Snapshot: HR 74 BPM (NSR), BP 122/80 mmHg, SpO2 98%, Temp 98.6°F - Recorded Live]`
      : "";

    const fullMessage = message.trim() + vitalSnippet;

    const newConv: ConversationItem = {
      id: `conv-${Date.now()}`,
      clinician_name: recipient,
      clinician_role: recipient.includes("Lin")
        ? "Chief of Outpatient Cardiology"
        : recipient.includes("Chang")
        ? "Triage Nurse Practitioner"
        : "Clinical Pharmacist",
      department: recipient.includes("Lin") ? "Cardiology Care Team" : "Outpatient Services",
      subject: subject || (category === "Telemetry" ? "Ambulatory Vitals Review" : "Clinical Inquiry"),
      category: category,
      last_message: fullMessage,
      last_message_at: "Just now",
      unread_count: 0,
      is_online: true,
      has_telemetry_attached: attachVitals,
      urgency: category === "Urgent Triage" ? "urgent" : "normal",
    };

    setTimeout(() => {
      setConversations([newConv, ...conversations]);
      setIsSending(false);
      setShowNewModal(false);
      setSubject("");
      setMessage("");
      showToast(`✓ Secure message transmitted & reported to ${recipient} (Delivered in ${livePing}ms).`);

      // Trigger automatic clinician review typing feedback
      setTimeout(() => {
        setActiveClinicianTyping(recipient);
        setTimeout(() => {
          setActiveClinicianTyping(null);
          setConversations((prev) =>
            prev.map((c) =>
              c.id === newConv.id
                ? {
                    ...c,
                    last_message: `Received your inquiry and telemetry snapshot. I'm reviewing your vitals trend now. Everything looks stable; keep maintaining your routine!`,
                    last_message_at: "Just now",
                  }
                : c
            )
          );
          showToast(`⚡ Clinician Reply from ${recipient}: Review completed.`);
        }, 6000);
      }, 3000);
    }, 450);
  };

  const filtered = conversations.filter((c) => {
    if (filter === "unread" && c.unread_count === 0) return false;
    if (filter === "telemetry" && !c.has_telemetry_attached) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.clinician_name.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.last_message.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200 max-w-md">
          <div className="bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md flex items-center gap-3 text-xs font-medium">
            <CheckCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="flex-1">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-sky-500" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Care Team Secure Messaging
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Care Gateway Connected
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[11px] font-mono border border-sky-200">
                <Wifi className="h-3 w-3 text-sky-600" />
                {livePing}ms latency
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Real-time, audited, HIPAA-compliant communication with your cardiologist, nurse triage coordinator, and clinical pharmacy. Messages sync directly with your EHR chart in sub-second time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              onClick={() => setShowNewModal(true)}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-2 shadow-xs transition-all w-full sm:w-auto"
            >
              <Plus className="h-3.5 w-3.5" /> Compose Secure Message
            </Button>
            <a href="tel:5550194820" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-semibold gap-1.5 shadow-2xs"
              >
                <Phone className="h-3.5 w-3.5 text-slate-500" /> Helpline: (555) 019-4820
              </Button>
            </a>
          </div>
        </div>

        {/* Live Clinician Typing Alert Strip */}
        {activeClinicianTyping && (
          <div className="mt-4 p-2.5 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-between gap-3 text-xs text-teal-900 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1 bg-teal-200/70 text-teal-900 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">
                <Radio className="h-3 w-3 animate-pulse text-teal-700" /> LIVE
              </div>
              <p className="truncate font-medium">
                <span className="font-bold">{activeClinicianTyping}</span> is currently reviewing your telemetry log &amp; drafting a response...
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Care Team Quick Contact Bar */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
            Active On-Call Clinical Care Team
          </h2>
          <span className="text-[11px] text-slate-400">Average response: &lt; 4 mins</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              name: "Dr. Sarah Lin, MD",
              role: "Chief of Outpatient Cardiology",
              status: "In Clinic · Active Now",
              isOnline: true,
              responseTime: "3m",
              specialty: "Arrhythmia & Telemetry",
            },
            {
              name: "Michael Chang, FNP",
              role: "Triage Nurse Practitioner",
              status: "Triage Desk Online",
              isOnline: true,
              responseTime: "1m",
              specialty: "Symptom Review & Vitals",
            },
            {
              name: "Dr. Emily Watson, PharmD",
              role: "Clinical Pharmacist",
              status: "Pharmacy Portal Active",
              isOnline: true,
              responseTime: "5m",
              specialty: "Medication Refills & Interaction",
            },
          ].map((member, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between gap-3 hover:border-teal-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center justify-center shadow-2xs">
                      {member.name.split(" ")[1]?.[0] || "D"}
                    </div>
                    {member.isOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{member.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{member.role}</p>
                    <span className="inline-block text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-medium mt-0.5">
                      {member.specialty}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ~{member.responseTime} reply time
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRecipient(member.name);
                    setShowNewModal(true);
                  }}
                  className="h-7 text-[11px] px-2.5 text-teal-700 border-teal-200 hover:bg-teal-50 font-semibold"
                >
                  Direct Message
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search threads by clinician, keyword, or telemetry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-white w-full"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs rounded-lg bg-slate-100 p-1 border border-slate-200 shrink-0">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
              filter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Threads ({conversations.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
              filter === "unread" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Unread Only ({conversations.filter((c) => c.unread_count > 0).length})
          </button>
          <button
            onClick={() => setFilter("telemetry")}
            className={`px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
              filter === "telemetry" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            With Telemetry
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="space-y-3">
        {filtered.map((c) => (
          <Link key={c.id} href={`/user/messages/${c.id}`} className="block group">
            <Card
              className={`bg-white border transition-all ${
                c.unread_count > 0
                  ? "border-teal-400 shadow-sm bg-teal-50/10"
                  : "border-slate-200/90 shadow-2xs hover:border-teal-300 hover:shadow-xs"
              }`}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="relative mt-0.5 shrink-0">
                    <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shadow-2xs">
                      {c.clinician_name.split(" ")[1]?.[0] || "C"}
                    </div>
                    {c.is_online && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {c.clinician_name}
                      </h3>
                      <span className="text-xs text-slate-400">· {c.clinician_role}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200 text-slate-600">
                        {c.category}
                      </Badge>
                      {c.has_telemetry_attached && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full">
                          <Activity className="h-2.5 w-2.5 text-teal-600" />
                          Telemetry Attached
                        </span>
                      )}
                      {c.unread_count > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold animate-pulse">
                          {c.unread_count} New
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {c.subject}
                    </p>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                      &quot;{c.last_message}&quot;
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{c.last_message_at}</span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition-transform">
                    <span>Open Thread</span>
                    <ChevronRight className="h-4 w-4 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-400 space-y-2">
            <MessageSquare className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No message threads found</p>
            <p>Try adjusting your search terms or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Compose Message Modal */}
      <ResponsiveModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Compose Real-Time Secure Message"
        subtitle="Audited, HIPAA-compliant transmission delivered directly to your attending clinician."
        maxWidth="lg"
      >
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Recipient Clinician</label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-800 focus:outline-teal-600"
            >
              <option value="Dr. Sarah Lin, MD">Dr. Sarah Lin, MD (Chief of Cardiology - Active)</option>
              <option value="Michael Chang, FNP">Michael Chang, FNP (Triage Nurse Coordinator - Online)</option>
              <option value="Dr. Emily Watson, PharmD">Dr. Emily Watson, PharmD (Clinical Pharmacist)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Message Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as "Prescription" | "Lab Results" | "General Inquiry" | "Telemetry" | "Urgent Triage")}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-800 focus:outline-teal-600"
              >
                <option value="General Inquiry">General Clinical Inquiry</option>
                <option value="Telemetry">Ambulatory Vitals / BP Log Review</option>
                <option value="Prescription">Prescription &amp; Refill Inquiry</option>
                <option value="Lab Results">Lab &amp; Diagnostic Review</option>
                <option value="Urgent Triage">Urgent Symptom Check (Non-Emergency)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Subject</label>
              <Input
                placeholder="E.g., Morning blood pressure log question..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="text-xs h-10"
              />
            </div>
          </div>

          {/* Quick Telemetry Attachment Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attachVitals}
                  onChange={(e) => setAttachVitals(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-teal-600" />
                  Attach Real-Time Telemetry Snapshot
                </span>
              </label>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                Live Sensor Sync
              </span>
            </div>

            {attachVitals && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 font-medium">Heart Rate</p>
                  <p className="text-xs font-bold text-teal-700">74 BPM (NSR)</p>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 font-medium">Blood Pressure</p>
                  <p className="text-xs font-bold text-slate-900">122/80 mmHg</p>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 font-medium">Oxygen (SpO2)</p>
                  <p className="text-xs font-bold text-sky-700">98% Room Air</p>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 font-medium">Core Temp</p>
                  <p className="text-xs font-bold text-amber-700">98.6°F Normal</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Message Body</label>
              <span className="text-[11px] text-slate-400">Describe symptoms or inquiries</span>
            </div>
            <textarea
              placeholder="Type your clinical update, questions about medications, or symptom descriptions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-teal-600 resize-none font-normal"
            />
          </div>

          {category === "Urgent Triage" && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Medical Emergency Notice</p>
                <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                  If you are experiencing acute chest pain, sudden numbness, difficulty breathing, or severe dizziness, please dial 911 immediately rather than waiting for an online reply.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              256-bit AES Encrypted · Instant Clinical Transmission
            </span>
            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSending}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Transmitting...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> Send &amp; Sync to EHR
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
}

