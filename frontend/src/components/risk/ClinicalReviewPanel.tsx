import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Edit3, ShieldAlert, UserCheck } from "lucide-react";
import { RiskLevel } from "@/services/risk/riskApi";

export interface ClinicalReviewPanelProps {
  predictionId: string;
  currentRiskLevel: RiskLevel;
  currentOverride?: RiskLevel | null;
  currentRationale?: string;
  overriddenByName?: string | null;
  onRecordReview: (predictionId: string, override: RiskLevel, rationale: string) => Promise<void>;
  disabled?: boolean;
}

export const ClinicalReviewPanel: React.FC<ClinicalReviewPanelProps> = ({
  predictionId,
  currentRiskLevel,
  currentOverride,
  currentRationale,
  overriddenByName,
  onRecordReview,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel>(currentOverride || currentRiskLevel);
  const [rationale, setRationale] = useState(currentRationale || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOverridden = !!currentOverride && currentOverride !== currentRiskLevel;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rationale.trim()) {
      setError("Mandatory clinical rationale is required to record a clinical review or override.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onRecordReview(predictionId, selectedRisk, rationale);
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || "Failed to record review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-sky-700" />
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Physician Clinical Review & Sign-Off
          </h4>
        </div>
        {!isEditing && !disabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-7 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            {isOverridden ? "Edit Override" : "Document Review / Override"}
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="text-xs space-y-2">
          {isOverridden ? (
            <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-amber-950 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  Clinician Override Active: {currentOverride} Risk
                </span>
                {overriddenByName && (
                  <span className="text-[11px] text-amber-800">By: {overriddenByName}</span>
                )}
              </div>
              <p className="text-slate-700">Rationale: {currentRationale}</p>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200 text-slate-600 flex items-center justify-between">
              <span>Status: <strong>AI Risk Assessment Concurred / Pending Action</strong></span>
              <span className="text-[11px] text-slate-600">Attending physician oversight active</span>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">
              Clinical Risk Decision
            </Label>
            <Select
              value={selectedRisk}
              onValueChange={(val) => setSelectedRisk(val as RiskLevel)}
            >
              <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                <SelectValue placeholder="Select target risk level" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="LOW">LOW Risk</SelectItem>
                <SelectItem value="MEDIUM">MEDIUM Risk</SelectItem>
                <SelectItem value="HIGH">HIGH Risk</SelectItem>
                <SelectItem value="CRITICAL">CRITICAL Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="review-rationale" className="text-xs font-medium text-slate-700">
              Clinical Rationale <span className="text-rose-600">*</span>
            </Label>
            <Textarea
              id="review-rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Detail medical evidence, bedside clinical findings, or justification for concur/override..."
              rows={3}
              className="text-xs bg-white border-slate-300"
            />
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => setIsEditing(false)}
              className="h-8 text-xs text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="h-8 text-xs bg-sky-700 hover:bg-sky-800 text-white"
            >
              {loading ? "Recording..." : "Save Clinical Sign-Off"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
