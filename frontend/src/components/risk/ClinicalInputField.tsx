import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface ClinicalInputFieldProps {
  id: string;
  name: string;
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: string | number;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}

export const ClinicalInputField: React.FC<ClinicalInputFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = "any",
  type = "number",
  required = false,
  disabled = false,
  error,
  placeholder,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <Label htmlFor={id} className="text-xs font-medium text-slate-700">
          {label} {required && <span className="text-rose-600">*</span>}
        </Label>
        {min !== undefined && max !== undefined && (
          <span className="text-[11px] text-slate-600 font-normal">
            ({min} - {max} {unit})
          </span>
        )}
      </div>
      <div className="relative rounded-md shadow-xs">
        <Input
          id={id}
          name={name}
          type={type}
          step={step}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder || (min !== undefined && max !== undefined ? `${min} - ${max}` : "")}
          className={`h-9 text-sm pr-12 bg-white text-slate-900 ${
            error ? "border-rose-500 focus-visible:ring-rose-500" : "border-slate-300 focus-visible:ring-sky-500"
          }`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {unit && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs text-slate-600 font-medium">{unit}</span>
          </div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-[11px] font-medium text-rose-600 mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
};
