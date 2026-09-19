"use client";

import React, { useEffect, useRef } from "react";

interface RealtimeEcgWaveformProps {
  heartRate?: number;
  stDepression?: number;
  showBadge?: boolean;
  theme?: "light" | "dark";
  color?: string;
  className?: string;
}

export function RealtimeEcgWaveform({
  heartRate = 72,
  stDepression = 0,
  showBadge = false,
  theme = "light",
  color,
  className = "",
}: RealtimeEcgWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1));
    let height = (canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      height = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    };

    window.addEventListener("resize", handleResize);

    // Buffer to hold points across the canvas width
    const points: number[] = new Array(Math.ceil(width)).fill(height / 2);
    let sweepX = 0;
    let cyclePhase = 0; // 0 to 1 representing position in a cardiac cycle (P-Q-R-S-T)

    const render = () => {
      // Scale based on pixel ratio
      const dpr = window.devicePixelRatio || 1;
      const baselineY = height / 2;
      const amplitudeScale = (height * 0.42);

      // Advance sweep speed based on heartRate (beats per minute)
      const framesPerBeat = Math.max(15, (3600 / Math.max(40, heartRate)));
      const phaseDelta = 1 / framesPerBeat;

      // Calculate number of pixels to advance per frame
      const pxPerFrame = Math.max(1.8 * dpr, (width / (framesPerBeat * 2.2)));

      for (let p = 0; p < Math.ceil(pxPerFrame); p++) {
        cyclePhase = (cyclePhase + phaseDelta / pxPerFrame) % 1;

        // Mathematical model of Lead II P-Q-R-S-T cardiac cycle
        let yOffset = 0;

        if (cyclePhase >= 0.08 && cyclePhase < 0.18) {
          // P Wave (Atrial Depolarization): gentle upward dome
          const pAngle = ((cyclePhase - 0.08) / 0.1) * Math.PI;
          yOffset = -Math.sin(pAngle) * 0.18;
        } else if (cyclePhase >= 0.22 && cyclePhase < 0.25) {
          // Q Wave: slight downward dip
          const qAngle = ((cyclePhase - 0.22) / 0.03) * Math.PI;
          yOffset = Math.sin(qAngle) * 0.12;
        } else if (cyclePhase >= 0.25 && cyclePhase < 0.31) {
          // R Wave: sharp tall ventricular spike
          const rPos = (cyclePhase - 0.25) / 0.06;
          if (rPos < 0.5) {
            yOffset = -(rPos / 0.5) * 0.95; // Up to peak
          } else {
            yOffset = -0.95 + ((rPos - 0.5) / 0.5) * 1.35; // Down past baseline into S
          }
        } else if (cyclePhase >= 0.31 && cyclePhase < 0.35) {
          // S Wave recovery to ST segment
          const sPos = (cyclePhase - 0.31) / 0.04;
          const stOffset = (stDepression / 5.0) * 0.22;
          yOffset = 0.4 * (1 - sPos) + stOffset * sPos;
        } else if (cyclePhase >= 0.35 && cyclePhase < 0.48) {
          // ST Segment (flat or depressed)
          const stOffset = (stDepression / 5.0) * 0.22;
          yOffset = stOffset;
        } else if (cyclePhase >= 0.48 && cyclePhase < 0.68) {
          // T Wave: smooth repolarization dome with slight ST recovery
          const tPos = (cyclePhase - 0.48) / 0.2;
          const tAngle = tPos * Math.PI;
          const stOffset = (stDepression / 5.0) * 0.22 * (1 - tPos);
          yOffset = -Math.sin(tAngle) * 0.32 + stOffset;
        } else {
          // Isoelectric Resting Baseline
          yOffset = 0;
        }

        const currentY = baselineY + yOffset * amplitudeScale;
        const currentIdx = Math.floor(sweepX);
        if (currentIdx >= 0 && currentIdx < points.length) {
          points[currentIdx] = currentY;
        }

        sweepX = (sweepX + 1) % width;
      }

      // Draw background
      ctx.clearRect(0, 0, width, height);

      // Millimeter telemetry grid
      ctx.lineWidth = 1 * dpr;
      ctx.strokeStyle = isDark ? "rgba(16, 185, 129, 0.08)" : "rgba(13, 148, 136, 0.08)";
      const gridSpacing = 16 * dpr;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Draw continuous ECG waveform
      ctx.lineWidth = 2.2 * dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = color || (isDark ? "#10b981" : "#0d9488"); // Neon emerald or clinical teal

      ctx.beginPath();
      let started = false;
      const gapSize = 24 * dpr; // Blanking gap ahead of the sweep head

      for (let x = 0; x < width; x++) {
        // Skip drawing inside the blanking window ahead of current sweep cursor
        const distFromSweep = (x - sweepX + width) % width;
        if (distFromSweep < gapSize) {
          started = false;
          continue;
        }

        const y = points[x] || baselineY;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw glowing pulse dot at the leading sweep cursor
      const cursorX = sweepX;
      const cursorY = points[Math.floor(cursorX)] || baselineY;

      // Glow halo
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, 6 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "rgba(16, 185, 129, 0.45)" : "rgba(13, 148, 136, 0.25)";
      ctx.fill();

      // Sharp center core dot
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, 2.8 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "#34d399" : "#0f766e";
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [heartRate, stDepression, isDark, color]);

  const defaultContainerStyles = isDark
    ? "bg-slate-950 border-slate-800/80"
    : "bg-teal-50/70 border-teal-200/80";

  return (
    <div
      className={`relative w-full h-11 sm:h-12 rounded-xl border p-0.5 overflow-hidden shadow-2xs ${defaultContainerStyles} ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      {showBadge && (
        <div
          className={`absolute top-1.5 right-2 flex items-center gap-1.5 pointer-events-none text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shadow-2xs ${
            isDark
              ? "text-emerald-400 bg-slate-900/90 border-emerald-500/30"
              : "text-teal-800 bg-white/90 border-teal-200"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full animate-ping ${
              isDark ? "bg-emerald-400" : "bg-teal-600"
            }`}
          />
          <span>LIVE {heartRate} BPM</span>
        </div>
      )}
    </div>
  );
}
export default RealtimeEcgWaveform;

