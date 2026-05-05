"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { Puzzle, Sparkles } from "lucide-react";

// Helper to render icon by name
const IconByName = ({ name, size = 16, className = "" }: { name: string, size?: number, className?: string }) => {
  // In the real app, map the string name to a Lucide icon.
  // For now, fallback to Puzzle.
  return <Puzzle size={size} className={className} />;
};

export default function PatternsPanel() {
  const { analysisData, setDrillDown } = useCodeflow();

  if (!analysisData) return null;

  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold text-[#c9d1d9] mb-4">
        <Puzzle size={16} />
        Design Patterns & Anti-Patterns
      </div>

      {analysisData.patterns.length === 0 ? (
        <div className="text-center py-10 px-4">
          <Sparkles size={48} className="mx-auto text-[#30363d] mb-4 opacity-50" />
          <div className="text-[#8b949e] font-semibold text-sm mb-1">No patterns detected</div>
          <div className="text-[#8b949e] text-[10px] opacity-70">Patterns are detected based on code structure</div>
        </div>
      ) : (
        <div className="space-y-3">
          {analysisData.patterns.map((p, i) => (
            <div 
              key={i} 
              className={`p-3 rounded-lg border cursor-pointer transition hover:brightness-110 bg-[#161b22] ${
                p.isAnti ? 'border-red-500/30' : 'border-blue-500/30'
              }`}
              onClick={() => setDrillDown({ type: "pattern", data: p })}
            >
              <div className="flex items-center gap-2 mb-2">
                <IconByName name={p.icon} size={14} className={p.isAnti ? "text-red-400" : "text-blue-400"} />
                <span className="font-semibold text-xs text-[#c9d1d9]">{p.name}</span>
                {p.isAnti && (
                  <span className="px-1.5 py-0.5 ml-auto bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[8px] font-bold uppercase">
                    Anti-pattern
                  </span>
                )}
              </div>
              <div className="text-[10px] text-[#8b949e] leading-relaxed line-clamp-3">
                {p.desc}
              </div>
              <div className="text-[9px] text-[#58a6ff] mt-2.5 font-medium">
                Click for details ({p.files.length} files) →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
