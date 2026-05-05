"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { Zap, ChevronRight, ChevronDown, FileCode2 } from "lucide-react";

export default function ImpactAnalysis() {
  const { blastRadius, expandedCards, toggleCard, selectFile } = useCodeflow();

  if (!blastRadius) return null;

  const isOpen = expandedCards.has("blast");

  const getLevelColor = (level: string) => {
    switch (level) {
      case "critical": return "text-red-500 bg-red-500/10 border-red-500/20";
      case "high": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "medium": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default: return "text-green-500 bg-green-500/10 border-green-500/20";
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg mb-3 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#1f242c] transition select-none"
        onClick={() => toggleCard("blast")}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-[#c9d1d9]">
          {isOpen ? <ChevronDown size={14} className="text-[#8b949e]" /> : <ChevronRight size={14} className="text-[#8b949e]" />}
          <Zap size={14} className="text-[#58a6ff]" />
          Impact Analysis
        </div>
        <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${getLevelColor(blastRadius.level)}`}>
          {blastRadius.level}
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-3 pt-0 border-t border-[#30363d]/50 mt-1">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3 mt-3">
            <div className="bg-[#0d1117] p-2.5 rounded-md text-center border border-[#30363d]/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff9d] opacity-50" />
              <div className="text-lg font-bold text-[#00ff9d]">{blastRadius.count}</div>
              <div className="text-[9px] text-[#8b949e] uppercase tracking-tighter">Direct Dependents</div>
            </div>
            <div className="bg-[#0d1117] p-2.5 rounded-md text-center border border-[#30363d]/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#a855f7] opacity-50" />
              <div className="text-lg font-bold text-[#a855f7]">{blastRadius.transitiveCount || 0}</div>
              <div className="text-[9px] text-[#8b949e] uppercase tracking-tighter">Transitive</div>
            </div>
            <div className="bg-[#0d1117] p-2.5 rounded-md text-center border border-[#30363d]/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#22c55e] opacity-50" />
              <div className="text-lg font-bold text-[#22c55e]">{blastRadius.fnsUsed || 0}</div>
              <div className="text-[9px] text-[#8b949e] uppercase tracking-tighter">Fns Exported</div>
            </div>
            <div className="bg-[#0d1117] p-2.5 rounded-md text-center border border-[#30363d]/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#ff9f43] opacity-50" />
              <div className="text-lg font-bold text-[#ff9f43]">{blastRadius.dependencies?.length || 0}</div>
              <div className="text-[9px] text-[#8b949e] uppercase tracking-tighter">Dependencies</div>
            </div>
          </div>

          {/* Impact Score & Progress */}
          <div className="bg-[#0d1117] p-2.5 rounded-md border border-[#30363d]/50 mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <div className="text-[9px] font-semibold text-[#c9d1d9]">Impact Score</div>
              <div className="text-[10px] font-bold text-[#58a6ff]">{blastRadius.impactScore}</div>
            </div>
            <div className="w-full bg-[#30363d]/30 h-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#58a6ff] to-[#00ff9d] transition-all duration-1000" 
                style={{ width: `${Math.min(100, (blastRadius.impactScore / 20) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <div className="text-[8px] text-[#8b949e]">{blastRadius.percent}% of repo affected</div>
              <div className="text-[8px] text-[#8b949e]">Max depth: {blastRadius.depth}</div>
            </div>
          </div>

          {/* Affected Files List */}
          {blastRadius.affected.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] font-semibold text-[#c9d1d9] mb-1.5 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff9d]" />
                Directly Affected Files:
              </div>
              <div className="space-y-1">
                {blastRadius.affected.slice(0, 8).map(path => (
                  <div 
                    key={path}
                    className="flex items-center gap-1.5 text-[10px] text-[#8b949e] hover:text-[#58a6ff] cursor-pointer group"
                    onClick={() => selectFile(path)}
                  >
                    <FileCode2 size={10} className="shrink-0 group-hover:text-[#58a6ff]" />
                    <span className="truncate">{path.split('/').pop()}</span>
                    <ChevronRight size={8} className="ml-auto opacity-0 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
              {blastRadius.affected.length > 8 && (
                <div className="text-[9px] text-[#8b949e] mt-1 italic px-4">
                  +{blastRadius.affected.length - 8} more
                </div>
              )}
            </div>
          )}

          {/* Dependencies List */}
          {blastRadius.dependencies && blastRadius.dependencies.length > 0 && (
            <div>
              <div className="text-[9px] font-semibold text-[#ff9f43] mb-1.5 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff9f43]" />
                Risk Factors (Dependencies):
              </div>
              <div className="space-y-1">
                {blastRadius.dependencies.slice(0, 5).map(path => (
                  <div 
                    key={path}
                    className="flex items-center gap-1.5 text-[10px] text-[#8b949e] hover:text-[#ff9f43] cursor-pointer group"
                    onClick={() => selectFile(path)}
                  >
                    <FileCode2 size={10} className="shrink-0 group-hover:text-[#ff9f43]" />
                    <span className="truncate">{path.split('/').pop()}</span>
                    <ChevronRight size={8} className="ml-auto opacity-0 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
              {blastRadius.dependencies.length > 5 && (
                <div className="text-[9px] text-[#8b949e] mt-1 italic px-4">
                  +{blastRadius.dependencies.length - 5} more
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
