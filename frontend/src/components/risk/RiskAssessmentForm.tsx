import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ClinicalInputField } from "./ClinicalInputField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, AlertCircle, Sparkles, RefreshCw, Send } from "lucide-react";
import { ClinicalFeatureDefinition, RiskModel, riskApi } from "@/services/risk/riskApi";

export interface RiskAssessmentFormProps {
  patientId: string;
  patientAge?: number;
  patientGender?: string;
  initialVitals?: Record<string, any>;
  onPredictionComplete: (result: any) => void;
  disabled?: boolean;
}

export const RiskAssessmentForm: React.FC<RiskAssessmentFormProps> = ({
  patientId,
  patientAge = 55,
  patientGender = "MALE",
  initialVitals = {},
  onPredictionComplete,
  disabled = false,
}) => {
  const [models, setModels] = useState<RiskModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("random_forest_risk_model");
  const [features, setFeatures] = useState<ClinicalFeatureDefinition[]>([]);
  const [vitals, setVitals] = useState<Record<string, any>>({
    age: patientAge,
    gender: patientGender,
    encounter_type: "OUTPATIENT",
    systolic_bp: 120,
    diastolic_bp: 80,
    heart_rate: 72,
    respiratory_rate: 16,
    body_temperature: 37.0,
    oxygen_saturation: 98.0,
    glucose_level: 95.0,
    cholesterol_total: 180.0,
    bmi: 24.5,
    creatinine: 1.0,
    sodium: 140.0,
    calcium: 9.4,
    lactic_acid: 1.1,
    ...initialVitals,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    // Load feature definitions & models
    async function loadConfig() {
      try {
        const [modelsList, featuresList] = await Promise.all([
          riskApi.listModels(),
          riskApi.listFeatures(),
        ]);
        setModels(modelsList);
        setFeatures(featuresList);
      } catch (err) {
        // Fallback silently if offline or initial render
      }
    }
    loadConfig();
  }, []);

  const handleChange = (field: string, val: any) => {
    setVitals((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const applyPreset = (preset: string) => {
    setErrors({});
    setGlobalError(null);
    if (preset === "NORMAL") {
      setVitals({
        age: patientAge || 48,
        gender: patientGender || "MALE",
        encounter_type: "ROUTINE",
        systolic_bp: 118,
        diastolic_bp: 76,
        heart_rate: 68,
        respiratory_rate: 15,
        body_temperature: 36.8,
        oxygen_saturation: 99.0,
        glucose_level: 88.0,
        cholesterol_total: 165.0,
        bmi: 23.2,
        creatinine: 0.9,
        sodium: 141.0,
        calcium: 9.5,
        lactic_acid: 0.9,
      });
    } else if (preset === "HIGH_RISK") {
      setVitals({
        age: patientAge || 68,
        gender: patientGender || "MALE",
        encounter_type: "EMERGENCY",
        systolic_bp: 92,
        diastolic_bp: 58,
        heart_rate: 115,
        respiratory_rate: 26,
        body_temperature: 39.2,
        oxygen_saturation: 89.5,
        glucose_level: 215.0,
        cholesterol_total: 245.0,
        bmi: 34.1,
        creatinine: 2.4,
        sodium: 133.0,
        calcium: 7.9,
        lactic_acid: 3.8,
      });
    } else if (preset === "CRITICAL_SEPSIS") {
      setVitals({
        age: patientAge || 72,
        gender: patientGender || "FEMALE",
        encounter_type: "ICU",
        systolic_bp: 84,
        diastolic_bp: 48,
        heart_rate: 138,
        respiratory_rate: 32,
        body_temperature: 40.2,
        oxygen_saturation: 84.0,
        glucose_level: 340.0,
        cholesterol_total: 280.0,
        bmi: 38.5,
        creatinine: 3.9,
        sodium: 128.0,
        calcium: 7.2,
        lactic_acid: 5.6,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);
    setLoading(true);

    try {
      const result = await riskApi.createPrediction({
        patient_id: patientId,
        model_name: selectedModel,
        vitals,
      });
      onPredictionComplete(result);
    } catch (err: any) {
      const resp = err?.response?.data;
      if (resp?.error?.details && Array.isArray(resp.error.details)) {
        const fieldErrors: Record<string, string> = {};
        for (const detail of resp.error.details) {
          if (detail.field) {
            fieldErrors[detail.field] = detail.message;
          }
        }
        setErrors(fieldErrors);
      }
      setGlobalError(
        resp?.error?.message || err?.message || "Prediction execution failed. Please verify input data."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-sky-700" />
            Clinical Risk Assessment & Vitals Input
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Input verified physiological parameters for instant multi-class inference, TreeSHAP attributions, and CDSS scoring.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-600 font-medium mr-1">Presets:</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset("NORMAL")}
            className="h-7 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Normal
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset("HIGH_RISK")}
            className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-50"
          >
            High Risk
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset("CRITICAL_SEPSIS")}
            className="h-7 text-xs border-rose-300 text-rose-900 hover:bg-rose-50"
          >
            Critical
          </Button>
        </div>
      </div>

      {globalError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Model Selection & Encounter Setting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50/70 rounded-md border border-slate-200/80">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-700">Predictive Model</Label>
          <Select value={selectedModel} onValueChange={setSelectedModel} disabled={loading || disabled}>
            <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="random_forest_risk_model">
                Random Forest Risk Model (Production Champion - 100% Acc)
              </SelectItem>
              <SelectItem value="svm_risk_model">
                SVM Risk Model (RBF Kernel Platt Scaled - 99.4% Acc)
              </SelectItem>
              <SelectItem value="adaboost_risk_model">
                AdaBoost Risk Model (Adaptive Boosting - 79.6% Acc)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-700">Encounter Setting</Label>
          <Select
            value={vitals.encounter_type || "OUTPATIENT"}
            onValueChange={(val) => handleChange("encounter_type", val)}
            disabled={loading || disabled}
          >
            <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
              <SelectValue placeholder="Encounter Type" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="ROUTINE">Routine Clinic</SelectItem>
              <SelectItem value="OUTPATIENT">Outpatient Encounter</SelectItem>
              <SelectItem value="INPATIENT">Inpatient Ward</SelectItem>
              <SelectItem value="EMERGENCY">Emergency Department</SelectItem>
              <SelectItem value="ICU">Intensive Care Unit (ICU)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cardiovascular Vitals */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Cardiovascular & Hemodynamic Parameters
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ClinicalInputField
            id="systolic_bp"
            name="systolic_bp"
            label="Systolic BP"
            unit="mmHg"
            min={40}
            max={300}
            value={vitals.systolic_bp}
            onChange={(e) => handleChange("systolic_bp", e.target.value)}
            error={errors.systolic_bp}
            required
            disabled={loading || disabled}
          />
          <ClinicalInputField
            id="diastolic_bp"
            name="diastolic_bp"
            label="Diastolic BP"
            unit="mmHg"
            min={20}
            max={200}
            value={vitals.diastolic_bp}
            onChange={(e) => handleChange("diastolic_bp", e.target.value)}
            error={errors.diastolic_bp}
            required
            disabled={loading || disabled}
          />
          <ClinicalInputField
            id="heart_rate"
            name="heart_rate"
            label="Heart Rate"
            unit="bpm"
            min={20}
            max={260}
            value={vitals.heart_rate}
            onChange={(e) => handleChange("heart_rate", e.target.value)}
            error={errors.heart_rate}
            required
            disabled={loading || disabled}
          />
        </div>
      </div>

      {/* Respiratory & Core Vitals */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Respiratory & Temperature
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ClinicalInputField
            id="respiratory_rate"
            name="respiratory_rate"
            label="Respiratory Rate"
            unit="breaths/min"
            min={6}
            max={70}
            value={vitals.respiratory_rate}
            onChange={(e) => handleChange("respiratory_rate", e.target.value)}
            error={errors.respiratory_rate}
            required
            disabled={loading || disabled}
          />
          <ClinicalInputField
            id="body_temperature"
            name="body_temperature"
            label="Body Temperature"
            unit="°C"
            min={30.0}
            max={45.0}
            step="0.1"
            value={vitals.body_temperature}
            onChange={(e) => handleChange("body_temperature", e.target.value)}
            error={errors.body_temperature}
            required
            disabled={loading || disabled}
          />
          <ClinicalInputField
            id="oxygen_saturation"
            name="oxygen_saturation"
            label="Oxygen Saturation (SpO2)"
            unit="%"
            min={50.0}
            max={100.0}
            step="0.1"
            value={vitals.oxygen_saturation}
            onChange={(e) => handleChange("oxygen_saturation", e.target.value)}
            error={errors.oxygen_saturation}
            required
            disabled={loading || disabled}
          />
        </div>
      </div>

      {/* Metabolic & Laboratory Biomarkers */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Metabolic, Renal & Laboratory Panels
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ClinicalInputField
            id="glucose_level"
            name="glucose_level"
            label="Blood Glucose"
            unit="mg/dL"
            min={20.0}
            max={1000.0}
            value={vitals.glucose_level}
            onChange={(e) => handleChange("glucose_level", e.target.value)}
            error={errors.glucose_level}
            required
            disabled={loading || disabled}
          />
          <ClinicalInputField
            id="cholesterol_total"
            name="cholesterol_total"
            label="Total Cholesterol"
            unit="mg/dL"
            min={50.0}
            max={600.0}
            value={vitals.cholesterol_total}
            onChange={(e) => handleChange("cholesterol_total", e.target.value)}
            error={errors.cholesterol_total}
            required
            disabled={loading || disabled}
          />
          <ClinicalInputField
            id="bmi"
            name="bmi"
            label="BMI"
            unit="kg/m²"
            min={10.0}
            max={80.0}
            step="0.1"
            value={vitals.bmi}
            onChange={(e) => handleChange("bmi", e.target.value)}
            error={errors.bmi}
            required
            disabled={loading || disabled}
          />
          <ClinicalInputField
            id="creatinine"
            name="creatinine"
            label="Serum Creatinine"
            unit="mg/dL"
            min={0.1}
            max={25.0}
            step="0.01"
            value={vitals.creatinine}
            onChange={(e) => handleChange("creatinine", e.target.value)}
            error={errors.creatinine}
            disabled={loading || disabled}
          />
          <ClinicalInputField
            id="sodium"
            name="sodium"
            label="Serum Sodium"
            unit="mmol/L"
            min={100.0}
            max={180.0}
            value={vitals.sodium}
            onChange={(e) => handleChange("sodium", e.target.value)}
            error={errors.sodium}
            disabled={loading || disabled}
          />
          <ClinicalInputField
            id="calcium"
            name="calcium"
            label="Serum Calcium"
            unit="mg/dL"
            min={4.0}
            max={18.0}
            step="0.1"
            value={vitals.calcium}
            onChange={(e) => handleChange("calcium", e.target.value)}
            error={errors.calcium}
            disabled={loading || disabled}
          />
          <ClinicalInputField
            id="lactic_acid"
            name="lactic_acid"
            label="Serum Lactate"
            unit="mmol/L"
            min={0.2}
            max={30.0}
            step="0.01"
            value={vitals.lactic_acid}
            onChange={(e) => handleChange("lactic_acid", e.target.value)}
            error={errors.lactic_acid}
            disabled={loading || disabled}
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
        <span className="text-[11px] text-slate-600">
          * Strictly validates physiological bounds against configured schema.
        </span>
        <Button
          type="submit"
          disabled={loading || disabled}
          className="h-9 px-4 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white shadow-xs gap-1.5"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Running Inference...
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              Execute Risk Assessment
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
