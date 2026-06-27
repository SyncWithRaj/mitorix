"use client";

import React from "react";
import toast from "react-hot-toast";
import { useCodeflow } from "../../../context/CodeflowContext";
import { useSubscription } from "../../../context/SubscriptionContext";
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
  const { tier } = useSubscription();

  const handleSelect = (vizType: VizType) => {
    // Only Visual (visual) and Graph (force) are allowed on FREE plan
    if (tier === "FREE" && vizType !== "visual" && vizType !== "force") {
      toast.error(
        "🔒 Advanced visualizations require the BASIC plan or higher. Upgrade to unlock.",
        { id: "viz-locked" }
      );
      return;
    }
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
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex bg-[rgba(10,10,10,0.85)] backdrop-blur-md border border-[#1a1a1a] rounded-lg p-1 shadow-lg">
      {tabs.map((tab) => {
        const isActive = graphConfig.vizType === tab.id;
        const Icon = tab.icon;
        const isLocked = tier === "FREE" && tab.id !== "visual" && tab.id !== "force";

        return (
          <button
            key={tab.id}
            onClick={() => handleSelect(tab.id)}
            title={isLocked ? "Requires Basic Plan" : tab.label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              isActive
                ? "bg-[#0a0a0a] text-white shadow-sm border border-[#ff6b00]/30"
                : isLocked
                ? "text-[#737373] hover:text-[#ff6b00]/80 hover:bg-[rgba(255,255,255,0.02)] border border-transparent"
                : "text-[#737373] hover:text-[#e5e5e5] hover:bg-[rgba(255,255,255,0.02)] border border-transparent"
            }`}
          >
            <Icon size={14} className={isActive ? "text-[#ff6b00]" : ""} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
