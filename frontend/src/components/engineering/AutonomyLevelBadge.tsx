"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

interface AutonomyLevelBadgeProps {
  level: string;
}

export const AutonomyLevelBadge: React.FC<AutonomyLevelBadgeProps> = ({ level }) => {
  switch (level) {
    case "L1_REPORT_ONLY":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
          L1: Report Only
        </Badge>
      );
    case "L2_ASSISTED":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          L2: Assisted
        </Badge>
      );
    case "L3_CONTROLLED_UNATTENDED":
      return (
        <Badge className="bg-purple-50 text-purple-700 border-purple-200">
          L3: Controlled Unattended
        </Badge>
      );
    default:
      return <Badge variant="outline">{level}</Badge>;
  }
};
