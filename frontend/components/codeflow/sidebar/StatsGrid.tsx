"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { COLORS } from "../../../lib/codeflow.constants";

export default function StatsGrid() {
  const { analysisData } = useCodeflow();

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
        >
          <div className={`text-xl font-bold font-mono ${stats.dead > 10 ? "text-[#f85149]" : "text-[#c9d1d9]"}`}>
            {stats.dead}
          </div>
          <div className="text-[10px] uppercase text-[#8b949e] font-bold tracking-wider mt-1">Unused</div>
        </div>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col items-center justify-center hover:bg-[#21262d] transition-colors">
        <div className="text-2xl font-bold text-[#58a6ff] font-mono">
          {stats.loc ? stats.loc.toLocaleString() : "0"}
        </div>
        <div className="text-[10px] uppercase text-[#8b949e] font-bold tracking-wider mt-1">Lines of Code</div>
      </div>

      {stats.languages && stats.languages.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {/* Language Stacked Bar */}
          <div className="h-2 w-full rounded-full flex overflow-hidden bg-[#21262d]">
            {stats.languages.slice(0, 6).map((lang, idx) => (
              <div 
                key={lang.ext} 
                style={{ 
                  width: `${lang.pct}%`, 
                  backgroundColor: COLORS[idx % COLORS.length] 
                }} 
              />
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {stats.languages.slice(0, 6).map((lang, idx) => (
              <div key={lang.ext} className="flex items-center gap-1.5 text-xs text-[#8b949e]">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                />
                <span className="uppercase font-mono text-[10px]">{lang.ext} {lang.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
