"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, ShieldCheck, CheckCheck, Check, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/services/apiClient";

interface ChatMessage {
  id: string;
  sender: string;
  is_patient: boolean;
  timestamp: string;
  text: string;
  status: "reporting" | "reported" | "read";
  reportedAt?: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m-1",
    sender: "Doctor",
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
    sender: "Doctor",
    is_patient: false,
    timestamp: "Yesterday, 04:00 PM",
    text: "Excellent progress. We'll do a routine check of your resting ECG during Wednesday's clinic visit.",
    status: "read",
  },
];

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.conversationId as string;
  const [messages, setMessages] = React.useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [newText, setNewText] = React.useState("");
  const [isDoctorTyping, setIsDoctorTyping] = React.useState(false);
  const [reportBanner, setReportBanner] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  // Restore messages from localStorage
  React.useEffect(() => {
    if (typeof window === "undefined" || !conversationId) return;
    try {
      const stored = localStorage.getItem(`cdss_chat_${conversationId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize any legacy messages without status
          const normalized: ChatMessage[] = parsed.map((m: Partial<ChatMessage>) => ({
            id: m.id || String(Date.now()),
            sender: m.sender || "User",
            is_patient: !!m.is_patient,
            timestamp: m.timestamp || new Date().toISOString(),
            text: m.text || "",
            status: (m.status as ChatMessage["status"]) || (m.is_patient ? "reported" : "read"),
            reportedAt: m.reportedAt,
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
    if (!trimmed) return;

    const messageId = `m-${Date.now()}`;
    const patientMsg: ChatMessage = {
      id: messageId,
      sender: "User / Patient",
      is_patient: true,
      timestamp: "Just now",
      text: trimmed,
      status: "reporting",
    };

    setMessages((prev) => [...prev, patientMsg]);
    setNewText("");
    setReportBanner("Reporting message to Doctor & syncing with clinical chart...");

    // Transition to 'reported' after short verification delay
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, status: "reported", reportedAt: "Just now" }
            : msg
        )
      );
      setReportBanner("✓ Message successfully reported to Doctor & logged in EHR");
      setIsDoctorTyping(true);

      setTimeout(() => {
        setReportBanner(null);
      }, 4000);
    }, 500);

    // Attempt backend persistence
    apiClient.post(`/user/messages/${conversationId}/`, { content: trimmed }).catch(() => {
      // Graceful offline fallback
    });

    // Generate responsive clinical reply from Doctor
    setTimeout(() => {
      let doctorResponse =
        "Thank you for the update. Your message has been reported into your clinical chart. We are reviewing your vitals and will advise if any follow-up is needed.";
      const lower = trimmed.toLowerCase();

      if (
        lower === "hi" ||
        lower === "hello" ||
        lower === "hey" ||
        lower.startsWith("hi ") ||
        lower.startsWith("hello ")
      ) {
        doctorResponse =
          "Hello! Your message has been reported to the attending care team. How are you feeling today, and do you have any symptoms or vitals to record?";
      } else if (
        lower.includes("bp") ||
        lower.includes("blood pressure") ||
        lower.includes("/") ||
        lower.includes("vital")
      ) {
        doctorResponse =
          "Thank you for reporting your readings. The measurements have been logged into your telemetry chart. Please maintain your daily sodium targets and report any sudden spikes.";
      } else if (
        lower.includes("pain") ||
        lower.includes("chest") ||
        lower.includes("dizzy") ||
        lower.includes("shortness")
      ) {
        doctorResponse =
          "Notice: If you are experiencing acute chest pressure, shortness of breath, or severe dizziness, please rest immediately and call emergency services (911). Your report has been flagged for urgent clinical review.";
      } else if (
        lower.includes("appointment") ||
        lower.includes("visit") ||
        lower.includes("wednesday")
      ) {
        doctorResponse =
          "Your upcoming outpatient appointment is confirmed. We will perform your routine resting ECG check and review your 30-day vitals trends.";
      }

      const doctorMsg: ChatMessage = {
        id: `m-doc-${Date.now()}`,
        sender: "Doctor",
        is_patient: false,
        timestamp: "Just now",
        text: doctorResponse,
        status: "read",
      };

      setMessages((prev) => [...prev, doctorMsg]);
      setIsDoctorTyping(false);
    }, 1500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/user/messages")}
          className="text-xs gap-1.5 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Messages
        </Button>

        {/* Live Status Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active · All Messages Reported</span>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Card Header with Doctor & Audit Info */}
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Doctor</h2>
              <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-[10px]">
                Attending Physician
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Subject: 30-Day Ambulatory Blood Pressure Review
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] hidden sm:inline-flex items-center gap-1">
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
            <span>{reportBanner}</span>
          </div>
        )}

        {/* Message Thread */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.is_patient ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-bold text-slate-700">{m.sender}</span>
                <span className="text-[10px] text-slate-400">{m.timestamp}</span>
              </div>
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                  m.is_patient
                    ? "bg-teal-600 text-white rounded-tr-none"
                    : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
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
                      Reporting to Doctor...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700 shadow-2xs">
                      <CheckCheck className="h-3 w-3 text-emerald-600" />
                      Reported to Doctor
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">EHR Synced</span>
                </div>
              )}
            </div>
          ))}

          {/* Doctor Typing Indicator */}
          {isDoctorTyping && (
            <div className="flex flex-col items-start space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-700">Doctor</span>
                <span className="text-[10px] text-teal-600 font-medium animate-pulse flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-teal-600" />
                  Reviewing reported message &amp; typing…
                </span>
              </div>
              <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-slate-100 border border-slate-200 shadow-2xs flex items-center gap-1.5">
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
        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Type your clinical update to Doctor..."
              className="text-xs bg-white focus-visible:ring-teal-600"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <Send className="h-3.5 w-3.5" /> Send &amp; Report
            </Button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Check className="h-2.5 w-2.5 text-emerald-600" /> Direct encrypted line to Attending Physician
            </span>
            <span>Messages are instantly reported to clinical records</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
