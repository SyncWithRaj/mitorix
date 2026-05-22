"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { FileText, Eye, ArrowLeft } from "lucide-react";
import ImpactAnalysis from "./ImpactAnalysis";
import ConnectionsCard from "./ConnectionsCard";
import OwnershipCard from "./OwnershipCard";
import FunctionList from "./FunctionList";

export default function FileInspector() {
  const { analysisData, selectedFile, deselectFile, setRightTab } = useCodeflow();

  if (!analysisData || !selectedFile) return null;

  const file = analysisData.files.find((f) => f.path === selectedFile);
  if (!file) return null;

  return (
    <div>
      {/* Back Button */}
      <button
        className="w-full mb-3 flex items-center gap-2 px-3 py-2 text-[10px] font-semibold bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#1a1a1a] rounded-md transition text-[#e5e5e5]"
        onClick={deselectFile}
      >
        <ArrowLeft size={12} />
        Back to Issues
      </button>

      {/* File Header */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 mb-3 -mx-1">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[#e5e5e5] font-semibold text-xs">
              <FileText size={14} className="text-[#ff6b00] shrink-0" />
              <span className="truncate">{file.name}</span>
            </div>
            <div className="text-[9px] text-[#737373] mt-1 leading-relaxed">
              {file.folder || "root"} • {file.layer} • {file.lines} lines
              {file.complexity &&
                file.complexity.score > 0 &&
                ` • Complexity: ${file.complexity.score}`}
            </div>
          </div>
          <button
            className="flex items-center gap-1 px-2 py-1 text-[9px] bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#1a1a1a] rounded text-[#e5e5e5] transition shrink-0"
            title="View Source"
            onClick={() => setRightTab("code")}
          >
            <Eye size={10} />
            View Source
          </button>
        </div>
      </div>

      {/* Sub-cards */}
      <ImpactAnalysis />
      <ConnectionsCard />
      <OwnershipCard />
      <FunctionList />
    </div>
  );
}
