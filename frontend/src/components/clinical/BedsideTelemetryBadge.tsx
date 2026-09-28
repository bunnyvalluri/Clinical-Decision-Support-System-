"use client";

import React, { useEffect, useRef } from "react";

export interface BedsideTelemetryBadgeProps {
  label?: string;
  bpm?: number;
  isSpike?: boolean;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * BedsideTelemetryBadge
 * Authentic clinical telemetry pill featuring Lead-II ECG sweep monitor,
 * live status pulse, high-DPI canvas rendering, and smooth physiological waveforms.
 */
export function BedsideTelemetryBadge({
  label = "BEDSIDE TELEMETRY",
  bpm = 74,
  isSpike,
  className = "",
  width = 136,
  height = 30,
}: BedsideTelemetryBadgeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isAlarm = isSpike !== undefined ? isSpike : (bpm > 100 || bpm < 50);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    
    // Scale canvas for crystal-clear retina rendering
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    const w = canvas.width;
    const h = canvas.height;
    const midY = h / 2;
    const amplitude = h * 0.42;

    // Buffer to hold continuous waveform points
    const points: number[] = new Array(Math.ceil(w)).fill(midY);
    let sweepX = 0;
    let cyclePhase = 0;

    // Calibrate frames based on BPM (60-100 BPM physiological cadence)
    const effectiveBpm = Math.max(40, Math.min(180, bpm));
    const framesPerBeat = (3600 / effectiveBpm) * 0.75;
    const phaseDelta = 1 / framesPerBeat;
    const pxPerFrame = Math.max(1.5 * dpr, (w / (framesPerBeat * 1.8)));

    const render = () => {
      // Advance waveform generation
      for (let p = 0; p < Math.ceil(pxPerFrame); p++) {
        cyclePhase = (cyclePhase + phaseDelta / pxPerFrame) % 1;

        // Accurate Lead-II ECG mathematical model
        let yOffset = 0;

        if (cyclePhase >= 0.08 && cyclePhase < 0.18) {
          // P-Wave (atrial depolarization): smooth rounded dome
          const pAngle = ((cyclePhase - 0.08) / 0.1) * Math.PI;
          yOffset = -Math.sin(pAngle) * 0.18;
        } else if (cyclePhase >= 0.22 && cyclePhase < 0.25) {
          // Q-Wave: slight downward deflection
          const qAngle = ((cyclePhase - 0.22) / 0.03) * Math.PI;
          yOffset = Math.sin(qAngle) * 0.12;
        } else if (cyclePhase >= 0.25 && cyclePhase < 0.31) {
          // R-Wave: sharp, tall ventricular spike
          const rPos = (cyclePhase - 0.25) / 0.06;
          if (rPos < 0.45) {
            yOffset = -(rPos / 0.45) * 0.95; // Up to peak
          } else {
            yOffset = -0.95 + ((rPos - 0.45) / 0.55) * 1.35; // Down past baseline into S
          }
        } else if (cyclePhase >= 0.31 && cyclePhase < 0.35) {
          // S-Wave recovery to baseline
          const sPos = (cyclePhase - 0.31) / 0.04;
          yOffset = 0.4 * (1 - sPos);
        } else if (cyclePhase >= 0.46 && cyclePhase < 0.66) {
          // T-Wave (ventricular repolarization): smooth asymmetric dome
          const tPos = (cyclePhase - 0.46) / 0.2;
          const tAngle = tPos * Math.PI;
          yOffset = -Math.sin(tAngle) * 0.32;
        } else {
          // Isoelectric baseline with tiny physiological micro-variation
          yOffset = (Math.sin(sweepX * 0.1) * 0.02);
        }

        const currentY = midY + yOffset * amplitude;
        const currentIdx = Math.floor(sweepX);
        if (currentIdx >= 0 && currentIdx < points.length) {
          points[currentIdx] = currentY;
        }

        sweepX = (sweepX + 1) % w;
      }

      // Draw background
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, w, h);

      // Subtle millimeter grid
      ctx.lineWidth = 0.75 * dpr;
      ctx.strokeStyle = isAlarm
        ? "rgba(244, 63, 94, 0.12)"
        : "rgba(16, 185, 129, 0.12)";
      const gridSize = 10 * dpr;

      ctx.beginPath();
      for (let x = 0; x < w; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // ECG Waveform stroke
      const strokeColor = isAlarm ? "#f43f5e" : "#10b981";
      ctx.lineWidth = 1.6 * dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = strokeColor;
      ctx.shadowColor = isAlarm ? "rgba(244, 63, 94, 0.6)" : "rgba(16, 185, 129, 0.6)";
      ctx.shadowBlur = 3 * dpr;

      ctx.beginPath();
      let started = false;
      const gapSize = 18 * dpr; // Blanking sweep cursor gap

      for (let x = 0; x < w; x++) {
        const distFromSweep = (x - sweepX + w) % w;
        if (distFromSweep < gapSize) {
          started = false;
          continue;
        }

        const y = points[x] || midY;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw glow dot at the leading sweep cursor
      const cursorX = sweepX;
      const cursorY = points[Math.floor(cursorX)] || midY;

      // Glow halo
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, 3.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = isAlarm ? "rgba(244, 63, 94, 0.4)" : "rgba(52, 211, 153, 0.4)";
      ctx.fill();

      // Bright core dot
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, 1.8 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = isAlarm ? "#fda4af" : "#a7f3d0";
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [bpm, isAlarm, width, height]);

  return (
    <div
      className={`inline-flex items-center gap-3 bg-slate-950/95 hover:bg-slate-900/95 px-3 py-1.5 rounded-xl border ${
        isAlarm
          ? "border-rose-800/60 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
          : "border-slate-800 shadow-[0_0_12px_rgba(16,185,129,0.08)]"
      } transition-all duration-300 backdrop-blur-sm select-none ${className}`}
    >
      <div className="flex flex-col shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isAlarm ? "bg-rose-400" : "bg-emerald-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                isAlarm ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
          </span>
          <span
            className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
              isAlarm ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {label}
          </span>
        </div>
        <span className="font-mono text-sm font-black text-white leading-tight flex items-baseline gap-1 mt-0.5">
          {bpm}
          <span className="text-[9px] font-semibold text-slate-400">BPM</span>
        </span>
      </div>

      <div
        className="relative rounded-lg overflow-hidden border border-slate-800/80 bg-[#090d16] shrink-0"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: `${width}px`, height: `${height}px` }}
          className="block"
        />
      </div>
    </div>
  );
}

export default BedsideTelemetryBadge;
