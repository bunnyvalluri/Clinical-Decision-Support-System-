/**
 * Clinical formatters and helpers
 */
import { RISK_LEVELS } from "@/lib/constants";

export function formatRiskScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

export function getRiskLevelColor(level: string): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  switch (level?.toUpperCase()) {
    case RISK_LEVELS.CRITICAL:
    case "CRITICAL":
      return {
        bg: "bg-rose-500/10",
        text: "text-rose-500",
        border: "border-rose-500/20",
        badge: "bg-rose-500 text-white",
      };
    case RISK_LEVELS.HIGH:
    case "HIGH":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-500",
        border: "border-amber-500/20",
        badge: "bg-amber-500 text-white",
      };
    case RISK_LEVELS.MEDIUM:
    case "MEDIUM":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-500",
        border: "border-blue-500/20",
        badge: "bg-blue-500 text-white",
      };
    case RISK_LEVELS.LOW:
    case "LOW":
    default:
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-500",
        border: "border-emerald-500/20",
        badge: "bg-emerald-500 text-white",
      };
  }
}

const defaultDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(isoString: string): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return defaultDateTimeFormatter.format(d);
  } catch {
    return isoString;
  }
}
