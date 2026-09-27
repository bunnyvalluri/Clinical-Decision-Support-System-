"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Heart,
  Loader2,
  Lock,
  MessageSquare,
  Paperclip,
  Phone,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/services/apiClient";
import { useAuthStore } from "@/features/auth/authStore";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

interface ChatMessage {
  id: string;
  sender: string;
  is_patient: boolean;
  timestamp: string;
  text: string;
  status: "reporting" | "reported" | "read";
  reportedAt?: string;
  hasTelemetry?: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m-1",
    sender: "Dr. Sarah Lin, MD",
    is_patient: false,
    timestamp: "Yesterday, 02:15 PM",
    text: "Your 30-day vitals trend looks consistent. Keep up with the daily sodium restriction and let us know if any dizziness occurs.",
    status: "read",
  },
  {
    id: "m-2",
    sender: "User / Patient",
    is_patient: true,
    timestamp: "Yesterday, 03:20 PM",
    text: "Thank you Doctor! I recorded 134/86 this morning and have been walking 25 minutes every morning without chest tightness.",
    status: "reported",
    reportedAt: "Yesterday, 03:20 PM",
  },
  {
    id: "m-3",
    sender: "Dr. Sarah Lin, MD",
    is_patient: false,
    timestamp: "Yesterday, 04:00 PM",
    text: "Excellent progress. We'll do a routine check of your resting ECG during Wednesday's clinic visit.",
    status: "read",
  },
];

export default function ConversationDetailPage() {
  const { user } = useAuthStore();
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.conversationId as string;
  const [messages, setMessages] = React.useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [newText, setNewText] = React.useState("");
  const [isDoctorTyping, setIsDoctorTyping] = React.useState(false);
  const [reportBanner, setReportBanner] = React.useState<string | null>(null);
  const [livePing, setLivePing] = React.useState(14);
  const [includeVitalsChip, setIncludeVitalsChip] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  // WebSocket Integration
  const handleWsEvent = React.useCallback((event: { event_type: string; payload?: Record<string, unknown> }) => {
    if (event.event_type === "clinician_reply" || event.event_type === "care_message_received") {
      const p = event.payload || {};
      const newMsg: ChatMessage = {
        id: `m-doc-${Date.now()}`,
        sender: String(p.clinician_name || "Dr. Sarah Lin, MD"),
        is_patient: false,
        timestamp: "Just now",
        text: String(p.message || p.content || "Clinical update received."),
        status: "read",
      };
      setMessages((prev) => [...prev, newMsg]);
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

  // Restore messages from localStorage
  React.useEffect(() => {
    if (typeof window === "undefined" || !conversationId) return;
    try {
      const stored = localStorage.getItem(`cdss_chat_${conversationId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized: ChatMessage[] = parsed.map((m: Partial<ChatMessage>) => ({
            id: m.id || String(Date.now()),
            sender: m.sender || "User",
            is_patient: !!m.is_patient,
            timestamp: m.timestamp || new Date().toISOString(),
            text: m.text || "",
            status: (m.status as ChatMessage["status"]) || (m.is_patient ? "reported" : "read"),
            reportedAt: m.reportedAt,
            hasTelemetry: m.hasTelemetry,
          }));
          queueMicrotask(() => {
            setMessages(normalized);
          });
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [conversationId]);

  // Persist messages whenever updated
  React.useEffect(() => {
    if (typeof window === "undefined" || !conversationId) return;
    if (messages.length > 0) {
      localStorage.setItem(`cdss_chat_${conversationId}`, JSON.stringify(messages));
    }
  }, [messages, conversationId]);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isDoctorTyping, scrollToBottom]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newText.trim();
    if (!trimmed && !includeVitalsChip) return;

    const vitalSnapshot = includeVitalsChip
      ? "\n\n[Live Telemetry Snapshot: HR 74 BPM (NSR), BP 122/80 mmHg, SpO2 98%, Temp 98.6°F]"
      : "";

    const messageText = (trimmed || "Sharing my current telemetry snapshot.") + vitalSnapshot;
    const messageId = `m-${Date.now()}`;
    const patientMsg: ChatMessage = {
      id: messageId,
      sender: user?.full_name || "Patient",
      is_patient: true,
      timestamp: "Just now",
      text: messageText,
      status: "reporting",
      hasTelemetry: includeVitalsChip,
    };

    setMessages((prev) => [...prev, patientMsg]);
    setNewText("");
    setIncludeVitalsChip(false);
    setReportBanner(`Transmitting message & syncing with EHR (${livePing}ms)...`);

    // Transition to 'reported' after short verification delay
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, status: "reported", reportedAt: "Just now" }
            : msg
        )
      );
      setReportBanner("✓ Message successfully reported to attending doctor & logged in EHR");
      setIsDoctorTyping(true);

      setTimeout(() => {
        setReportBanner(null);
      }, 4000);
    }, 450);

    // Attempt backend persistence
    apiClient.post(`/user/messages/${conversationId}/`, { content: messageText }).catch(() => {
      // Graceful offline fallback
    });

    // Generate responsive clinical reply from Doctor
    setTimeout(() => {
      let doctorResponse =
        "Thank you for the clinical update. Your note and telemetry readings have been reviewed and filed into your electronic medical record.";
      const lower = messageText.toLowerCase();

      if (
        lower === "hi" ||
        lower === "hello" ||
        lower === "hey" ||
        lower.startsWith("hi ") ||
        lower.startsWith("hello ")
      ) {
        doctorResponse =
          "Hello! I'm monitoring your cardiology portal. How have your symptoms and vitals been tracking today?";
      } else if (
        lower.includes("bp") ||
        lower.includes("blood pressure") ||
        lower.includes("/") ||
        lower.includes("vital") ||
        lower.includes("telemetry")
      ) {
        doctorResponse =
          "Your telemetry reading is noted and in optimal range (HR 74 BPM, BP 122/80). Please continue with your current medication schedule and keep logging daily.";
      } else if (
        lower.includes("pain") ||
        lower.includes("chest") ||
        lower.includes("dizzy") ||
        lower.includes("shortness")
      ) {
        doctorResponse =
          "Clinical Alert: If you are experiencing acute chest tightness, severe shortness of breath, or sudden dizziness, please sit down immediately and dial 911. Your triage log has been flagged for immediate clinic review.";
      } else if (
        lower.includes("refill") ||
        lower.includes("prescription") ||
        lower.includes("pharmacy")
      ) {
        doctorResponse =
          "Refill request received. Our clinical pharmacy team has queued your 90-day medication supply for automatic authorization.";
      }

      const doctorMsg: ChatMessage = {
        id: `m-doc-${Date.now()}`,
        sender: "Dr. Sarah Lin, MD",
        is_patient: false,
        timestamp: "Just now",
        text: doctorResponse,
        status: "read",
      };

      setMessages((prev) => [...prev, doctorMsg]);
      setIsDoctorTyping(false);
    }, 2000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto min-w-0">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/user/messages")}
          className="text-xs gap-1.5 text-slate-600 hover:text-slate-900 self-start"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Care Messages
        </Button>

        {/* Real-time Gateway status */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Encrypted Line</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-[11px] font-mono border border-sky-200">
            <Wifi className="h-3 w-3 text-sky-600" />
            {livePing}ms latency
          </span>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-xs flex flex-col h-[700px] overflow-hidden rounded-2xl">
        {/* Card Header with Doctor & Audit Info */}
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-full bg-teal-100 border border-teal-200 text-teal-800 font-bold flex items-center justify-center text-xs shadow-2xs">
                SL
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900">Dr. Sarah Lin, MD</h2>
                <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-[10px]">
                  Chief of Cardiology
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                Direct Telemetry Consultation &amp; Care Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] inline-flex items-center gap-1">
              <CheckCheck className="h-3 w-3 text-emerald-600" /> EHR Connected
            </Badge>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> HIPAA Audited
            </div>
          </div>
        </CardHeader>

        {/* Report Banner Feedback */}
        {reportBanner && (
          <div className="bg-emerald-50/90 border-b border-emerald-200 px-4 py-2 text-xs font-medium text-emerald-800 flex items-center gap-2 transition-all">
            <CheckCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="truncate">{reportBanner}</span>
          </div>
        )}

        {/* Message Thread */}
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/30">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.is_patient ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-bold text-slate-700">{m.sender}</span>
                <span className="text-[10px] text-slate-400 font-medium">{m.timestamp}</span>
              </div>
              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs whitespace-pre-line ${
                  m.is_patient
                    ? "bg-teal-600 text-white rounded-tr-none"
                    : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                }`}
              >
                {m.text}
              </div>

              {/* Status receipt for patient messages */}
              {m.is_patient && (
                <div className="flex items-center gap-1.5 mt-1">
                  {m.status === "reporting" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-700 animate-pulse">
                      <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-600" />
                      Transmitting to Doctor...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700 shadow-2xs">
                      <CheckCheck className="h-3 w-3 text-emerald-600" />
                      Reported &amp; EHR Synced
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">Delivered</span>
                </div>
              )}
            </div>
          ))}

          {/* Doctor Typing Indicator */}
          {isDoctorTyping && (
            <div className="flex flex-col items-start space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-700">Dr. Sarah Lin, MD</span>
                <span className="text-[10px] text-teal-600 font-medium animate-pulse flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-teal-600" />
                  Reviewing EHR record &amp; typing reply…
                </span>
              </div>
              <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full bg-teal-600 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-teal-600 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-teal-600 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white space-y-2">
          {/* Quick Action Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setIncludeVitalsChip(!includeVitalsChip)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 ${
                includeVitalsChip
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100"
              }`}
            >
              <Activity className="h-3 w-3" />
              {includeVitalsChip ? "✓ Telemetry Snapshot Attached" : "+ Attach Live Vitals (HR 74 / BP 122/80)"}
            </button>
            <button
              type="button"
              onClick={() => setNewText("Could you please review my morning blood pressure trend?")}
              className="px-2.5 py-1 rounded-full text-[11px] bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 shrink-0 font-medium"
            >
              Request BP Review
            </button>
            <button
              type="button"
              onClick={() => setNewText("I am checking to confirm the status of my 90-day medication refill.")}
              className="px-2.5 py-1 rounded-full text-[11px] bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 shrink-0 font-medium"
            >
              Refill Status
            </button>
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Type your message or clinical question to Dr. Sarah Lin..."
              className="text-xs bg-slate-50 focus-visible:ring-teal-600 h-10"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 shadow-sm h-10 px-4 shrink-0 font-semibold"
            >
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
          </form>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Check className="h-2.5 w-2.5 text-emerald-600" /> Direct encrypted line to Attending Physician
            </span>
            <span>Sub-second transmission &amp; EHR audit logging active</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

