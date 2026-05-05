"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { Search, Sparkles } from "lucide-react";

export default function IssuesPanel() {
  const { analysisData, setDrillDown } = useCodeflow();

  if (!analysisData) return null;

  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold text-[#c9d1d9] mb-4">
        <Search size={16} />
        Architecture Issues ({analysisData.issues.length})
      </div>

      {analysisData.issues.length === 0 ? (
        <div className="text-center py-10 px-4">
          <Sparkles size={48} className="mx-auto text-[#30363d] mb-4 opacity-50" />
          <div className="text-[#22c55e] font-semibold text-sm mb-1">No issues detected!</div>
          <div className="text-[#8b949e] text-[10px]">Your architecture is looking clean.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {analysisData.issues.map((issue, i) => (
            <div 
              key={i} 
              className={`p-3 rounded-lg border cursor-pointer transition hover:brightness-110 bg-[#161b22] ${
                issue.type === 'critical' ? 'border-red-500/30' : 
                issue.type === 'warning' ? 'border-orange-500/30' : 
                'border-blue-500/30'
              }`}
              onClick={() => setDrillDown({ type: "issue", data: issue })}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  issue.type === 'critical' ? 'bg-red-500' : 
                  issue.type === 'warning' ? 'bg-orange-500' : 
                  'bg-blue-500'
                }`} />
                <span className="font-semibold text-xs text-[#c9d1d9]">{issue.title}</span>
              </div>
              <div className="text-[10px] text-[#8b949e] leading-relaxed line-clamp-3">
                {issue.desc}
              </div>
              <div className="text-[9px] text-[#58a6ff] mt-2.5 font-medium">
                Click for details ({issue.items ? issue.items.length : 0} items) →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
