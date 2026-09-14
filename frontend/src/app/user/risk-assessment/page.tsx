"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import apiClient from "@/services/apiClient";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

const INITIAL_ASSESSMENTS = [
  {
    id: "assess-001",
    created_at: "2026-09-13 14:48",
    status: "COMPLETED",
    risk_level: "MEDIUM",
    probability: 0.42,
    prediction_id: "pred-demo-01",
    symptoms: ["Mild exertional fatigue", "Occasional chest tightness"],
  },
  {
    id: "assess-002",
    created_at: "2026-07-20 10:15",
    status: "COMPLETED",
    risk_level: "HIGH",
    probability: 0.68,
    prediction_id: "pred-demo-02",
    symptoms: ["Substernal pressure with exercise"],
  },
];

interface RiskAssessmentItem {
  id: string;
  created_at: string;
  status: string;
  risk_level: string;
  probability: number;
  prediction_id: string;
  symptoms: string[];
}

export default function PatientRiskAssessmentListPage() {
  const [assessments, setAssessments] = React.useState<RiskAssessmentItem[]>(INITIAL_ASSESSMENTS);

  const fetchAssessments = React.useCallback(async () => {
    try {
      const res = await apiClient.get("/user/risk-assessments/");
      if (res.data && res.data.length > 0) {
        setAssessments(res.data);
      }
    } catch {
      // Retain fallback data on network error
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await apiClient.get("/user/risk-assessments/");
        if (isMounted && res.data && res.data.length > 0) {
          setAssessments(res.data);
        }
      } catch {
        // Retain fallback data on network error
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time listener
  useUserWebSocket((evt) => {
    if (evt.event_type === "user.risk_assessment.completed") {
      fetchAssessments();
    }
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-teal-600" />
            AI Health Risk Assessments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Machine learning clinical decision-support evaluations based on physiological markers.
          </p>
        </div>
        <Link href="/user/risk-assessment/new">
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Start New Assessment
          </Button>
        </Link>
      </div>

      {/* Safety Banner */}
      <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 flex items-start gap-3">
        <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
        <p className="text-xs text-teal-900 leading-relaxed">
          <strong>Decision Support Framework:</strong> Assessments run through hospital-approved machine learning models (Random Forest, SVM, AdaBoost). Predictions indicate calculated risk probabilities and are reviewed by attending clinicians when elevated.
        </p>
      </div>

      <div className="space-y-3">
        {assessments.map((a) => (
          <Card key={a.id} className="bg-white border-slate-200 shadow-sm hover:border-teal-300 transition-all">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs font-bold ${
                      a.risk_level === "HIGH" || a.risk_level === "CRITICAL"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : a.risk_level === "MEDIUM"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {a.risk_level || "EVALUATED"} RISK ESTIMATE
                  </Badge>
                  <span className="text-xs text-slate-400">· {a.created_at}</span>
                  <span className="text-xs text-slate-500 font-medium">
                    (Estimated probability: {((a.probability || 0.4) * 100).toFixed(1)}%)
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  Reported Factors: {Array.isArray(a.symptoms) ? a.symptoms.join(", ") : "Resting BP, Cholesterol, Heart Rate"}
                </p>

                <span className="text-[11px] font-medium text-slate-400">
                  Status: <strong className="text-slate-700">{a.status}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/user/risk-assessment/${a.id}`}>
                  <Button variant="ghost" size="sm" className="text-xs text-teal-700 hover:text-teal-800 gap-1">
                    View Assessment <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
