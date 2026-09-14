"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCheck,
  ChevronRight,
  Clock,
  Filter,
  Lock,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/responsive";

interface ConversationItem {
  id: string;
  clinician_name: string;
  clinician_role: string;
  department: string;
  subject: string;
  category: "Prescription" | "Lab Results" | "General Inquiry" | "Telemetry";
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_online: boolean;
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
    last_message_at: "Yesterday, 04:15 PM",
    unread_count: 0,
    is_online: true,
  },
  {
    id: "conv-02",
    clinician_name: "Michael Chang, FNP",
    clinician_role: "Nurse Practitioner",
    department: "Triage & Patient Education",
    subject: "Preparation for Upcoming Telehealth Consultation",
    category: "General Inquiry",
    last_message: "Please ensure your home blood pressure cuff is calibrated prior to Wednesday morning's checkup session.",
    last_message_at: "Sep 10, 11:30 AM",
    unread_count: 1,
    is_online: true,
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
  },
];

export default function PatientMessagesPage() {
  const [conversations, setConversations] = React.useState<ConversationItem[]>(INITIAL_CONVERSATIONS);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [search, setSearch] = React.useState("");
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Compose State
  const [recipient, setRecipient] = React.useState("Dr. Sarah Lin, MD");
  const [category, setCategory] = React.useState<"Prescription" | "Lab Results" | "General Inquiry" | "Telemetry">("General Inquiry");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newConv: ConversationItem = {
      id: `conv-${Date.now()}`,
      clinician_name: recipient,
      clinician_role: recipient.includes("Lin") ? "Cardiology Specialist" : "Clinical Team Member",
      department: recipient.includes("Lin") ? "Cardiology Care Team" : "Clinical Staff",
      subject: subject || "Patient Clinical Inquiry",
      category: category,
      last_message: message,
      last_message_at: "Just now",
      unread_count: 0,
      is_online: true,
    };

    setConversations([newConv, ...conversations]);
    setShowNewModal(false);
    setSubject("");
    setMessage("");
    showToast("Message securely delivered to care team inbox.");
  };

  const filtered = conversations.filter((c) => {
    if (filter === "unread" && c.unread_count === 0) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.clinician_name.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.last_message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 backdrop-blur-md flex items-center gap-3 text-xs font-medium">
            <CheckCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-sky-500" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Care Team Secure Messaging
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                3 Clinicians On-Call
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Direct, HIPAA-compliant communication with your cardiologist, nurse coordinator, and pharmacy specialists. Average response time: under 2 hours.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              onClick={() => setShowNewModal(true)}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-2 shadow-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Message Care Team
            </Button>
            <a href="tel:5550194820">
              <Button
                variant="outline"
                size="sm"
                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-semibold gap-1.5 shadow-2xs"
              >
                <Phone className="h-3.5 w-3.5 text-slate-500" /> Helpline: (555) 019-4820
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Care Team Quick Contact Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { name: "Dr. Sarah Lin, MD", role: "Primary Cardiologist", status: "In Clinic Today", isOnline: true },
          { name: "Michael Chang, FNP", role: "Nurse Coordinator", status: "Triage Desk Active", isOnline: true },
          { name: "Dr. Emily Watson, PharmD", role: "Clinical Pharmacist", status: "Available for Refills", isOnline: false },
        ].map((member, i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 hover:border-teal-300 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center justify-center">
                  {member.name.split(" ")[1]?.[0] || "D"}
                </div>
                {member.isOnline && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{member.name}</p>
                <p className="text-[11px] text-slate-500">{member.role}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRecipient(member.name);
                setShowNewModal(true);
              }}
              className="h-7 text-[11px] px-2 text-teal-700 border-teal-200 hover:bg-teal-50"
            >
              Message
            </Button>
          </div>
        ))}
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search messages by clinician or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-white"
          />
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              filter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All Threads ({conversations.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              filter === "unread" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Unread Only (1)
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
                  ? "border-teal-300 shadow-xs bg-teal-50/10"
                  : "border-slate-200/90 shadow-2xs hover:border-teal-300 hover:shadow-xs"
              }`}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="relative mt-0.5">
                    <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                      {c.clinician_name.split(" ")[1]?.[0] || "C"}
                    </div>
                    {c.is_online && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {c.clinician_name}
                      </h3>
                      <span className="text-xs text-slate-400">· {c.clinician_role}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200 text-slate-600">
                        {c.category}
                      </Badge>
                      {c.unread_count > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold">
                          {c.unread_count} New
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {c.subject}
                    </p>

                    <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                      &quot;{c.last_message}&quot;
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium">{c.last_message_at}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-400">
            No message threads matching your search.
          </div>
        )}
      </div>

      {/* Compose Message Modal */}
      <ResponsiveModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Compose Secure Message"
        subtitle="Audited, HIPAA-compliant transmission directly to your clinical provider."
        maxWidth="md"
      >
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Recipient</label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-800"
            >
              <option value="Dr. Sarah Lin, MD">Dr. Sarah Lin, MD (Primary Cardiologist)</option>
              <option value="Michael Chang, FNP">Michael Chang, FNP (Triage Nurse Coordinator)</option>
              <option value="Dr. Emily Watson, PharmD">Dr. Emily Watson, PharmD (Clinical Pharmacist)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Message Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-800"
            >
              <option value="General Inquiry">General Clinical Inquiry</option>
              <option value="Prescription">Prescription &amp; Medication Refill</option>
              <option value="Telemetry">Telemetry &amp; BP Log Question</option>
              <option value="Lab Results">Lab &amp; Diagnostic Review</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Subject</label>
            <Input
              placeholder="E.g., Question regarding morning BP reading..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="text-xs h-10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Message Body</label>
            <textarea
              placeholder="Describe your inquiry or symptoms in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-teal-600 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Lock className="h-3 w-3 text-emerald-600" /> 256-bit Encrypted
            </span>
            <div className="flex items-center gap-2">
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
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
              >
                <Send className="h-3 w-3" /> Send Message
              </Button>
            </div>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
}
