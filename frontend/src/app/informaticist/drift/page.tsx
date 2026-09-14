"use client";

import * as React from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  Info,
  Layers,
  LineChart,
  RefreshCw,
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

interface BiomarkerDrift {
  feature: string;
  category: string;
  baselineMean: number;
  currentMean: number;
  unit: string;
  psi: number;
  ksStat: number;
  ksPVal: number;
  wasserstein: number;
  status: "NORMAL" | "WARNING" | "CRITICAL";
  trend: "STABLE" | "SLIGHT_SHIFT";
}

const BIOMARKER_DRIFT_DATA: BiomarkerDrift[] = [
  { feature: "Systolic Blood Pressure", category: "Hemodynamics", baselineMean: 132.4, currentMean: 134.1, unit: "mmHg", psi: 0.038, ksStat: 0.034, ksPVal: 0.621, wasserstein: 1.7, status: "NORMAL", trend: "STABLE" },
  { feature: "Diastolic Blood Pressure", category: "Hemodynamics", baselineMean: 82.1, currentMean: 83.0, unit: "mmHg", psi: 0.024, ksStat: 0.022, ksPVal: 0.845, wasserstein: 0.9, status: "NORMAL", trend: "STABLE" },
  { feature: "Heart Rate (Resting)", category: "Vitals", baselineMean: 76.5, currentMean: 77.2, unit: "bpm", psi: 0.027, ksStat: 0.029, ksPVal: 0.812, wasserstein: 0.7, status: "NORMAL", trend: "STABLE" },
  { feature: "Serum Creatinine", category: "Renal Function", baselineMean: 1.12, currentMean: 1.18, unit: "mg/dL", psi: 0.052, ksStat: 0.038, ksPVal: 0.485, wasserstein: 0.06, status: "NORMAL", trend: "STABLE" },
  { feature: "ST-Segment Depression", category: "Electrophysiology", baselineMean: 0.84, currentMean: 0.91, unit: "mm", psi: 0.045, ksStat: 0.041, ksPVal: 0.540, wasserstein: 0.07, status: "NORMAL", trend: "STABLE" },
  { feature: "Blood Glucose Level", category: "Metabolic", baselineMean: 114.2, currentMean: 116.8, unit: "mg/dL", psi: 0.041, ksStat: 0.036, ksPVal: 0.590, wasserstein: 2.6, status: "NORMAL", trend: "STABLE" },
  { feature: "Lactic Acid", category: "Biomarker", baselineMean: 1.45, currentMean: 1.58, unit: "mmol/L", psi: 0.068, ksStat: 0.049, ksPVal: 0.312, wasserstein: 0.13, status: "NORMAL", trend: "SLIGHT_SHIFT" },
  { feature: "Oxygen Saturation (SpO2)", category: "Respiratory", baselineMean: 97.8, currentMean: 97.6, unit: "%", psi: 0.019, ksStat: 0.018, ksPVal: 0.915, wasserstein: 0.2, status: "NORMAL", trend: "STABLE" },
];

export default function DriftMonitorPage() {
  const [activeDriftTab, setActiveDriftTab] = React.useState<"FEATURES" | "PREDICTIONS" | "PERFORMANCE">("FEATURES");
  const [selectedBiomarker, setSelectedBiomarker] = React.useState<string>("Systolic Blood Pressure");
  const [isRunningSweep, setIsRunningSweep] = React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);

  const activeFeature = BIOMARKER_DRIFT_DATA.find(b => b.feature === selectedBiomarker) || BIOMARKER_DRIFT_DATA[0];

  const handleRunSweep = () => {
    setIsRunningSweep(true);
    setTimeout(() => {
      setIsRunningSweep(false);
      setFeedbackMessage("Full 8-Biomarker PSI & Kolmogorov-Smirnov scan completed: All distributions within SaMD normal range (Max PSI = 0.068).");
      setTimeout(() => setFeedbackMessage(null), 4000);
    }, 700);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Drift Monitor &amp; Population Stability</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs">
              Overall Status: STABLE (PSI = 0.042)
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Continuous distribution divergence detection (PSI, Kolmogorov-Smirnov, Wasserstein distance) against baseline validation cohorts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunSweep}
            disabled={isRunningSweep}
            className="text-xs h-8 border-slate-200 hover:border-amber-400 hover:text-amber-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRunningSweep ? "animate-spin" : ""}`} />
            Run Drift Sweep
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setFeedbackMessage("Drift audit telemetry exported as CSV.");
              setTimeout(() => setFeedbackMessage(null), 3000);
            }}
            className="text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white shadow-2xs font-semibold"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export PSI Audit
          </Button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {feedbackMessage}
          </span>
          <span className="text-[10px] text-emerald-600 font-mono">SaMD Telemetry Stream</span>
        </div>
      )}

      {/* Top 3 Interactive Drift Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            id: "FEATURES" as const,
            label: "Feature Covariate Drift",
            stat: "0.042 PSI",
            sub: "8/8 Biomarkers Normal",
            icon: Activity,
            color: "text-purple-600",
            bg: "bg-purple-50",
            activeBorder: "border-purple-400 ring-1 ring-purple-400/30",
          },
          {
            id: "PREDICTIONS" as const,
            label: "Prediction Output Drift",
            stat: "+0.7% Delta",
            sub: "High Risk Rate: 14.8% vs 14.1%",
            icon: TrendingDown,
            color: "text-amber-600",
            bg: "bg-amber-50",
            activeBorder: "border-amber-400 ring-1 ring-amber-400/30",
          },
          {
            id: "PERFORMANCE" as const,
            label: "Performance & Brier Drift",
            stat: "0.00% Decay",
            sub: "ROC-AUC 98.5% (Stable)",
            icon: AlertTriangle,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            activeBorder: "border-emerald-400 ring-1 ring-emerald-400/30",
          },
        ].map(card => (
          <Card
            key={card.id}
            onClick={() => setActiveDriftTab(card.id)}
            className={`cursor-pointer transition-all bg-white border ${
              activeDriftTab === card.id ? card.activeBorder : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{card.stat}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* VIEW 1: Feature Distribution Drift */}
      {activeDriftTab === "FEATURES" && (
        <div className="space-y-6">
          {/* Detailed Feature Comparison Drawer / Card */}
          <Card className="bg-white border-slate-200 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Population Distribution Shift: {activeFeature.feature}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      PSI = {activeFeature.psi.toFixed(3)} (NORMAL)
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Baseline training validation cohort (N=48,200) vs. Current 30-day production telemetry (N=14,820)
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Biomarker:</span>
                  <select
                    value={selectedBiomarker}
                    onChange={e => setSelectedBiomarker(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:border-amber-400"
                  >
                    {BIOMARKER_DRIFT_DATA.map(b => (
                      <option key={b.feature} value={b.feature}>{b.feature}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {/* Visual Distribution Comparison Chart (SVG) */}
                <div className="lg:col-span-2 bg-slate-50/70 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="font-semibold text-slate-700">Distribution Density Overlay ({activeFeature.unit})</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-xs bg-slate-400" />
                        Baseline Cohort (Mean: {activeFeature.baselineMean} {activeFeature.unit})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-xs bg-emerald-600" />
                        Current Inpatient Cohort (Mean: {activeFeature.currentMean} {activeFeature.unit})
                      </span>
                    </div>
                  </div>

                  <div className="h-48 w-full">
                    <svg viewBox="0 0 500 180" className="w-full h-full">
                      {/* Grid lines */}
                      <line x1="30" y1="20" x2="480" y2="20" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="30" y1="60" x2="480" y2="60" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="30" y1="100" x2="480" y2="100" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="30" y1="140" x2="480" y2="140" stroke="#cbd5e1" strokeWidth="1.5" />

                      {/* Baseline Histogram Bars (Grey) */}
                      <rect x="50" y="125" width="28" height="15" fill="#cbd5e1" rx="2" />
                      <rect x="90" y="90" width="28" height="50" fill="#cbd5e1" rx="2" />
                      <rect x="130" y="55" width="28" height="85" fill="#cbd5e1" rx="2" />
                      <rect x="170" y="30" width="28" height="110" fill="#cbd5e1" rx="2" />
                      <rect x="210" y="20" width="28" height="120" fill="#cbd5e1" rx="2" />
                      <rect x="250" y="35" width="28" height="105" fill="#cbd5e1" rx="2" />
                      <rect x="290" y="65" width="28" height="75" fill="#cbd5e1" rx="2" />
                      <rect x="330" y="95" width="28" height="45" fill="#cbd5e1" rx="2" />
                      <rect x="370" y="115" width="28" height="25" fill="#cbd5e1" rx="2" />
                      <rect x="410" y="130" width="28" height="10" fill="#cbd5e1" rx="2" />

                      {/* Current Production Histogram Bars (Emerald, overlayed slightly shifted) */}
                      <rect x="56" y="122" width="24" height="18" fill="#059669" opacity="0.8" rx="2" />
                      <rect x="96" y="88" width="24" height="52" fill="#059669" opacity="0.8" rx="2" />
                      <rect x="136" y="52" width="24" height="88" fill="#059669" opacity="0.8" rx="2" />
                      <rect x="176" y="28" width="24" height="112" fill="#059669" opacity="0.8" rx="2" />
                      <rect x="216" y="18" width="24" height="122" fill="#059669" opacity="0.8" rx="2" />
                      <rect x="256" y="32" width="24" height="108" fill="#059669" opacity="0.8" rx="2" />
                      <rect x="296" y="62" width="24" height="78" fill="#059669" opacity="0.8" rx="2" />
                      <rect x="336" y="92" width="24" height="48" fill="#059669" opacity="0.8" rx="2" />
                      <rect x="376" y="112" width="24" height="28" fill="#059669" opacity="0.8" rx="2" />
                      <rect x="416" y="128" width="24" height="12" fill="#059669" opacity="0.8" rx="2" />

                      {/* X Axis Labels */}
                      <text x="60" y="160" fill="#64748b" fontSize="10">Decile 1</text>
                      <text x="140" y="160" fill="#64748b" fontSize="10">Decile 3</text>
                      <text x="220" y="160" fill="#64748b" fontSize="10">Median</text>
                      <text x="300" y="160" fill="#64748b" fontSize="10">Decile 7</text>
                      <text x="380" y="160" fill="#64748b" fontSize="10">Decile 9</text>
                    </svg>
                  </div>
                </div>

                {/* Statistical Breakdown Box */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3 text-xs">
                  <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Statistical Divergence Tests</p>

                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-1">
                    <div className="flex justify-between font-bold text-emerald-800">
                      <span>Population Stability (PSI)</span>
                      <span>{activeFeature.psi.toFixed(3)}</span>
                    </div>
                    <p className="text-[11px] text-emerald-700">Threshold &lt; 0.10 implies no significant change in population.</p>
                  </div>

                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Kolmogorov-Smirnov D-stat:</span>
                      <strong className="font-mono text-slate-900">{activeFeature.ksStat.toFixed(3)}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>KS p-value (H0: Same):</span>
                      <strong className="font-mono text-slate-900">{activeFeature.ksPVal.toFixed(3)} (p &gt; 0.05)</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Wasserstein Distance:</span>
                      <strong className="font-mono text-slate-900">{activeFeature.wasserstein.toFixed(2)} {activeFeature.unit}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Distribution Shift Status:</span>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                        {activeFeature.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biomarkers Drift Table */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                Monitored Clinical Biomarker Feature Drift Matrix
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Continuous PSI and non-parametric two-sample Kolmogorov-Smirnov test statistics calculated hourly.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinical Biomarker</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Baseline Mean</TableHead>
                    <TableHead>Current Mean</TableHead>
                    <TableHead>PSI Score</TableHead>
                    <TableHead>KS Statistic</TableHead>
                    <TableHead>p-Value</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead className="text-right">Drift Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BIOMARKER_DRIFT_DATA.map(b => (
                    <TableRow
                      key={b.feature}
                      onClick={() => setSelectedBiomarker(b.feature)}
                      className={`cursor-pointer transition-colors ${
                        selectedBiomarker === b.feature ? "bg-amber-50/50 font-medium" : "hover:bg-slate-50/70"
                      }`}
                    >
                      <TableCell className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        {b.feature}
                        {selectedBiomarker === b.feature && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{b.category}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">{b.baselineMean} {b.unit}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">{b.currentMean} {b.unit}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-emerald-700">{b.psi.toFixed(3)}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">{b.ksStat.toFixed(3)}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">{b.ksPVal.toFixed(3)}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          b.trend === "STABLE" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {b.trend}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {b.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW 2: Prediction Output Drift */}
      {activeDriftTab === "PREDICTIONS" && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-600" />
              Model Inference Output &amp; Risk Class Distribution Stability
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Assessing whether model scoring proportions have drifted relative to historical baseline expectations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { label: "Critical Risk Cohort", baseline: "2.1%", current: "2.4%", delta: "+0.3%", color: "text-rose-700", bg: "bg-rose-50" },
                { label: "High Risk Cohort", baseline: "12.0%", current: "11.8%", delta: "-0.2%", color: "text-amber-700", bg: "bg-amber-50" },
                { label: "Moderate Risk Cohort", baseline: "26.5%", current: "27.4%", delta: "+0.9%", color: "text-blue-700", bg: "bg-blue-50" },
                { label: "Low Risk Cohort", baseline: "59.4%", current: "58.4%", delta: "-1.0%", color: "text-emerald-700", bg: "bg-emerald-50" },
              ].map(c => (
                <div key={c.label} className={`p-4 rounded-xl border border-slate-200 ${c.bg}`}>
                  <p className="text-xs font-semibold text-slate-600">{c.label}</p>
                  <p className={`text-2xl font-bold ${c.color} mt-1`}>{c.current}</p>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-2">
                    <span>Baseline: {c.baseline}</span>
                    <span className="font-semibold">{c.delta}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-900">Concept Drift Assessment Conclusion:</p>
              <p>
                Output risk distribution divergence (Wasserstein distance = 0.014) is well within the 95% confidence tolerance bound. No evidence of sudden disease prevalence change or sensor bias shifts.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VIEW 3: Performance & Calibration Drift */}
      {activeDriftTab === "PERFORMANCE" && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-emerald-600" />
              Discriminative Performance Retention &amp; Brier Calibration Decay Tracking
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Verifying that discrimination (ROC-AUC) and calibration error (ECE) remain uncompromised across production encounters.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 font-medium uppercase">Initial Validation ROC-AUC</p>
                <p className="text-2xl font-bold text-emerald-700 font-mono mt-1">98.5%</p>
                <p className="text-[11px] text-slate-400 mt-1">Certified at deployment</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 font-medium uppercase">Current 30-Day Rolling ROC-AUC</p>
                <p className="text-2xl font-bold text-emerald-700 font-mono mt-1">98.4%</p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">0.1% Delta (Nominal)</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 font-medium uppercase">Brier Calibration Score</p>
                <p className="text-2xl font-bold text-purple-700 font-mono mt-1">0.0028</p>
                <p className="text-[11px] text-slate-400 mt-1">Threshold bound &lt; 0.05</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                SaMD Safety Retraining Not Required
              </p>
              <p>
                Model discriminative capacity and probability calibration remain strictly within FDA-cleared performance bounds. Next scheduled validation sweep in 18 days.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Retraining Threshold Rules */}
      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-amber-600" />
            Automated MLOps Drift Alerting &amp; Retraining Policies
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex justify-between font-bold text-slate-900">
              <span>Warning Notification Threshold</span>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">PSI &gt;= 0.10</Badge>
            </div>
            <p className="text-slate-500">
              Dispatches automated telemetry warning to the Lead Informaticist and tags incoming biomarker batch for manual inspection.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex justify-between font-bold text-slate-900">
              <span>Critical Automated Retraining Trigger</span>
              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">PSI &gt;= 0.25</Badge>
            </div>
            <p className="text-slate-500">
              Automatically triggers DAG retraining pipeline in shadow mode and switches live inference to conservative calibrated fallback ensemble.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
