"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

const emptySubscribe = () => () => {};

// SSR-safe mounting wrapper
export function ClientChartWrapper({ children, height = 240 }: { children: React.ReactNode; height?: number }) {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isMounted) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 animate-pulse text-xs text-slate-400 font-mono"
      >
        Initializing Telemetry Engine...
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipItem {
  color?: string;
  stroke?: string;
  fill?: string;
  name?: string;
  value?: string | number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg text-xs backdrop-blur-md">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        {payload.map((item: TooltipItem, idx: number) => (
          <div key={idx} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color || item.stroke || item.fill }}
            />
            <span className="text-slate-500 capitalize">{item.name}:</span>
            <span className="font-mono font-bold text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export interface ActivityPoint {
  time: string;
  predictions: number;
  criticalAlerts?: number;
}

export function PredictionActivityChart({ data }: { data: ActivityPoint[] }) {
  return (
    <ClientChartWrapper height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
          </linearGradient>
          <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="predictions"
          name="Assessments"
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#predGrad)"
        />
        {data.some((d) => (d.criticalAlerts ?? 0) > 0) && (
          <Area
            type="monotone"
            dataKey="criticalAlerts"
            name="Critical Alerts"
            stroke="#f43f5e"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#alertGrad)"
          />
        )}
      </AreaChart>
    </ClientChartWrapper>
  );
}

export interface RiskDistributionItem {
  risk: string;
  count: number;
  color: string;
}

export function RiskDistributionChart({ data }: { data: RiskDistributionItem[] }) {
  return (
    <ClientChartWrapper height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="risk" stroke="#64748b" fontSize={11} tickLine={false} />
        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Patients" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ClientChartWrapper>
  );
}

export interface ShapFactor {
  feature: string;
  attribution: number; // positive increases risk, negative decreases
}

export function ShapWaterChart({ factors }: { factors: ShapFactor[] }) {
  const chartData = factors.map((f) => ({
    feature: f.feature,
    impact: Math.round(f.attribution * 1000) / 1000,
    color: f.attribution >= 0 ? "#f43f5e" : "#10b981",
  }));

  return (
    <ClientChartWrapper height={280}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 20, left: 60, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
        <YAxis
          type="category"
          dataKey="feature"
          stroke="#475569"
          fontSize={11}
          tickLine={false}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="impact" name="SHAP Attribution" radius={[4, 4, 4, 4]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ClientChartWrapper>
  );
}

export interface VitalsTrendPoint {
  time: string;
  heartRate: number;
  systolicBP: number;
  spo2: number;
}

export function VitalsTrendChart({ data }: { data: VitalsTrendPoint[] }) {
  return (
    <ClientChartWrapper height={240}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
        <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[50, 180]} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="heartRate"
          name="Heart Rate (bpm)"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="systolicBP"
          name="Systolic BP (mmHg)"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="spo2"
          name="SpO2 (%)"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ClientChartWrapper>
  );
}
