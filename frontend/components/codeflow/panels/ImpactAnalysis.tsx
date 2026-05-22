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
      case "critical":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "high":
        return "text-[#ff6b00] bg-[#ff6b00]/10 border-[#ff6b00]/20";
      case "medium":
        return "text-[#ff8c00] bg-[#ff8c00]/10 border-[#ff8c00]/20";
      default:
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg mb-3 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#1a1a1a] transition select-none"
        onClick={() => toggleCard("blast")}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-[#e5e5e5]">
          {isOpen ? (
            <ChevronDown size={14} className="text-[#737373]" />
          ) : (
            <ChevronRight size={14} className="text-[#737373]" />
          )}
          <Zap size={14} className="text-[#ff6b00]" />
          Impact Analysis
        </div>
        <div
          className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${getLevelColor(blastRadius.level)}`}
        >
          {blastRadius.level}
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-3 pt-0 border-t border-[#1a1a1a]/50 mt-1">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3 mt-3">
            <div className="bg-[#000000] p-2.5 rounded-md text-center border border-[#1a1a1a]/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#ff6b00] opacity-50" />
              <div className="text-lg font-bold text-[#ff6b00]">{blastRadius.count}</div>
              <div className="text-[9px] text-[#737373] uppercase tracking-tighter">
                Direct Dependents
              </div>
            </div>
            <div className="bg-[#000000] p-2.5 rounded-md text-center border border-[#1a1a1a]/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#ff8c00] opacity-50" />
              <div className="text-lg font-bold text-[#ff8c00]">
                {blastRadius.transitiveCount || 0}
              </div>
              <div className="text-[9px] text-[#737373] uppercase tracking-tighter">Transitive</div>
            </div>
            <div className="bg-[#000000] p-2.5 rounded-md text-center border border-[#1a1a1a]/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 opacity-50" />
              <div className="text-lg font-bold text-blue-400">{blastRadius.fnsUsed || 0}</div>
              <div className="text-[9px] text-[#737373] uppercase tracking-tighter">
                Fns Exported
              </div>
            </div>
            <div className="bg-[#000000] p-2.5 rounded-md text-center border border-[#1a1a1a]/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-50" />
              <div className="text-lg font-bold text-amber-500">
                {blastRadius.dependencies?.length || 0}
              </div>
              <div className="text-[9px] text-[#737373] uppercase tracking-tighter">
                Dependencies
              </div>
            </div>
          </div>

          {/* Impact Score & Progress */}
          <div className="bg-[#000000] p-2.5 rounded-md border border-[#1a1a1a]/50 mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <div className="text-[9px] font-semibold text-[#e5e5e5]">Impact Score</div>
              <div className="text-[10px] font-bold text-[#ff6b00]">{blastRadius.impactScore}</div>
            </div>
            <div className="w-full bg-[#1a1a1a]/30 h-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ff8c00] to-[#ff6b00] transition-all duration-1000"
                style={{ width: `${Math.min(100, (blastRadius.impactScore / 20) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <div className="text-[8px] text-[#737373]">
                {blastRadius.percent}% of repo affected
              </div>
              <div className="text-[8px] text-[#737373]">Max depth: {blastRadius.depth}</div>
            </div>
          </div>

          {/* Affected Files List */}
          {blastRadius.affected.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] font-semibold text-[#e5e5e5] mb-1.5 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b00]" />
                Directly Affected Files:
              </div>
              <div className="space-y-1">
                {blastRadius.affected.slice(0, 8).map((path) => (
                  <div
                    key={path}
                    className="flex items-center gap-1.5 text-[10px] text-[#737373] hover:text-[#ff6b00] cursor-pointer group"
                    onClick={() => selectFile(path)}
                  >
                    <FileCode2 size={10} className="shrink-0 group-hover:text-[#ff6b00]" />
                    <span className="truncate">{path.split("/").pop()}</span>
                    <ChevronRight size={8} className="ml-auto opacity-0 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
              {blastRadius.affected.length > 8 && (
                <div className="text-[9px] text-[#737373] mt-1 italic px-4">
                  +{blastRadius.affected.length - 8} more
                </div>
              )}
            </div>
          )}

          {/* Dependencies List */}
          {blastRadius.dependencies && blastRadius.dependencies.length > 0 && (
            <div>
              <div className="text-[9px] font-semibold text-amber-500 mb-1.5 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Risk Factors (Dependencies):
              </div>
              <div className="space-y-1">
                {blastRadius.dependencies.slice(0, 5).map((path) => (
                  <div
                    key={path}
                    className="flex items-center gap-1.5 text-[10px] text-[#737373] hover:text-amber-500 cursor-pointer group"
                    onClick={() => selectFile(path)}
                  >
                    <FileCode2 size={10} className="shrink-0 group-hover:text-amber-500" />
                    <span className="truncate">{path.split("/").pop()}</span>
                    <ChevronRight size={8} className="ml-auto opacity-0 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
              {blastRadius.dependencies.length > 5 && (
                <div className="text-[9px] text-[#737373] mt-1 italic px-4">
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
