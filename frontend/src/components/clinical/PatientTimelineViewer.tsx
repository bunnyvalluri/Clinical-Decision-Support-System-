"use client";

import * as React from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  FileCheck,
  FileSpreadsheet,
  FileText,
  HeartPulse,
  Info,
  Layers,
  MessageSquareCheck,
  RotateCcw,
  Shield,
  Stethoscope,
  TrendingUp,
  User,
  UserCheck,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import apiClient from "@/services/apiClient";

export interface TimelineEvent {
  event_id: string;
  event_type: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  source: string;
  severity: string;
  correlation_id: string;
  authorization_scope?: string;
  provenance?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PatientTimelineViewerProps {
  patientId: string;
  patientName?: string;
  mrn?: string;
}

const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badge: string }
> = {
  // Phase 3 Taxonomy
  PATIENT_ADMISSION: { label: "Admission", icon: User, color: "text-slate-700 bg-slate-100", badge: "bg-slate-100 text-slate-800 border-slate-300" },
  ENCOUNTER: { label: "Encounter", icon: User, color: "text-slate-700 bg-slate-100", badge: "bg-slate-100 text-slate-800 border-slate-300" },
  VITAL_OBSERVATION: { label: "Vitals", icon: HeartPulse, color: "text-sky-700 bg-sky-100", badge: "bg-sky-50 text-sky-800 border-sky-200" },
  VITAL: { label: "Vitals", icon: HeartPulse, color: "text-sky-700 bg-sky-100", badge: "bg-sky-50 text-sky-800 border-sky-200" },
  OBSERVATION: { label: "Observation", icon: HeartPulse, color: "text-blue-700 bg-blue-100", badge: "bg-blue-50 text-blue-800 border-blue-200" },
  RISK_PREDICTION: { label: "Risk Prediction", icon: Activity, color: "text-indigo-700 bg-indigo-100", badge: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  CLINICAL_REVIEW: { label: "Physician Review", icon: Stethoscope, color: "text-emerald-700 bg-emerald-100", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  PREDICTION_REVIEW: { label: "Prediction Review", icon: Stethoscope, color: "text-emerald-700 bg-emerald-100", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  PREDICTION_OVERRIDE: { label: "Clinician Override", icon: RotateCcw, color: "text-amber-700 bg-amber-100", badge: "bg-amber-50 text-amber-800 border-amber-200" },
  PREDICTION_FEEDBACK: { label: "Prediction Feedback", icon: MessageSquareCheck, color: "text-teal-700 bg-teal-100", badge: "bg-teal-50 text-teal-800 border-teal-200" },
  NURSE_TRIAGE: { label: "Nurse Triage", icon: UserCheck, color: "text-purple-700 bg-purple-100", badge: "bg-purple-50 text-purple-800 border-purple-200" },
  ESCALATION: { label: "Risk Escalation", icon: AlertTriangle, color: "text-amber-700 bg-amber-100", badge: "bg-amber-50 text-amber-800 border-amber-200" },
  CLINICAL_ALERT: { label: "Clinical Alert", icon: AlertCircle, color: "text-rose-700 bg-rose-100", badge: "bg-rose-50 text-rose-800 border-rose-200" },
  AI_INTERACTION: { label: "AI Safety Gate", icon: Shield, color: "text-cyan-700 bg-cyan-100", badge: "bg-cyan-50 text-cyan-800 border-cyan-200" },
  DATA_QUALITY_EVENT: { label: "Data Quality", icon: AlertCircle, color: "text-orange-700 bg-orange-100", badge: "bg-orange-50 text-orange-800 border-orange-200" },
  FHIR_IMPORT: { label: "FHIR Import", icon: Database, color: "text-blue-700 bg-blue-100", badge: "bg-blue-50 text-blue-800 border-blue-200" },
  FHIR_UPDATE: { label: "FHIR Sync", icon: Database, color: "text-blue-700 bg-blue-100", badge: "bg-blue-50 text-blue-800 border-blue-200" },
  GUIDELINE_APPLIED: { label: "Guideline Applied", icon: FileText, color: "text-teal-700 bg-teal-100", badge: "bg-teal-50 text-teal-800 border-teal-200" },
};

export function PatientTimelineViewer({ patientId, patientName, mrn }: PatientTimelineViewerProps) {
  const [events, setEvents] = React.useState<TimelineEvent[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");

  const fetchTimeline = React.useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      // Primary: /api/v1/patients/{id}/timeline/, fallback: /api/patient-timeline/?patient_id=...
      let responseEvents: TimelineEvent[] = [];
      try {
        const res = await apiClient.get(`/api/v1/patients/${patientId}/timeline/`, {
          params: { limit: 100 },
        });
        responseEvents = res.data?.events || [];
      } catch {
        const fallback = await apiClient.get("/api/patient-timeline/", {
          params: { patient_id: patientId, max_events: 100 },
        });
        responseEvents = fallback.data?.events || [];
      }
      setEvents(responseEvents);
    } catch (err: any) {
      console.error("Failed to load patient timeline:", err);
      setError("Unable to load clinical timeline from Neon PostgreSQL.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  React.useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const filteredEvents = React.useMemo(() => {
    if (selectedCategory === "ALL") return events;
    if (selectedCategory === "VITALS") {
      return events.filter((e) =>
        ["VITAL", "VITAL_OBSERVATION", "OBSERVATION"].includes(e.event_type)
      );
    }
    if (selectedCategory === "PREDICTIONS") {
      return events.filter((e) =>
        ["RISK_PREDICTION", "MODEL_EVENT"].includes(e.event_type)
      );
    }
    if (selectedCategory === "REVIEWS") {
      return events.filter((e) =>
        ["CLINICAL_REVIEW", "PREDICTION_REVIEW", "PREDICTION_OVERRIDE", "PREDICTION_FEEDBACK"].includes(e.event_type)
      );
    }
    if (selectedCategory === "ALERTS") {
      return events.filter((e) =>
        ["CLINICAL_ALERT", "ESCALATION"].includes(e.event_type)
      );
    }
    if (selectedCategory === "AUDIT") {
      return events.filter((e) =>
        ["AI_INTERACTION", "DATA_QUALITY_EVENT", "FHIR_IMPORT", "FHIR_UPDATE", "CONSENT_EVENT"].includes(e.event_type)
      );
    }
    return events.filter((e) => e.event_type === selectedCategory);
  }, [events, selectedCategory]);

  const categories = [
    { id: "ALL", label: `All Events (${events.length})` },
    { id: "VITALS", label: "Vitals & Labs" },
    { id: "PREDICTIONS", label: "ML Predictions" },
    { id: "REVIEWS", label: "Reviews & Overrides" },
    { id: "ALERTS", label: "Alerts & Escalations" },
    { id: "AUDIT", label: "Safety & Provenance" },
  ];

  return (
    <Card className="border border-slate-200 bg-white shadow-xs">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-sky-700" />
              <CardTitle className="text-lg font-bold text-slate-900">
                Unified Longitudinal Clinical Timeline
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Authoritative chronological trail of admissions, vital encounters, risk inferences, and doctor sign-offs.
              {mrn && <span className="ml-2 font-mono font-bold text-slate-800">MRN: {mrn}</span>}
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={fetchTimeline} disabled={loading} className="h-8 text-xs gap-1.5 border-slate-300">
            <Clock className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Timeline
          </Button>
        </div>

        {/* Filter Categories */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={`h-7 text-xs ${
                selectedCategory === cat.id
                  ? "bg-slate-900 text-white font-medium shadow-xs"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-700 border-t-transparent mb-3" />
            <p className="text-xs font-medium text-slate-700">Loading chronological timeline from PostgreSQL...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-lg">
            <AlertTriangle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
            <p className="text-sm font-semibold text-rose-900">{error}</p>
            <Button size="sm" variant="outline" onClick={fetchTimeline} className="mt-3 border-rose-300">
              Retry
            </Button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Calendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No events recorded</p>
            <p className="text-xs mt-1 text-slate-500">No clinical events match the selected filter category.</p>
          </div>
        ) : (
          <div className="relative pl-6 before:absolute before:bottom-0 before:left-2.5 before:top-2 before:w-0.5 before:bg-slate-200">
            <div className="space-y-6">
              {filteredEvents.map((evt, idx) => {
                const config = EVENT_TYPE_CONFIG[evt.event_type] || {
                  label: evt.event_type,
                  icon: Activity,
                  color: "text-slate-600 bg-slate-100",
                  badge: "bg-slate-100 text-slate-800 border-slate-200",
                };
                const IconComponent = config.icon;
                const formattedTime = new Date(evt.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });

                return (
                  <div key={evt.event_id || idx} className="relative group">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-6 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-xs ${config.color}`}
                    >
                      <IconComponent className="h-3 w-3" />
                    </div>

                    {/* Event Content Card */}
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-slate-300">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] uppercase font-semibold ${config.badge}`}>
                            {config.label}
                          </Badge>
                          <h4 className="text-sm font-bold text-slate-900">{evt.title}</h4>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">{formattedTime}</span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mt-1">{evt.description}</p>

                      {/* Event Metadata & Provenance Row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-100 mt-2">
                        <span>Actor: <strong className="text-slate-700">{evt.actor}</strong></span>
                        <span>Source: <strong className="text-slate-700">{evt.source}</strong></span>
                        {evt.severity && evt.severity !== "NORMAL" && (
                          <span className="font-semibold text-rose-700">
                            Severity: {evt.severity}
                          </span>
                        )}
                        {evt.authorization_scope && (
                          <span className="text-slate-400">
                            Scope: <span className="font-mono text-[10px]">{evt.authorization_scope}</span>
                          </span>
                        )}
                        {evt.provenance?.model_version && (
                          <span className="text-slate-500">
                            Model: <strong className="text-slate-700">{evt.provenance.model_name} (v{evt.provenance.model_version})</strong>
                          </span>
                        )}
                        {evt.provenance?.fhir_resource_type && (
                          <span className="text-blue-600">
                            FHIR: {evt.provenance.fhir_resource_type}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-400 ml-auto">
                          ID: {evt.correlation_id ? evt.correlation_id.slice(0, 8) : evt.event_id?.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
