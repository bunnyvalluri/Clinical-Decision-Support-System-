"use client";

import React from "react";

export type SecurityProviderType = "PENTEST_AGENTS" | "STRIX" | "AGENTIC_BUGHUNTER";

interface SecurityProviderSelectorProps {
  selectedProvider: SecurityProviderType;
  onSelectProvider: (provider: SecurityProviderType) => void;
}

export const SecurityProviderSelector: React.FC<SecurityProviderSelectorProps> = ({
  selectedProvider,
  onSelectProvider,
}) => {
  const providers: { id: SecurityProviderType; name: string; desc: string; badge: string }[] = [
    {
      id: "PENTEST_AGENTS",
      name: "H-mmer Pentest-Agents",
      desc: "Multi-agent autonomous offensive testing, API & IDOR validation, bug bounty methodologies.",
      badge: "v0.1.0 Pinned",
    },
    {
      id: "STRIX",
      name: "Strix AI Security Engine",
      desc: "Deep automated web & source pentesting engine producing standard SARIF 2.1.0 output.",
      badge: "Prompt 42",
    },
    {
      id: "AGENTIC_BUGHUNTER",
      name: "Agentic Bug Hunter",
      desc: "Fast, policy-governed internal reconnaissance and deterministic route authorization matrix.",
      badge: "Prompt 28",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {providers.map((p) => {
        const isSelected = selectedProvider === p.id;
        return (
          <div
            key={p.id}
            onClick={() => onSelectProvider(p.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? "bg-blue-50/50 border-blue-500 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="font-semibold text-sm text-slate-900">{p.name}</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                {p.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{p.desc}</p>
          </div>
        );
      })}
    </div>
  );
};
