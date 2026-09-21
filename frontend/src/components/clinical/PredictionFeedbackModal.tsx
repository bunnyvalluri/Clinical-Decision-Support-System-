"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { AlertCircle, CheckCircle2, MessageSquarePlus } from "lucide-react";
import { riskApi } from "@/services/risk/riskApi";

interface PredictionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictionId: string;
  patientName?: string;
  onFeedbackSubmitted?: () => void;
}

const FEEDBACK_CATEGORIES = [
  { value: "PREDICTION_ACCEPTED", label: "Prediction Accepted & Clinically Useful" },
  { value: "NOT_CLINICALLY_USEFUL", label: "Prediction Not Clinically Useful" },
  { value: "INCORRECT_PREDICTION", label: "Incorrect Risk Assessment" },
  { value: "INSUFFICIENT_DATA", label: "Insufficient Clinical Data for Assessment" },
  { value: "CONFLICTING_INFORMATION", label: "Conflicting Clinical Evidence" },
  { value: "NEEDS_REVIEW", label: "Requires Specialist / Attending Review" },
  { value: "OTHER", label: "Other Clinical Feedback" },
];

export function PredictionFeedbackModal({
  isOpen,
  onClose,
  predictionId,
  patientName,
  onFeedbackSubmitted,
}: PredictionFeedbackModalProps) {
  const [category, setCategory] = React.useState<string>("PREDICTION_ACCEPTED");
  const [comments, setComments] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      setCategory("PREDICTION_ACCEPTED");
      setComments("");
      setError(null);
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!predictionId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await riskApi.submitPredictionFeedback(predictionId, {
        feedback_category: category,
        comments: comments.trim(),
      });
      setIsSuccess(true);
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Failed to submit feedback:", err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to submit prediction feedback. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border border-slate-200 shadow-lg text-slate-900">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-sky-700" />
            <DialogTitle className="text-base font-bold text-slate-900">
              Submit Clinical Prediction Feedback
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Provide feedback to clinical informatics and MLOps on the utility and accuracy of this prediction.
            {patientName && <span className="block mt-1 font-medium text-slate-700">{patientName}</span>}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-900">
              Feedback Recorded Successfully
            </p>
            <p className="text-xs text-slate-500">
              Your assessment has been securely logged to Neon PostgreSQL for clinical governance review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Feedback Classification
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-white border-slate-300 text-xs">
                  <SelectValue placeholder="Select feedback category" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-xs">
                  {FEEDBACK_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-xs">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Clinical Context & Notes (Optional)
              </Label>
              <Textarea
                placeholder="Explain why the prediction was or was not clinically actionable..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="text-xs border-slate-300 bg-white min-h-[90px]"
                maxLength={2000}
              />
              <span className="text-[10px] text-slate-400 block text-right">
                {comments.length} / 2000
              </span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600">
              <strong>Governance note:</strong> Feedback is audited and utilized for offline calibration and fairness evaluation. It does NOT automatically trigger online model retraining.
            </div>

            <DialogFooter className="pt-2 gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs bg-sky-700 hover:bg-sky-800 text-white"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
