"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { FileText, Eye, ArrowLeft } from "lucide-react";
import ImpactAnalysis from "./ImpactAnalysis";
import ConnectionsCard from "./ConnectionsCard";
import OwnershipCard from "./OwnershipCard";
import FunctionList from "./FunctionList";

export default function FileInspector() {
  const { analysisData, selectedFile, deselectFile } = useCodeflow();

  if (!analysisData || !selectedFile) return null;

  const file = analysisData.files.find(f => f.path === selectedFile);
  if (!file) return null;

  return (
    <div>
      {/* Back Button */}
      <button
        className="w-full mb-3 flex items-center gap-2 px-3 py-2 text-[10px] font-semibold bg-[#161b22] border border-[#30363d] hover:bg-[#21262d] rounded-md transition text-[#c9d1d9]"
        onClick={deselectFile}
      >
        <ArrowLeft size={12} />
        Back to Issues
      </button>

      {/* File Header */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 mb-3 -mx-1">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[#c9d1d9] font-semibold text-xs">
              <FileText size={14} className="text-[#58a6ff] shrink-0" />
              <span className="truncate">{file.name}</span>
            </div>
            <div className="text-[9px] text-[#8b949e] mt-1 leading-relaxed">
              {file.folder || "root"} • {file.layer} • {file.lines} lines
              {file.complexity && file.complexity.score > 0 && ` • Complexity: ${file.complexity.score}`}
            </div>
          </div>
          <button
            className="flex items-center gap-1 px-2 py-1 text-[9px] bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] rounded text-[#c9d1d9] transition shrink-0"
            title="View Source"
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
