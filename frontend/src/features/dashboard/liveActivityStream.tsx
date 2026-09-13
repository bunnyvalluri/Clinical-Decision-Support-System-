"use client";

import { useState } from "react";
import { AlertCircle, Clock, Cpu, ShieldAlert, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { RiskAlertPayload, WSEvent } from "@/types";

interface PredictionItem {
  id: string;
  patient_id: string;
  risk_level: string;
  probability: number;
  model: string;
  time: string;
}

export function LiveActivityStream() {
  const [activeAlert, setActiveAlert] = useState<RiskAlertPayload | null>(null);
  const [recentPredictions, setRecentPredictions] = useState<PredictionItem[]>([
    {
      id: "demo-pred-1",
      patient_id: "MRN-39201",
      risk_level: "LOW",
      probability: 0.082,
      model: "Random Forest v1.0.0",
      time: "Just now",
    },
  ]);

  // Listen for global clinical risk alerts
  useWebSocket({
    path: "alerts/",
    handlers: {
      RISK_ALERT: (data: WSEvent) => {
        const alert = (data.payload || data) as unknown as RiskAlertPayload;
        setActiveAlert(alert);
      },
      risk_alert: (data: WSEvent) => {
        const alert = (data.payload || data) as unknown as RiskAlertPayload;
        setActiveAlert(alert);
      },
    },
  });

  // Listen for real-time predictions on dashboard
  useWebSocket({
    path: "dashboard/",
    handlers: {
      PREDICTION_CREATED: (data: WSEvent) => {
        const pred = (data.payload || data) as Record<string, unknown>;
        const newItem: PredictionItem = {
          id: (pred.prediction_id as string) || `pred-${Math.random()}`,
          patient_id: pred.patient_id ? String(pred.patient_id).slice(0, 8) + "..." : "Patient",
          risk_level: (pred.risk_level as string) || "MEDIUM",
          probability: Number(pred.probability) || 0.5,
          model: pred.model_name ? `${pred.model_name} ${pred.model_version || ""}` : "Ensemble ML",
          time: new Date().toLocaleTimeString(),
        };
        setRecentPredictions((prev) => [newItem, ...prev.slice(0, 4)]);
      },
      prediction_created: (data: WSEvent) => {
        const pred = (data.payload || data) as Record<string, unknown>;
        const newItem: PredictionItem = {
          id: (pred.prediction_id as string) || `pred-${Math.random()}`,
          patient_id: pred.patient_id ? String(pred.patient_id).slice(0, 8) + "..." : "Patient",
          risk_level: (pred.risk_level as string) || "MEDIUM",
          probability: Number(pred.probability) || 0.5,
          model: pred.model_name ? `${pred.model_name} ${pred.model_version || ""}` : "Ensemble ML",
          time: new Date().toLocaleTimeString(),
        };
        setRecentPredictions((prev) => [newItem, ...prev.slice(0, 4)]);
      },
    },
  });

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return <Badge variant="critical">CRITICAL RISK</Badge>;
      case "HIGH":
        return <Badge variant="high">HIGH RISK</Badge>;
      case "MEDIUM":
        return <Badge variant="medium">MEDIUM RISK</Badge>;
      default:
        return <Badge variant="low">LOW RISK</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* High/Critical Risk Alert Banner */}
      {activeAlert && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-rose-900">
                  CRITICAL CLINICAL ALERT
                </span>
                <Badge variant="critical" className="text-xs px-2 py-0">
                  {activeAlert.risk_level}
                </Badge>
              </div>
              <p className="text-xs text-slate-700 mt-1">
                {activeAlert.message || `Elevated risk probability (${((activeAlert.probability || 0) * 100).toFixed(1)}%) detected for patient ${activeAlert.patient_mrn || activeAlert.patient_id}.`}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                Broadcasted at {activeAlert.timestamp ? new Date(activeAlert.timestamp).toLocaleTimeString() : "Recent"} via Redis Channels
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveAlert(null)}
            className="text-xs text-slate-500 hover:text-slate-800 p-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Live Stream Card */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Cpu className="h-4 w-4 text-emerald-600" />
              Live Prediction Event Stream
            </CardTitle>
            <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50 flex items-center gap-1 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              WebSocket Active
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Real-time inference events broadcasted from active ML models without page refresh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentPredictions.map((pred) => (
              <div
                key={pred.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-white border border-slate-200 text-emerald-600 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        Patient: {pred.patient_id}
                      </span>
                      {getRiskBadge(pred.risk_level)}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Probability: {(pred.probability * 100).toFixed(1)}% • {pred.model}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                  <Clock className="h-3 w-3" />
                  <span>{pred.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
