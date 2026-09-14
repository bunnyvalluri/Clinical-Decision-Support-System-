"use client";

import * as React from "react";
import Link from "next/link";
import {
  MessageSquare,
  Plus,
  User,
  Clock,
  ChevronRight,
  ShieldCheck,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MOCK_CONVERSATIONS = [
  {
    id: "conv-01",
    clinician_name: "Doctor",
    department: "Cardiology Care Team",
    subject: "30-Day Ambulatory Blood Pressure Review",
    last_message: "Your 30-day vitals trend looks consistent. Keep up with the daily sodium restriction...",
    last_message_at: "Yesterday",
    unread_count: 0,
  },
  {
    id: "conv-02",
    clinician_name: "Nurse",
    department: "Triage & Patient Education",
    subject: "Preparation for Upcoming Telehealth Consultation",
    last_message: "Please ensure your blood pressure cuff is calibrated prior to Wednesday morning's checkup.",
    last_message_at: "Sep 10",
    unread_count: 1,
  },
];

export default function PatientMessagesPage() {
  const [conversations, setConversations] = React.useState(MOCK_CONVERSATIONS);
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const newConv = {
      id: `conv-${Date.now()}`,
      clinician_name: "Doctor",
      department: "Cardiology Care Team",
      subject: subject || "Clinical Inquiry",
      last_message: message,
      last_message_at: "Just now",
      unread_count: 0,
    };
    setConversations([newConv, ...conversations]);
    setShowNewModal(false);
    setSubject("");
    setMessage("");
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-teal-600" />
            Care Team Secure Messaging
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            HIPAA-compliant, audited clinical communication with your designated physicians and nurses.
          </p>
        </div>

        <Button
          onClick={() => setShowNewModal(true)}
          size="sm"
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" /> Message Care Team
        </Button>
      </div>

      <div className="space-y-3">
        {conversations.map((c) => (
          <Link key={c.id} href={`/user/messages/${c.id}`} className="block">
            <Card className="bg-white border-slate-200 shadow-sm hover:border-teal-300 transition-all">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{c.clinician_name}</h3>
                      <span className="text-[11px] text-slate-400">· {c.department}</span>
                      {c.unread_count > 0 && (
                        <Badge className="bg-teal-600 text-white text-[10px] px-1.5 py-0">New</Badge>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">{c.subject}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{c.last_message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                  <span>{c.last_message_at}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-teal-600" /> New Message to Care Team
              </h2>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleStart} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Recipient</label>
                <Input value="Doctor (Attending Physician)" disabled className="bg-slate-50 text-xs text-slate-500" />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Question regarding recent blood pressure reading"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Message Content</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry or observation..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNewModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5">
                  <Send className="h-3.5 w-3.5" /> Send Message
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
