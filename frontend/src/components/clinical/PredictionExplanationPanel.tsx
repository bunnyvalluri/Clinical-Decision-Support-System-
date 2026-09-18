"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, BookOpen, Info, ShieldCheck } from "lucide-react";

export interface ExplanationFeature {
  feature: string;
  value?: any;
  contribution: number;
  direction?: "RISK_INCREASING" | "PROTECTIVE" | "NEUTRAL" | string;
  explanation?: string;
  description?: string;
}

export interface PredictionExplanationPanelProps {
  method?: string;
  baselineValue?: number;
  features: ExplanationFeature[];
  disclaimer?: string;
  className?: string;
}

export function PredictionExplanationPanel({
  method = "TreeSHAP",
  baselineValue,
  features,
  disclaimer = "This is a MODEL EXPLANATION, not a medical diagnosis. Feature contributions represent statistical associations and do not prove medical causation.",
  className,
}: PredictionExplanationPanelProps) {
  if (!features || features.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg">
        No factor attribution weights available for this assessment.
      </div>
    );
  }

  // Calculate max contribution for scale normalization
  const maxAbsContrib = Math.max(...features.map((f) => Math.abs(f.contribution)), 0.001);

  return (
    <Card className={cn("border border-slate-200 bg-white shadow-xs", className)}>
      <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900">
                Model Explainability & Feature Contribution
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono bg-blue-50 text-blue-700 border-blue-200">
                {method}
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Individualized factor attributions computed by {method} relative to population baseline.
            </CardDescription>
          </div>
          {baselineValue !== undefined && (
            <div className="text-right text-xs">
              <span className="text-slate-500 block">Baseline Expected Value</span>
              <span className="font-mono font-semibold text-slate-800">{baselineValue.toFixed(3)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Attribution Waterfall Bars */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Individual Feature Drivers
          </span>
          <div className="space-y-2.5">
            {features.map((feat, idx) => {
              const isPositive = feat.contribution > 0;
              const barWidth = Math.min(100, Math.round((Math.abs(feat.contribution) / maxAbsContrib) * 100));

              return (
                <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 text-xs space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{feat.feature}</span>
                      {feat.value !== undefined && (
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          Value: {String(feat.value)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      {isPositive ? (
                        <span className="inline-flex items-center text-rose-600 font-semibold">
                          <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> +{feat.contribution.toFixed(4)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-emerald-600 font-semibold">
                          <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" /> {feat.contribution.toFixed(4)}
                        </span>
                      )}
                      <span className="text-slate-400 text-[10px]">
                        ({isPositive ? "Risk Elevating" : "Protective Factor"})
                      </span>
                    </div>
                  </div>

                  {/* Accessible Visual Bar */}
                  <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden flex">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        isPositive ? "bg-rose-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  {/* Clinician Textual Interpretation */}
                  {(feat.explanation || feat.description) && (
                    <p className="text-[11px] text-slate-600 leading-normal pt-0.5">
                      {feat.explanation || feat.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinical Disclaimer invariant */}
        <div className="flex items-start gap-2 bg-blue-50/60 p-3 rounded-lg border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Interpretability Notice: </strong>
            {disclaimer}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
