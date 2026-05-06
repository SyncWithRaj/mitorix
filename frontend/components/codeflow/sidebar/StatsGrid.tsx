"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { COLORS } from "../../../lib/codeflow.constants";

export default function StatsGrid() {
  const { analysisData, setShowUnusedModal } = useCodeflow();

  if (!analysisData) return null;

  const { stats } = analysisData;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col items-center justify-center hover:bg-[#21262d] transition-colors">
          <div className="text-xl font-bold text-[#c9d1d9] font-mono">{stats.files}</div>
          <div className="text-[10px] uppercase text-[#8b949e] font-bold tracking-wider mt-1">Files</div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col items-center justify-center hover:bg-[#21262d] transition-colors">
          <div className="text-xl font-bold text-[#c9d1d9] font-mono">{stats.functions}</div>
          <div className="text-[10px] uppercase text-[#8b949e] font-bold tracking-wider mt-1">Functions</div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col items-center justify-center hover:bg-[#21262d] transition-colors">
          <div className="text-xl font-bold text-[#c9d1d9] font-mono">{stats.connections}</div>
          <div className="text-[10px] uppercase text-[#8b949e] font-bold tracking-wider mt-1">Links</div>
        </div>
        <div 
          className={`bg-[#161b22] border rounded-lg p-3 flex flex-col items-center justify-center transition-colors ${
            stats.dead > 10 ? "border-[#f85149] bg-[rgba(248,81,73,0.05)] hover:bg-[rgba(248,81,73,0.1)]" : "border-[#30363d] hover:bg-[#21262d]"
          }`}
          style={{ cursor: stats.dead > 0 ? "pointer" : "default" }}
          onClick={() => {
            console.log("[StatsGrid] Clicked Unused box. stats.dead =", stats.dead);
            if (stats.dead > 0) {
              console.log("[StatsGrid] Setting showUnusedModal to true");
              setShowUnusedModal(true);
            }
          }}
        >
          <div className={`text-xl font-bold font-mono ${stats.dead > 10 ? "text-[#f85149]" : "text-[#c9d1d9]"}`}>
            {stats.dead}
          </div>
          <div className="flex flex-col items-center gap-0.5 mt-1">
            <span className="text-[10px] uppercase text-[#8b949e] font-bold tracking-wider">Unused</span>
            {stats.dead > 0 && (
              <span className="text-[8px] bg-[#30363d] text-[#c9d1d9] px-1.5 py-0.5 rounded-full whitespace-nowrap scale-90">
                Click to view
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col items-center justify-center hover:bg-[#21262d] transition-colors">
        <div className="text-2xl font-bold text-[#58a6ff] font-mono">
          {stats.loc ? stats.loc.toLocaleString() : "0"}
        </div>
        <div className="text-[10px] uppercase text-[#8b949e] font-bold tracking-wider mt-1">Lines of Code</div>
      </div>
    </div>
  );
}
