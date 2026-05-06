"use client";

import React from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { COLORS } from "../../../lib/codeflow.constants";

export default function LanguageBar() {
  const { analysisData } = useCodeflow();

  if (!analysisData?.stats?.languages || analysisData.stats.languages.length === 0) {
    return null;
  }

  const { languages } = analysisData.stats;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {/* Language Stacked Bar */}
      <div className="h-2 w-full rounded-full flex overflow-hidden bg-[#21262d]">
        {languages.slice(0, 6).map((lang, idx) => (
          <div 
            key={lang.ext} 
            style={{ 
              width: `${lang.pct}%`, 
              backgroundColor: COLORS[idx % COLORS.length] 
            }} 
            title={`${lang.ext}: ${lang.pct}%`}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
        {languages.slice(0, 6).map((lang, idx) => (
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
  );
}
