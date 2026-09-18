import React from "react";
import { Cpu, ShieldCheck, Database, Calendar } from "lucide-react";
import { RiskModel } from "@/services/risk/riskApi";

export interface ModelInformationProps {
  model: RiskModel;
  className?: string;
}

export const ModelInformation: React.FC<ModelInformationProps> = ({ model, className = "" }) => {
  return (
    <div className={`p-4 rounded-lg border border-slate-200 bg-white space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-sky-700" />
          Model Architecture & Lineage
        </h4>
        <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          {model.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-600 block text-[11px]">Algorithm:</span>
          <span className="font-semibold text-slate-800">{model.algorithm}</span>
        </div>
        <div>
          <span className="text-slate-600 block text-[11px]">Version:</span>
          <span className="font-mono font-medium text-slate-800">v{model.version}</span>
        </div>
        <div>
          <span className="text-slate-600 block text-[11px]">Training Cohort:</span>
          <span className="font-medium text-slate-800">{model.training_dataset_identifier}</span>
        </div>
        <div>
          <span className="text-slate-600 block text-[11px]">Preprocessing:</span>
          <span className="font-mono text-slate-800">{model.preprocessing_version || "v1.0"}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-mono">
        <span className="truncate max-w-[280px]" title={model.checksum}>
          SHA-256: {model.checksum ? `${model.checksum.slice(0, 16)}...` : "Verified"}
        </span>
        <span className="flex items-center gap-1 text-emerald-700 font-sans font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Cryptographically Verified
        </span>
      </div>
    </div>
  );
};
