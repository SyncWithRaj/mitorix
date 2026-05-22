"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { VizType } from "../../../lib/codeflow.types";
import {
  Network,
  LayoutTemplate,
  Grid3X3,
  Share2,
  Workflow,
  Boxes,
  Target,
  Eye,
} from "lucide-react";

export default function VizSelector() {
  const { graphConfig, setGraphConfig } = useCodeflow();

  const handleSelect = (vizType: VizType) => {
    setGraphConfig({ ...graphConfig, vizType });
  };

  const tabs: { id: VizType; label: string; icon: any }[] = [
    { id: "visual", label: "Visual", icon: Eye },
    { id: "force", label: "Graph", icon: Network },
    { id: "treemap", label: "Treemap", icon: LayoutTemplate },
    { id: "matrix", label: "Matrix", icon: Grid3X3 },
    { id: "dendro", label: "Tree", icon: Share2 },
    { id: "sankey", label: "Flow", icon: Workflow },
    { id: "disjoint", label: "Cluster", icon: Boxes },
    { id: "bundle", label: "Bundle", icon: Target },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex bg-[rgba(22,27,34,0.85)] backdrop-blur-md border border-[#30363d] rounded-lg p-1 shadow-lg">
      {tabs.map((tab) => {
        const isActive = graphConfig.vizType === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => handleSelect(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              isActive
                ? "bg-[#21262d] text-white shadow-sm border border-[#30363d]"
                : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[rgba(255,255,255,0.05)] border border-transparent"
            }`}
          >
            <Icon size={14} className={isActive ? "text-[#58a6ff]" : ""} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
